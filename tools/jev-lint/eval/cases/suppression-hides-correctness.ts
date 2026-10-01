import { suppressionHidesCorrectness } from "../../rules/suppression-hides-correctness.ts";
import type { Case } from "../case.ts";
import { smartConstructor, uncheckedBrand } from "./smart-constructor.ts";

const rule = suppressionHidesCorrectness.id;

export const cases: readonly Case[] = [
  {
    at: "// oxlint-disable-next-line typescript/no-floating-promises",
    expected: true,
    name: "floating promise",
    rule,
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
    rule,
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
    rule,
    source: uncheckedBrand,
  },
  {
    at: "// oxlint-disable-next-line sort-keys",
    expected: false,
    name: "style rule",
    rule,
    source: `// oxlint-disable-next-line sort-keys
export const levels = { low: 1, high: 3, medium: 2 };
`,
  },
  {
    at: "// SAFETY:",
    expected: false,
    name: "smart constructor brand cast",
    rule,
    source: smartConstructor,
  },
];
