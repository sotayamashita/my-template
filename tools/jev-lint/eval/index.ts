import { randomUUID } from "node:crypto";
import { parseArgs } from "node:util";

import { TypeSafeClient } from "@typesafe-ai/sdk";

import { extractFragments } from "../extract.ts";
import { ACCEPT, appendLog, ESCALATE, judge, ruleHashes } from "../judge.ts";
import { rules } from "../rules/index.ts";
import type { Case } from "./case.ts";
import { cases as commentExcusesWorkaround } from "./cases/comment-excuses-workaround.ts";
import { cases as suppressionHidesCorrectness } from "./cases/suppression-hides-correctness.ts";

const CASES: readonly Case[] = [
  ...commentExcusesWorkaround,
  ...suppressionHidesCorrectness,
];

// TypeSafe charges for input tokens only.
const USD_PER_INPUT_TOKEN = 0.042 / 1_000_000;

const { values } = parseArgs({
  options: {
    rule: { type: "string" },
    runs: { default: "1", type: "string" },
  },
});

if ((process.env["TYPESAFE_API_KEY"] ?? "") === "") {
  process.stderr.write("jev-lint eval: set TYPESAFE_API_KEY to run.\n");
  process.exit(1);
}

const client = new TypeSafeClient();
const rulesById = new Map(rules.map((rule) => [rule.id, rule]));
const runs = Number(values.runs);
const selected = CASES.filter(
  (testCase) => values.rule === undefined || testCase.rule === values.rule
);

// The fragment that starts nearest above `at`, the way jev-lint would see it.
const fragmentFor = (testCase: Case, target: string) => {
  const line =
    testCase.source
      .split("\n")
      .findIndex((text) => text.includes(testCase.at)) + 1;
  const fragment = extractFragments(
    "case.ts",
    testCase.source,
    new Set([line])
  ).findLast(
    (candidate) =>
      candidate.line <= line && candidate.targets.some((t) => t === target)
  );
  if (line === 0 || fragment === undefined) {
    throw new Error(
      `No ${target} fragment at "${testCase.at}" in "${testCase.name}".`
    );
  }
  return fragment;
};

const results = await Promise.all(
  selected.map(async (testCase) => {
    const rule = rulesById.get(testCase.rule);
    if (rule === undefined) {
      throw new Error(`Unknown rule "${testCase.rule}" in "${testCase.name}".`);
    }
    const fragment = fragmentFor(testCase, rule.target);
    const answers = await Promise.all(
      Array.from(
        { length: runs },
        async () => await judge(client, fragment, [rule])
      )
    );
    const probabilities = answers.map(
      (answer) => answer.probabilities[rule.id] ?? 0
    );
    const mean =
      probabilities.reduce((sum, probability) => sum + probability, 0) / runs;

    return {
      expected: testCase.expected,
      fragmentKey: answers[0]?.fragmentKey,
      inputTokens: answers.reduce(
        (sum, answer) => sum + answer.usage.input_tokens,
        0
      ),
      mean,
      name: testCase.name,
      probabilities,
      reported: mean >= ACCEPT,
      rule: rule.id,
      unsure: mean >= ESCALATE && mean < ACCEPT,
    };
  })
);

const inputTokens = results.reduce((sum, { inputTokens: n }) => sum + n, 0);

appendLog("evals.jsonl", [
  {
    evalId: randomUUID(),
    inputTokens,
    results,
    ruleHashes: ruleHashes(),
    runs,
    thresholds: { accept: ACCEPT, escalate: ESCALATE },
    time: new Date().toISOString(),
  },
]);

const caseLines = results.map((result) => {
  const verdict = result.reported === result.expected ? "pass" : "FAIL";
  const spread = result.probabilities.map((p) => p.toFixed(2)).join(" ");
  const want = result.expected ? "report" : "skip";
  return `${verdict} ${result.rule} "${result.name}" want ${want}, got ${result.mean.toFixed(2)} (${spread})${result.unsure ? " unsure" : ""}\n`;
});

const summary = [...Map.groupBy(results, (result) => result.rule)].map(
  ([rule, ruleResults]) => {
    const count = (expected: boolean, reported: boolean) =>
      ruleResults.filter(
        (result) => result.expected === expected && result.reported === reported
      ).length;
    const unsure = ruleResults.filter((result) => result.unsure).length;
    return `${rule}: TP ${count(true, true)} FP ${count(false, true)} FN ${count(true, false)} TN ${count(false, false)} unsure ${unsure}\n`;
  }
);

process.stdout.write(
  [
    ...caseLines,
    "\n",
    ...summary,
    `\n${inputTokens} input tokens, $${(inputTokens * USD_PER_INPUT_TOKEN).toFixed(5)}\n`,
  ].join("")
);
