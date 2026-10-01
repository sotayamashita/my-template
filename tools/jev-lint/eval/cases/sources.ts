// A smart constructor checks the invariant, then brands the value with a
// suppressed type assertion. docs/practices/code-design.md recommends it.
export const smartConstructor = `/** Order quantity, an integer from 1 to 20. */
export type Quantity = number & { readonly __brand: "Quantity" };

export const quantity = (value: number): Quantity => {
  if (!Number.isInteger(value) || value < 1 || value > 20) {
    throw new RangeError("Quantity must be an integer from 1 to 20.");
  }
  // SAFETY: the check above enforces the Quantity invariant.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return value as Quantity;
};
`;

// The same comment with no check before it.
export const uncheckedBrand = `export type Quantity = number & { readonly __brand: "Quantity" };

export const quantity = (value: number): Quantity => {
  // SAFETY: the check above enforces the Quantity invariant.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return value as Quantity;
};
`;

export const sortKeysSuppression = `// oxlint-disable-next-line sort-keys
export const levels = { low: 1, high: 3, medium: 2 };
`;

// A level 2 brand: the type allows every string, so there is nothing to check.
export const roleBrand = `/** Parser file name. Every string is allowed; the brand marks its role. */
export type SourceFilePath = string & { readonly __brand: "SourceFilePath" };

/** Return the same string as a parser file name; no value is rejected. */
export const sourceFilePath = (value: string): SourceFilePath =>
  // SAFETY: every string is a valid SourceFilePath; the brand marks its role.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  value as SourceFilePath;
`;

// The same constructor for a type whose JSDoc states a condition.
export const roleBrandWithCondition = `/** Email address; must contain exactly one "@". */
export type Email = string & { readonly __brand: "Email" };

/** Return the string as an email address. */
export const email = (value: string): Email =>
  // SAFETY: every string is a valid Email; the brand marks its role.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  value as Email;
`;
