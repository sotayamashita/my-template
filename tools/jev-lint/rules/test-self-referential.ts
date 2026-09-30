import type { Rule } from "../rule.ts";

export const testSelfReferential: Rule = {
  criteria: {
    false: {
      description:
        "The expected value is written out or comes from an independent source.",
      examples: ['expect(slugify("Hello World")).toBe("hello-world");'],
    },
    true: {
      description:
        "The expected value comes from the same code the test checks.",
      examples: [
        "const expected = slugify(title);\nexpect(slugify(title)).toBe(expected);",
      ],
    },
  },
  id: "test-self-referential",
  instructions:
    "Does the test in `code` compute its expected value with the code under test?",
  target: "test",
};
