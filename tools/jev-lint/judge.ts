import { createHash } from "node:crypto";
import { appendFileSync, mkdirSync } from "node:fs";

import { noul } from "@typesafe-ai/sdk";
import type { TypeSafeClient } from "@typesafe-ai/sdk";

import type { Fragment } from "./extract.ts";
import type { Rule } from "./rule.ts";
import { rules } from "./rules/index.ts";

// Jev judges as well as a reasoning model at 0.9 or more, so accept those.
// Below that, most of its errors fall in; the reading agent decides instead.
// @see {@link https://arxiv.org/abs/2609.26550}
export const ACCEPT = 0.9;
export const ESCALATE = 0.5;

const LOG_DIR = new URL("log/", import.meta.url);

const hash = (value: Fragment["state"] | Rule) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 12);

// Labels join on these, so editing one rule leaves the others' history valid.
export const ruleHashes = () =>
  Object.fromEntries(rules.map((rule) => [rule.id, hash(rule)]));

export const appendLog = (name: string, records: readonly object[]) => {
  mkdirSync(LOG_DIR, { recursive: true });
  appendFileSync(
    new URL(name, LOG_DIR),
    records.map((record) => `${JSON.stringify(record)}\n`).join("")
  );
};

/** Ask Jev every rule's question about one fragment in a single request. */
export const judge = async (
  client: TypeSafeClient,
  { line, state, targets }: Fragment,
  fragmentRules: readonly Rule[]
) => {
  const startedAt = performance.now();
  const { data, requestId } = await client
    .systemOne({
      questions: Object.fromEntries(
        fragmentRules.map((rule) => [
          rule.id,
          noul(rule.instructions, rule.criteria),
        ])
      ),
      state,
    })
    .withResponse();

  return {
    // The same code keeps its key across runs, so one label covers them all.
    fragmentKey: hash(state),
    latencyMs: Math.round(performance.now() - startedAt),
    line,
    model: data.model,
    probabilities: Object.fromEntries(
      fragmentRules.map((rule) => [rule.id, data.answers[rule.id]?.noul ?? 0])
    ),
    requestId,
    state,
    targets,
    usage: data.usage,
  };
};
