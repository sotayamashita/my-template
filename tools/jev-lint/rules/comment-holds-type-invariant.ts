import type { Rule } from "../rule.ts";

export const commentHoldsTypeInvariant: Rule = {
  criteria: {
    false: {
      description:
        "The comment states no such rule, or the type already encodes it.",
      examples: ["// Milliseconds since the Unix epoch.\ntimestamp: number;"],
    },
    true: {
      description:
        "The comment carries a rule about field combinations that the type leaves open.",
      examples: [
        "// `completedAt` is set only when `done` is true.\ninterface Task { done: boolean; completedAt?: Date }",
      ],
    },
  },
  id: "comment-holds-type-invariant",
  instructions:
    "Does `comment` state which field values may go together, where the type in `code` could encode that rule instead?",
  target: "comment",
};
