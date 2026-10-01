import { commentExcusesWorkaround } from "../../rules/comment-excuses-workaround.ts";
import type { Case } from "../case.ts";
import { smartConstructor } from "./smart-constructor.ts";

const rule = commentExcusesWorkaround.id;

export const cases: readonly Case[] = [
  {
    at: "// Hacky, but fine for now.",
    expected: true,
    name: "fine for now",
    rule,
    source: `export const total = (items: Item[]): number => {
  // Hacky, but fine for now.
  return JSON.parse(JSON.stringify(items)).reduce(sum, 0);
};
`,
  },
  {
    at: "// Do not remove this sleep",
    expected: true,
    name: "unexplained sleep",
    rule,
    source: `export const sync = async (queue: Queue): Promise<void> => {
  // Do not remove this sleep; things break without it.
  await sleep(500);
  await queue.flush();
};
`,
  },
  {
    at: "// Safari fires",
    expected: false,
    name: "browser constraint",
    rule,
    source: `export const bindMenu = (menu: Menu): void => {
  // Safari fires \`blur\` before \`click\`, so close the menu on mousedown.
  menu.on("mousedown", menu.close);
};
`,
  },
  {
    at: "// oxlint-disable-next-line sort-keys",
    expected: false,
    name: "bare lint suppression",
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
