import type { Rule } from "../rule.ts";

export const unbrandedLookalikeParams: Rule = {
  criteria: {
    false: {
      description:
        "The parameters have distinct types, come in an options object, or share one meaning.",
      examples: [
        "function transfer({ from, to }: { from: AccountId; to: AccountId }) {}",
        "function max(a: number, b: number) {}",
      ],
    },
    true: {
      description:
        "Swapping two parameters would compile but change the meaning.",
      examples: [
        "function transfer(fromId: string, toId: string, amount: number) {}",
      ],
    },
  },
  id: "unbranded-lookalike-params",
  instructions:
    "Does `code` take two or more parameters of one primitive type with different meanings, so swapping them still compiles?",
  target: "function",
};
