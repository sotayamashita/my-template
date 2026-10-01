/** A source file and whether a rule should report the fragment at `at`. */
export interface Case {
  /** Text on the first line of the comment or node to judge. */
  at: string;
  /** True when the rule should report the fragment at 0.9 or more. */
  expected: boolean;
  name: string;
  rule: string;
  source: string;
}
