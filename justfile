set positional-arguments

# Show available commands.
default:
    @just --list

# Install dependencies and Git hooks.
setup:
    @just install-hooks
    @just install-deps

# Install hk Git hooks.
install-hooks:
    # https://hk.jdx.dev/getting_started.html
    mise exec -- hk install --mise

# Install dependencies.
install-deps:
    # No need to specify `--frozen-lockfile` locally or in CI.
    # See https://pnpm.io/cli/install#--frozen-lockfile
    mise exec -- pnpm install

# Check lint rules and formatting.
check *args:
    mise exec -- pnpm check "$@"

# Fix lint violations and formatting.
fix *args:
    mise exec -- pnpm fix "$@"

# Check TypeScript types.
typecheck *args:
    mise exec -- pnpm typecheck "$@"
