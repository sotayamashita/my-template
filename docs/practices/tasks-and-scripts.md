# Tasks and Scripts

`justfile` recipes are the entry point for humans and agents. They call `package.json` scripts with the tools pinned in `mise.toml`.

| Command | `package.json` scripts | `justfile` |
| --- | --- | --- |
| Node tool (`check`, `fix`, `typecheck`, `test`) | the command | a recipe that calls the script |
| Several steps in order (`setup`) | — | the recipe |
| Non-Node tool (Docker, database, `claude -p`) | — | the recipe |

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

| Rule | Why |
| --- | --- |
| Define each command in one place. | Two copies drift apart; `pnpm -r`, Turborepo, and CI read `package.json` scripts. |
| Name a recipe after the script it calls. | `just check` maps to `pnpm check` without reading the `justfile`. |
| Prefix recipes with `mise exec --`. | Recipes use the versions in `mise.toml` even where the shell does not activate mise, such as CI and agent shells. |
