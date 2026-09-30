# Apply the Template

Align this repository with https://github.com/sotayamashita/my-template.

1. Read:
   - The template's files and `docs/practices/`
   - This repository's agent instructions and `git status`
2. Compare each template file with its counterpart here.
   - List what is missing or different.
   - Skip `src/index.ts`, `README.md`, and `docs/prompts/`.
3. Propose the changes as diffs before editing.
   - Group them into atomic commits.
   - Keep this repository's own rules, scripts, and dependencies.
   - Keep newer tool and package versions over the template's pins.
   - Ask before replacing a tool the template lacks, such as ESLint.
   - Ask whether to adopt `tools/jev-lint`.
     - Tell the user it sends code to the TypeSafe API and needs a key.
     - If declined, drop it with its recipe, script, deps, and `fnox.toml` key.
4. Apply only the approved changes.
5. Verify:
   - `just setup`
   - `just check`
   - `just typecheck`
   - `printf 'bad message\n' | pnpm exec commitlint` fails

Complete when:

- Each difference is applied, kept on purpose, or awaiting the user.
- The checks pass.
