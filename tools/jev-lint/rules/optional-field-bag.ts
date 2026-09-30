import type { Rule } from "../rule.ts";

export const optionalFieldBag: Rule = {
  criteria: {
    false: {
      description:
        "Each valid state is its own variant, or the fields are independent.",
      examples: [
        'type Task = { status: "open" } | { status: "done"; completedAt: Date };',
        "interface Options { verbose?: boolean; cwd?: string }",
      ],
    },
    true: {
      description:
        "Some combinations of the fields describe an impossible state.",
      examples: [
        "interface Task { done: boolean; completedAt?: Date }",
        "type Request = { loading: boolean; error?: Error; data?: Data };",
      ],
    },
  },
  id: "optional-field-bag",
  instructions:
    "Can the optional fields or booleans in `code` form a combination that makes no sense?",
  target: "type",
};
