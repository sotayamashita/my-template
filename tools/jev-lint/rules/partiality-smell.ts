import type { Rule } from "../rule.ts";

export const partialitySmell: Rule = {
  criteria: {
    false: {
      description:
        "The check handles a case the input can really have, or there is no such check.",
      examples: ["if (response.status === 404) return undefined;"],
    },
    true: {
      description:
        "The check guards a case that a tighter input type would rule out.",
      examples: [
        'if (order.paidAt === undefined) throw new Error("unreachable: paid orders have paidAt");',
      ],
    },
  },
  id: "partiality-smell",
  instructions:
    "Does `code` hold a 'never happens' throw or null check that exists only because its input type is too loose?",
  target: "function",
};
