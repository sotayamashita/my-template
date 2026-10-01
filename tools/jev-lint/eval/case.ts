import type { Rule } from "../rule.ts";

/** A source file and whether the rule should report the fragment at `at`. */
export interface Case {
  /** Text on the first line of the comment or node to judge. */
  at: string;
  /** True when the rule should report the fragment at 0.9 or more. */
  expected: boolean;
  name: string;
  source: string;
}

/** One rule and the cases it is measured on. */
export interface RuleCases {
  cases: readonly Case[];
  rule: Rule;
}
