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
