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
check *args:
    mise exec -- pnpm check "$@"
```

## Rules

- Define each command in one place.
  - Why: two copies drift apart.
  - Why: `pnpm -r`, Turborepo, and CI read `package.json` scripts.
- Name a recipe after the script it calls.
  - Why: `just check` maps to `pnpm check` without reading the `justfile`.
- Prefix recipes with `mise exec --`.
  - Why: recipes then run with the versions in `mise.toml`.
  - Why: CI and agent shells may not activate mise.
