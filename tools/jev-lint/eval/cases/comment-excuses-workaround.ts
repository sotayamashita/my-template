import { commentExcusesWorkaround } from "../../rules/comment-excuses-workaround.ts";
import type { RuleCases } from "../case.ts";
import { smartConstructor, sortKeysSuppression } from "./sources.ts";

export const commentExcusesWorkaroundCases: RuleCases = {
  cases: [
    {
      at: "// Hacky, but fine for now.",
      expected: true,
      name: "fine for now",
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
      source: sortKeysSuppression,
    },
    {
      at: "// SAFETY:",
      expected: false,
      name: "smart constructor brand cast",
      source: smartConstructor,
    },
  ],
  rule: commentExcusesWorkaround,
};
