import type { UserConfig } from "@commitlint/types";

import { noGithubMentions } from "./tools/commitlint/no-github-mentions/index.ts";

export default {
  extends: ["@commitlint/config-conventional"],
  plugins: [noGithubMentions],
  rules: {
    // Agents tend to write long headers; 72 keeps them whole in
    // `git log --oneline` and GitHub, unlike the preset's 100.
    "header-max-length": [2, "always", 72],
    "no-github-mentions": [2, "always"],
  },
} satisfies UserConfig;
