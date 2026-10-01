import { defineConfig } from "oxlint";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";

export default defineConfig({
  extends: [core, antiSlop],
  ignorePatterns: [...(core.ignorePatterns ?? []), ".agents/**", ".claude/**"],
  jsPlugins: ["oxlint-plugin-complexity"],
  // Ultracite core already sets typed rules such as no-floating-promises;
  // they only run with type-aware linting.
  options: { typeAware: true },
  // Core directories hold pure functions, so their signatures and tests are the
  // whole contract. I/O, the clock, and randomness stay outside it.
  overrides: [
    {
      files: ["src/core/**", "tools/jev-lint/core/**"],
      rules: {
        "no-restricted-globals": [
          "error",
          { message: "Pass the time in as an argument.", name: "Date" },
          { message: "Do I/O outside src/core.", name: "fetch" },
        ],
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              { group: ["node:*"], message: "Do I/O outside src/core." },
            ],
          },
        ],
        "no-restricted-properties": [
          "error",
          {
            message: "Pass random values in as arguments.",
            object: "Math",
            property: "random",
          },
        ],
      },
    },
  ],
  rules: {
    // Ultracite core enables oxlint's complexity rule; oxlint-plugin-complexity
    // also reports cyclomatic complexity, with a breakdown agents can act on.
    complexity: "off",
    "complexity/complexity": "error",
    // A changed argument is a result that the signature does not show.
    "no-param-reassign": ["error", { props: true }],
  },
});
