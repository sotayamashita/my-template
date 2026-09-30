import type { Rule } from "../rule.ts";

export const lyingTypeGuard: Rule = {
  criteria: {
    false: {
      description: "The guard checks everything the claimed type requires.",
      examples: [
        'const isName = (value: unknown): value is string => typeof value === "string";',
      ],
    },
    true: {
      description: "The guard checks less than the claimed type requires.",
      examples: [
        'function isUser(value: unknown): value is User { return typeof value === "object" && value !== null; }',
      ],
    },
  },
  id: "lying-type-guard",
  instructions:
    "Can the type guard in `code` return true for a value that is not fully the type it claims?",
  target: "type-guard",
};
