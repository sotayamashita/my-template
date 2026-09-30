import type { Rule } from "../rule.ts";

export const testObservesNoBehavior: Rule = {
  criteria: {
    false: {
      description:
        "The test asserts on a value or effect that the imported code must produce.",
      examples: ["expect(add(1, 2)).toBe(3);"],
    },
    true: {
      description:
        "The assertions do not depend on what the imported code does.",
      examples: [
        'test("saves", () => { save(user); expect(true).toBe(true); });',
      ],
    },
  },
  id: "test-observes-no-behavior",
  instructions:
    "Would the test in `code` still pass if every function from `imports` returned undefined?",
  target: "test",
};
