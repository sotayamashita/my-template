import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

import { noul, TypeSafeClient } from "@typesafe-ai/sdk";

import { extractFragments } from "./extract.ts";
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

// Jev judges as well as a reasoning model at 0.9 or more, so accept those.
// Below that, most of its errors fall in; the reading agent decides instead.
// See https://arxiv.org/abs/2609.26550
const ACCEPT = 0.9;
const ESCALATE = 0.5;

const UNSURE_NOTE =
  "\nJev was unsure about the findings marked unsure. Read the code at each one and answer its question yourself before changing anything.\n";

const HUNK_HEADER = /^@@ -\S+ \+(?<start>\d+)(?:,(?<count>\d+))? @@/u;

const diffLinesByFile = (
  compareWith: readonly string[]
): Map<string, Set<number>> => {
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
  const changed = new Map<string, Set<number>>();
  let lines = new Set<number>();

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
      for (let line = start; line < start + count; line += 1) {
        lines.add(line);
      }
    }
  }

  return changed;
};

// `git diff` skips untracked files, where new work sits until it is staged.
const untrackedLinesByFile = (): Map<string, Set<number>> => {
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
          new Set(Array.from({ length: lineCount }, (_, i) => i + 1)),
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
const rulesByTarget = Map.groupBy(rules, (rule) => rule.target);

const changedLines = new Map(
  values.staged
    ? diffLinesByFile(["--cached"])
    : [...diffLinesByFile([values.base]), ...untrackedLinesByFile()]
);

const fragments = [...changedLines].flatMap(([file, lines]) =>
  extractFragments(file, readFileSync(file, "utf-8"), lines)
);

const findings = await Promise.all(
  fragments.map(async ({ file, line, state, targets }) => {
    const fragmentRules = targets.flatMap(
      (target) => rulesByTarget.get(target) ?? []
    );
    const { answers } = await client.systemOne({
      questions: Object.fromEntries(
        fragmentRules.map((rule) => [
          rule.id,
          noul(rule.instructions, rule.criteria),
        ])
      ),
      state,
    });

    return fragmentRules.flatMap((rule) => {
      const probability = answers[rule.id]?.noul ?? 0;
      return probability >= ESCALATE
        ? [{ file, line, probability, rule, unsure: probability < ACCEPT }]
        : [];
    });
  })
).then((results) => results.flat());

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
