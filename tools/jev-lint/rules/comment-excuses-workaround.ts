import type { Rule } from "../rule.ts";

export const commentExcusesWorkaround: Rule = {
  criteria: {
    false: {
      description:
        "The comment names an outside constraint we cannot change, such as a browser, vendor API, or spec, or it excuses nothing, such as a bare lint suppression.",
      examples: [
        "// Safari fires `blur` before `click`, so close the menu on mousedown.",
        "// oxlint-disable-next-line sort-keys",
      ],
    },
    true: {
      description:
        "The comment defends odd or temporary code that we control, such as 'fine for now', 'do not remove', or a long apology.",
      examples: [
        "// Hacky, but fine for now.",
        "// Do not remove this sleep; things break without it.",
      ],
    },
  },
  id: "comment-excuses-workaround",
  instructions:
    "Does `comment` excuse a surprise in our own `code` instead of fixing it?",
  target: "comment",
};
