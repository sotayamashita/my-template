import type { Rule } from "../rule.ts";

export const redundantInternalValidation: Rule = {
  criteria: {
    false: {
      description:
        "The function validates untyped input at a boundary, or checks what the type does not guarantee.",
      examples: ["const config = ConfigSchema.parse(JSON.parse(text));"],
    },
    true: {
      description:
        "The function repeats a check that the parameter type already proves.",
      examples: [
        'function charge(order: PaidOrder) { if (!order.paidAt) throw new Error("not paid"); }',
      ],
    },
  },
  id: "redundant-internal-validation",
  instructions:
    "Does `code` recheck data that its type already guarantees, away from an input boundary such as a request, file, or env var?",
  target: "function",
};
