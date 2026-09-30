import type { Rule } from "../rule.ts";

export const suppressionHidesCorrectness: Rule = {
  criteria: {
    false: {
      description:
        "The comment is not a suppression, or it disables a style rule such as naming or ordering.",
      examples: ["// oxlint-disable-next-line sort-keys"],
    },
    true: {
      description:
        "The comment disables a rule about bugs, types, promises, or security.",
      examples: [
        "// oxlint-disable-next-line typescript/no-floating-promises",
        "// @ts-expect-error the value is always defined",
      ],
    },
  },
  id: "suppression-hides-correctness",
  instructions:
    "Does `comment` suppress a lint or type check that guards the correctness or safety of `code`?",
  target: "comment",
};
