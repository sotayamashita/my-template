import type { KnipConfig } from "knip";

export default {
  // Run by hand with node; no script or import points at it.
  entry: ["tools/jev-lint/eval/index.ts"],
  // hk.pkl runs commitlint in the commit-msg hook, which knip does not read.
  ignoreDependencies: ["@commitlint/cli"],
} satisfies KnipConfig;
