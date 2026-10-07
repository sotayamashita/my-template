set positional-arguments

# Show available commands.
default:
    @just --list

# Install dependencies and Git hooks.
setup:
    @just install-hooks
    @just install-node

# Check lint rules and formatting across the repository.
[group('all')]
check *args:
    mise exec -- hk check --all "$@"

# Fix lint violations and formatting across the repository.
[group('all')]
fix *args:
    mise exec -- hk fix --all "$@"

# Run tests for every toolchain.
[group('all')]
test: test-node

# Remove build outputs for every toolchain.
[group('all')]
clean: clean-node

# Install hk Git hooks.
[group('hooks')]
install-hooks:
    # https://hk.jdx.dev/getting_started.html
    mise exec -- hk install

# Install dependencies.
[group('node')]
install-node:
    # No need to specify `--frozen-lockfile` locally or in CI.
    # See https://pnpm.io/cli/install#--frozen-lockfile
    mise exec -- pnpm install

# Check lint rules and formatting.
[group('node')]
check-node *args:
    mise exec -- pnpm check "$@"

# Fix lint violations and formatting.
[group('node')]
fix-node *args:
    mise exec -- pnpm fix "$@"

# Check TypeScript types.
[group('node')]
typecheck *args:
    mise exec -- pnpm typecheck "$@"

# Run tests.
[group('node')]
test-node *args:
    mise exec -- pnpm test "$@"

# Find code the tests do not pin down; slow, so run it by hand.
[group('node')]
mutation *args:
    mise exec -- pnpm mutation "$@"

# Find unused files, exports, and dependencies.
[group('node')]
knip *args:
    mise exec -- pnpm knip "$@"

# Find duplicated code.
[group('node')]
jscpd *args:
    mise exec -- pnpm jscpd "$@"

# Ask Jev about changed code; findings are candidates, not verdicts.
[group('node')]
jev-lint *args:
    mise exec -- fnox exec -- pnpm jev-lint "$@"

# Remove dependencies and build caches for a fresh install.
[group('node')]
clean-node:
    mise exec -- git clean -xdf -- node_modules "*.tsbuildinfo"

# Refresh the personal age cache from 1Password.
[group('secrets')]
sync-secrets *args:
    mise exec -- fnox sync --provider sync-age --local-file "$@"
