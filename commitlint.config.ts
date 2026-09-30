import type { UserConfig } from "@commitlint/types";

import { noGithubMentions } from "./tools/commitlint/no-github-mentions/index.ts";

export default {
  extends: ["@commitlint/config-conventional"],
  plugins: [noGithubMentions],
  rules: {
    "no-github-mentions": [2, "always"],
  },
} satisfies UserConfig;
