import type { Rule } from "../rule.ts";

export const commentNarratesCode: Rule = {
  criteria: {
    false: {
      description:
        "The comment gives a reason: an outside constraint, a contract, a license, or a non-obvious why. A doc comment on a function that states the required input-output relation, such as a formula, rounding, or pricing rule, is a contract even when the body computes it in one line.",
      examples: [
        "// Safari fires `blur` before `click`, so close the menu on mousedown.",
        "/** Returns null when the user has no active session. */",
        "/** 15% of the price, rounded down to the yen. */",
      ],
    },
    true: {
      description: "The comment narrates the code, or labels a section of it.",
      examples: [
        "// Increment the counter\ncount += 1;",
        "// ----- Helpers -----",
      ],
    },
  },
  id: "comment-narrates-code",
  instructions:
    "Does `comment` only restate what `code` does, adding no reason that `code` cannot show?",
  target: "comment",
};
