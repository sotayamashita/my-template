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
  rules: {
    // Ultracite core enables oxlint's complexity rule; oxlint-plugin-complexity
    // also reports cyclomatic complexity, with a breakdown agents can act on.
    complexity: "off",
    "complexity/complexity": "error",
  },
});
