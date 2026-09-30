import type { Rule } from "../rule.ts";

export const swallowedError: Rule = {
  criteria: {
    false: {
      description:
        "There is no catch, or it rethrows, returns a typed failure, or falls back as documented.",
      examples: [
        "catch (error) { throw new LoadError(path, { cause: error }); }",
      ],
    },
    true: {
      description:
        "The catch returns a default, only logs, or continues, so the caller cannot tell the operation failed.",
      examples: ["try { return await loadUsers(); } catch { return []; }"],
    },
  },
  id: "swallowed-error",
  instructions:
    "Does a catch in `code` hide a failure that the caller needed to know about?",
  target: "function",
};
