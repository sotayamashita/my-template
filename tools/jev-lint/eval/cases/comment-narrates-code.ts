import { commentNarratesCode } from "../../rules/comment-narrates-code.ts";
import type { RuleCases } from "../case.ts";

export const commentNarratesCodeCases: RuleCases = {
  cases: [
    {
      at: "// Increment the counter",
      expected: true,
      name: "step narration",
      source: `export const tick = (state: { count: number }): number => {
  // Increment the counter
  return state.count + 1;
};
`,
    },
    {
      at: "// Loop over the items",
      expected: true,
      name: "loop narration",
      source: `export const sum = (items: readonly Item[]): number => {
  let total = 0;
  // Loop over the items and add each price to the total.
  for (const item of items) {
    total += item.price;
  }
  return total;
};
`,
    },
    {
      at: "/**",
      expected: false,
      name: "formula contract on a short body",
      source: `/**
 * Body mass index: weight in kilograms divided by the square of height in
 * meters, without rounding.
 */
export const bmi = (height: HeightMeter, weight: WeightKg): number =>
  weight / (height * height);
`,
    },
    {
      at: "/** 10 yen a minute",
      expected: false,
      name: "pricing rule on a one-line body",
      source: `/** 10 yen a minute for the first 5 minutes, then 22 yen a minute. */
export const callCharge = (duration: Minutes): Yen =>
  yen(duration <= 5 ? duration * 10 : 50 + (duration - 5) * 22);
`,
    },
  ],
  rule: commentNarratesCode,
};
