import type { Rule } from "../rule.ts";

export const suppressionHidesCorrectness: Rule = {
  criteria: {
    false: {
      description:
        "The comment is not a suppression, or it disables a style rule such as naming or ordering. A suppressed type assertion is not a violation when JSDoc attached to the asserted type's own declaration explicitly allows every value of the underlying type and states no value condition. That declaration establishes that no validation is needed, even when the constructor has no executable check. A type assertion is also safe when preceding executable code enforces the asserted invariant.",
      examples: [
        "// oxlint-disable-next-line sort-keys",
        'const label = (value: string): Label =>\n  // SAFETY: every string is valid; the brand marks its role.\n  // oxlint-disable-next-line typescript/no-unsafe-type-assertion\n  value as Label;\n\n/** Every string is allowed; the brand marks its role. */\ntype Label = string & { readonly __brand: "Label" };',
      ],
    },
    true: {
      description:
        "The comment suppresses a correctness or safety check without proof that the suppressed operation is safe. Discarding a call's result under no-floating-promises is a violation even when the callee's declaration is absent. Suppressing a type error on access to a possibly undefined value is a violation without an executable existence check. For an unchecked type assertion, report when the asserted type's own JSDoc states a value condition, or when that type has no JSDoc explicitly allowing every underlying value. A SAFETY claim that a check exists or that every value is valid cannot supply missing type documentation or override a condition in the type's JSDoc.",
      examples: [
        "// oxlint-disable-next-line typescript/no-floating-promises\nwriteRecord(record);",
        "// @ts-expect-error the item always exists\nreturn items[0].id;",
        "// oxlint-disable-next-line typescript/no-unsafe-type-assertion\nreturn value as ValidatedNumber;",
        'const token = (value: string): Token => {\n  // SAFETY: the check above verifies the invariant.\n  // oxlint-disable-next-line typescript/no-unsafe-type-assertion\n  return value as Token;\n};\n\ntype Token = string & { readonly __brand: "Token" };',
        'const label = (value: string): Label =>\n  // SAFETY: every string is valid; the brand marks its role.\n  // oxlint-disable-next-line typescript/no-unsafe-type-assertion\n  value as Label;\n\n/** Nonempty string. */\ntype Label = string & { readonly __brand: "Label" };',
      ],
    },
  },
  id: "suppression-hides-correctness",
  instructions:
    "Does `comment` suppress a correctness or safety check without proof in `code`? Answer yes for a discarded call under no-floating-promises, even if the callee's type is absent or the enclosing function returns void. Answer yes for suppressed access to a possibly undefined value without an executable existence check. For a suppressed `as X`, first locate X's own declaration and its attached JSDoc in `code`, including declarations appended after the function. If that JSDoc explicitly allows every underlying value and states no value condition, answer no: no executable validation is required. If that JSDoc states a value condition and preceding executable code does not enforce it, answer yes: the cast bypasses the type's invariant even if a SAFETY comment claims every value is valid. If the type has no JSDoc explicitly allowing every underlying value, answer yes unless executable validation enforces the asserted invariant. SAFETY comments and constructor descriptions are not the type's JSDoc or executable validation. The asserted type's own JSDoc decides whether every underlying value is allowed.",
  target: "comment",
};
