# my-template

TypeScript project template.

## Setup

```sh
mise install
just setup
```

Zed needs the [tsgo extension](https://zed.dev/extensions/tsgo) for TS 7:

```sh
open zed://extension/tsgo
```

## Commands

```sh
just            # List commands
just check      # Check lint rules and formatting
just fix        # Fix lint violations and formatting
just typecheck  # Check TypeScript types
just test       # Run tests
```

## Opinionated stack

| Role                    | Tool                             |
| ----------------------- | -------------------------------- |
| Tool versions           | mise                             |
| Tasks                   | just                             |
| Packages                | pnpm                             |
| Git hooks               | hk                               |
| Commit messages         | commitlint                       |
| Secret scanning         | gitleaks                         |
| Secrets                 | fnox with 1Password              |
| Type checking           | TypeScript                       |
| Tests                   | Vitest with fast-check           |
| TypeScript presets      | [tsconfig/bases][tsconfig-bases] |
| Lint                    | oxlint                           |
| Format                  | oxfmt                            |
| Lint and format presets | Ultracite                        |
| Unused code             | knip                             |
| Duplicate code          | jscpd                            |
| Semantic lint           | [jev-lint](tools/jev-lint)       |

[tsconfig-bases]: https://github.com/tsconfig/bases

## Apply to an existing repository

Give a coding agent this prompt in the target repository:

```text
Follow https://raw.githubusercontent.com/sotayamashita/my-template/main/docs/prompts/apply.md
```
