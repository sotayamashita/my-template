# Tasks and Scripts

- `justfile` recipes: the entry point for humans and agents
- `package.json` scripts: the commands the recipes call
- `mise.toml`: the tool versions the recipes run with

## Where each command goes

- Node tool (`check`, `fix`, `typecheck`, `test`)
  - `package.json` scripts: the command
  - `justfile`: a recipe that calls the script
- Several steps in order (`setup`)
  - `justfile`: the recipe
- Non-Node tool (Docker, database, `claude -p`)
  - `justfile`: the recipe

```json
// file:package.json
{
  "scripts": {
    "check": "ultracite check"
  }
}
```

```just
# file:justfile
set positional-arguments

# Check lint rules and formatting.
[group('node')]
check-node *args:
    mise exec -- pnpm check "$@"
```

## Rules

- Define each command in one place.
  - Why: two copies drift apart.
  - Why: `pnpm -r`, Turborepo, and CI read `package.json` scripts.
- Name a single-tool recipe after the script it calls, such as `typecheck`.
  - Why: `just typecheck` maps to `pnpm typecheck` without reading the `justfile`.
- Prefix recipes with `mise exec --`.
  - Why: recipes then run with the versions in `mise.toml`.
  - Why: CI and agent shells may not activate mise.

## Recipe names

- Name a recipe `<verb>-<toolchain>`, such as `check-kotlin` or `test-node`.
- Give each verb one meaning.
  - `install`: put dependencies or hooks in place
  - `check`: report lint and format problems without changing files
  - `fix`: fix what `check` reports
  - `build`, `test`, `clean`: build, run tests, remove build outputs
- Use the bare verb for the whole repository.
  - `check` and `fix` run `hk check --all` and `hk fix --all`.
  - `build`, `test`, and `clean` run the toolchain recipes.
- Name a recipe that starts an app `dev-<app>`, such as `dev-viewer`.
- Keep a recipe that reports a score, such as `mutation`, out of `test`.
  - Why: `test` passes or fails; a score does neither.
- Put each recipe in a `[group]`: `all`, `hooks`, or its toolchain.
  - Leave `default` and `setup` without a group, so they list first.
  - Why: `just --list` shows groups but not comments between recipes.
- Put a comment above each recipe.
  - Why: `just --list` shows it.
