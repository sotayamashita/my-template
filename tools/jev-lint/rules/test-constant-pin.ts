import type { Rule } from "../rule.ts";

export const testConstantPin: Rule = {
  criteria: {
    false: {
      description: "The test runs code on an input and checks the result.",
      examples: ['expect(parseTimeout("5s")).toBe(5000);'],
    },
    true: {
      description:
        "The test restates a literal that someone maintains by hand.",
      examples: [
        "expect(DEFAULT_TIMEOUT).toBe(5000);",
        'expect(SYSTEM_PROMPT).toContain("concise");',
      ],
    },
  },
  id: "test-constant-pin",
  instructions:
    "Does the test in `code` assert that a hand-written constant, default, or message equals itself, instead of running logic on an input?",
  target: "test",
};
