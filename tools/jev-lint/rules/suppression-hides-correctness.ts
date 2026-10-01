import type { Rule } from "../rule.ts";

export const suppressionHidesCorrectness: Rule = {
  criteria: {
    false: {
      description:
        "The comment is not a suppression, or it disables a style rule such as naming or ordering. A suppressed type assertion is also safe when executable code first rejects values that violate the asserted type's invariant.",
      examples: ["// oxlint-disable-next-line sort-keys"],
    },
    true: {
      description:
        "The comment disables a correctness or safety check without equivalent protection in executable code. A no-floating-promises suppression on a call whose result is discarded is a violation even when the callee's declaration is not shown: the disabled rule identifies the promise-handling requirement. Other violations include access to a possibly undefined value and a type assertion without validation of the asserted invariant.",
      examples: [
        "// oxlint-disable-next-line typescript/no-floating-promises\nwriteRecord(record);",
        "// @ts-expect-error the value is always defined",
        "// oxlint-disable-next-line typescript/no-unsafe-type-assertion\nreturn value as ValidatedNumber;",
      ],
    },
  },
  id: "suppression-hides-correctness",
  instructions:
    "Does `comment` disable a correctness or safety rule? Determine the rule's purpose from its name: no-floating-promises guards promise handling even if the callee's type is absent or the enclosing function returns void. Answer no when executable validation in `code` before a suppressed type assertion enforces the asserted invariant. A comment claiming safety is not evidence of validation.",
  target: "comment",
};
