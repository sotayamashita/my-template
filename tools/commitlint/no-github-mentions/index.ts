import type { Plugin, SyncRule } from "@commitlint/types";

// Excludes emails, code spans, and scoped package names such as `@types/node`.
// Team mentions like `@org/team` share the scoped package form and pass.
const MENTION_PATTERN =
  /(?<![\w.+-]|`[^`]*)@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?![\w/-])/gu;

const rule: SyncRule = ({ raw }) => {
  const mentions = raw?.match(MENTION_PATTERN);

  if (mentions) {
    return [
      false,
      `Commit message contains GitHub mentions: ${mentions.join(", ")}. ` +
        "Remove them or wrap them in backticks to avoid notifying users.",
    ];
  }

  return [true];
};

export const noGithubMentions: Plugin = {
  rules: { "no-github-mentions": rule },
};
