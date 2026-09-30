import type { Rule } from "../rule.ts";

export const passThroughWrapper: Rule = {
  criteria: {
    false: {
      description:
        "The function changes arguments or results, adds a check or default, or narrows a wide API to one use.",
      examples: [
        'const getUser = (id: string) => fetchUser(id, { cache: "no-store" });',
      ],
    },
    true: {
      description: "The function passes its arguments through unchanged.",
      examples: ["const getUser = (id: string) => fetchUser(id);"],
    },
  },
  id: "pass-through-wrapper",
  instructions:
    "Does `code` only forward its arguments to one other call, adding no policy, adaptation, or clearer name?",
  target: "function",
};
