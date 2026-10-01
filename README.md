# my-template

TypeScript project template.

## Apply to an existing repository

Give a coding agent this prompt in the target repository:

```text
Follow https://raw.githubusercontent.com/sotayamashita/my-template/main/docs/prompts/apply.md
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
| Secrets                 | fnox with 1Password and age      |
| Type checking           | TypeScript                       |
| Tests                   | Vitest with fast-check           |
| Mutation testing        | Stryker                          |
| TypeScript presets      | [tsconfig/bases][tsconfig-bases] |
| Lint                    | oxlint                           |
| Format                  | oxfmt                            |
| Lint and format presets | Ultracite                        |
| Unused code             | knip                             |
| Duplicate code          | jscpd                            |
| Semantic lint           | [jev-lint](tools/jev-lint)       |

[tsconfig-bases]: https://github.com/tsconfig/bases

## Local secrets

```sh
mkdir -p ~/.config/fnox
[ -f ~/.config/fnox/age.txt ] || mise exec -- age-keygen -o ~/.config/fnox/age.txt

cat >> ~/.config/fnox/config.toml <<EOF

[providers.sync-age]
type = "age"
recipients = ["$(mise exec -- age-keygen -y ~/.config/fnox/age.txt)"]
key_file = "~/.config/fnox/age.txt"
EOF

just sync-secrets
```
