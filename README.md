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

## Local secrets

1Password holds the source values. `fnox.toml` contains their references, and `fnox sync` writes a personal age-encrypted cache to the gitignored `fnox.local.toml`. Daily reads decrypt locally without 1Password prompts.

Create a personal age key once per machine. Reuse an existing key at this path instead of generating another:

```sh
mkdir -p ~/.config/fnox
mise exec -- age-keygen -o ~/.config/fnox/age.txt
mise exec -- age-keygen -y ~/.config/fnox/age.txt
```

Add the following provider to `~/.config/fnox/config.toml`, preserving any existing settings. Replace `age1...` with the public recipient printed by `age-keygen -y`:

```toml
[providers.sync-age]
type = "age"
recipients = ["age1..."]
key_file = "~/.config/fnox/age.txt"
```

Keep the private key outside the repository. Anyone with the key and the cache can decrypt the cached values.

From each checkout or worktree, authenticate to 1Password and create its cache:

```sh
just sync-secrets
```

`just jev-lint` and Git hooks then use the cache through `fnox exec`. The cache survives restarts, but does not refresh automatically. Run `just sync-secrets` again after a value changes in 1Password.

See the [fnox local cache guide](https://fnox.jdx.dev/guide/golden-path.html).

## Commands

```sh
just              # List commands
just check        # Check lint rules and formatting
just fix          # Fix lint violations and formatting
just typecheck    # Check TypeScript types
just test         # Run tests
just mutation     # Find code the tests do not pin down
just sync-secrets # Refresh the local secrets cache
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

## Apply to an existing repository

Give a coding agent this prompt in the target repository:

```text
Follow https://raw.githubusercontent.com/sotayamashita/my-template/main/docs/prompts/apply.md
```
