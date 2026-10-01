import type { KnipConfig } from "knip";

export default {
  // hk.pkl runs commitlint in the commit-msg hook, which knip does not read.
  ignoreDependencies: ["@commitlint/cli"],
} satisfies KnipConfig;
