import { noul } from "@typesafe-ai/sdk";

import type { Rule } from "../rule.ts";

export const commentNarratesCode: Rule = {
  id: "comment-narrates-code",
  question: noul(
    "Does `comment` only restate what `code` does, adding no reason that `code` cannot show?",
    {
      false: {
        description:
          "The comment gives a reason: an outside constraint, a contract, a license, or a non-obvious why.",
        examples: [
          "// Safari fires `blur` before `click`, so close the menu on mousedown.",
          "/** Returns null when the user has no active session. */",
        ],
      },
      true: {
        description:
          "The comment narrates the code, or labels a section of it.",
        examples: [
          "// Increment the counter\ncount += 1;",
          "// ----- Helpers -----",
        ],
      },
    }
  ),
};
