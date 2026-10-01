import { suppressionHidesCorrectness } from "../../rules/suppression-hides-correctness.ts";
import type { RuleCases } from "../case.ts";
import {
  roleBrand,
  roleBrandWithCondition,
  smartConstructor,
  sortKeysSuppression,
  uncheckedBrand,
} from "./sources.ts";

export const suppressionHidesCorrectnessCases: RuleCases = {
  cases: [
    {
      at: "// oxlint-disable-next-line typescript/no-floating-promises",
      expected: true,
      name: "floating promise",
      source: `export const save = (db: Db, user: User): void => {
  // oxlint-disable-next-line typescript/no-floating-promises
  db.insert(user);
};
`,
    },
    {
      at: "// @ts-expect-error",
      expected: true,
      name: "type error on a maybe-undefined value",
      source: `export const firstName = (users: User[]): string => {
  // @ts-expect-error the value is always defined
  return users[0].name;
};
`,
    },
    {
      at: "// SAFETY:",
      expected: true,
      name: "brand cast without a check",
      source: uncheckedBrand,
    },
    {
      at: "// oxlint-disable-next-line sort-keys",
      expected: false,
      name: "style rule",
      source: sortKeysSuppression,
    },
    {
      at: "// SAFETY:",
      expected: false,
      name: "smart constructor brand cast",
      source: smartConstructor,
    },
    {
      at: "// SAFETY:",
      expected: false,
      name: "role brand that allows every value",
      source: roleBrand,
    },
    {
      at: "// SAFETY:",
      expected: true,
      name: "role brand cast for a type with a condition",
      source: roleBrandWithCondition,
    },
  ],
  rule: suppressionHidesCorrectness,
};
