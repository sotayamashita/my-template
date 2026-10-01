import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

import { TypeSafeClient } from "@typesafe-ai/sdk";

import type { Line } from "./core/extract.ts";
import {
  extractFragments,
  line as sourceLine,
  sourceFilePath,
  sourceText,
} from "./core/extract.ts";
import { ACCEPT, appendLog, ESCALATE, judge, ruleHashes } from "./judge.ts";
import { rules } from "./rules/index.ts";

const SOURCE_PATHSPECS = [
  "*.js",
  "*.mjs",
  "*.cjs",
  "*.ts",
  "*.mts",
  "*.cts",
  "*.jsx",
  "*.tsx",
];

const UNSURE_NOTE =
  "\nJev was unsure about the findings marked unsure. Read the code at each one and answer its question yourself before changing anything.\n";

const HUNK_HEADER = /^@@ -\S+ \+(?<start>\d+)(?:,(?<count>\d+))? @@/u;

const diffLinesByFile = (
  compareWith: readonly string[]
): Map<string, Set<Line>> => {
  const diff = execFileSync(
    "git",
    [
      "diff",
      "--unified=0",
      "--no-color",
      "--diff-filter=AM",
      ...compareWith,
      "--",
      ...SOURCE_PATHSPECS,
    ],
    { encoding: "utf-8" }
  );
  const changed = new Map<string, Set<Line>>();
  let lines = new Set<Line>();

  for (const text of diff.split("\n")) {
    if (text.startsWith("+++ b/")) {
      lines = new Set();
      changed.set(text.slice("+++ b/".length), lines);
      continue;
    }

    const hunk = HUNK_HEADER.exec(text)?.groups;
    if (hunk?.["start"] !== undefined) {
      const start = Number(hunk["start"]);
      const count = Number(hunk["count"] ?? "1");
      for (
        let lineNumber = start;
        lineNumber < start + count;
        lineNumber += 1
      ) {
        lines.add(sourceLine(lineNumber));
      }
    }
  }

  return changed;
};

// `git diff` skips untracked files, where new work sits until it is staged.
const untrackedLinesByFile = (): Map<string, Set<Line>> => {
  const files = execFileSync(
    "git",
    ["ls-files", "--others", "--exclude-standard", "--", ...SOURCE_PATHSPECS],
    { encoding: "utf-8" }
  );

  return new Map(
    files
      .split("\n")
      .filter((file) => file !== "")
      .map((file) => {
        const lineCount = readFileSync(file, "utf-8").split("\n").length;
        return [
          file,
          new Set(
            Array.from({ length: lineCount }, (_, i) => sourceLine(i + 1))
          ),
        ];
      })
  );
};

const { values } = parseArgs({
  options: {
    base: { default: "main", type: "string" },
    staged: { default: false, type: "boolean" },
  },
});

if ((process.env["TYPESAFE_API_KEY"] ?? "") === "") {
  process.stderr.write("jev-lint: set TYPESAFE_API_KEY to run.\n");
  process.exit(0);
}

const client = new TypeSafeClient();
const rulesById = new Map(rules.map((rule) => [rule.id, rule]));
const rulesByTarget = Map.groupBy(rules, (rule) => rule.target);

const changedLines = new Map(
  values.staged
    ? diffLinesByFile(["--cached"])
    : [...diffLinesByFile([values.base]), ...untrackedLinesByFile()]
);

const fragments = [...changedLines].flatMap(([file, lines]) =>
  extractFragments(
    sourceFilePath(file),
    sourceText(readFileSync(file, "utf-8")),
    lines
  )
);

if (fragments.length === 0) {
  process.exit(0);
}

const runId = randomUUID();

appendLog("runs.jsonl", [
  {
    base: values.base,
    head: execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf-8",
    }).trim(),
    ruleHashes: ruleHashes(),
    runId,
    staged: values.staged,
    thresholds: { accept: ACCEPT, escalate: ESCALATE },
    time: new Date().toISOString(),
  },
]);

const records = await Promise.all(
  fragments.map(async (fragment) => ({
    ...(await judge(
      client,
      fragment,
      fragment.targets.flatMap((target) => rulesByTarget.get(target) ?? [])
    )),
    runId,
  }))
);

appendLog("requests.jsonl", records);

const findings = records.flatMap(({ line, probabilities, state }) =>
  Object.entries(probabilities).flatMap(([id, probability]) => {
    const rule = rulesById.get(id);
    return rule && probability >= ESCALATE
      ? [
          {
            file: state.file,
            line,
            probability,
            rule,
            unsure: probability < ACCEPT,
          },
        ]
      : [];
  })
);

process.stdout.write(
  findings
    .map(({ file, line, probability, rule, unsure }) => {
      const head = `${file}:${line} ${rule.id} ${probability.toFixed(2)}`;
      return unsure ? `${head} unsure\n  ${rule.instructions}\n` : `${head}\n`;
    })
    .join("")
);
if (findings.some(({ unsure }) => unsure)) {
  process.stdout.write(UNSURE_NOTE);
}
