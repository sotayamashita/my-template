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

# Find unused files, exports, and dependencies.
knip *args:
    mise exec -- pnpm knip "$@"

# Find duplicated code.
jscpd *args:
    mise exec -- pnpm jscpd "$@"

# Ask Jev about changed code; findings are candidates, not verdicts.
jev-lint *args:
    mise exec -- fnox exec -- pnpm jev-lint "$@"

# Check lint rules and formatting.
check *args:
    mise exec -- pnpm check "$@"

# Fix lint violations and formatting.
fix *args:
    mise exec -- pnpm fix "$@"

# Check TypeScript types.
typecheck *args:
    mise exec -- pnpm typecheck "$@"

# Run tests.
test *args:
    mise exec -- pnpm test "$@"

# Remove dependencies and build caches for a fresh install.
clean:
    mise exec -- git clean -xdf -- node_modules "*.tsbuildinfo"
