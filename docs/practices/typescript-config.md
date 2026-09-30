# TypeScript Config

- `@tsconfig/*` bases: the compiler options
- `tsconfig.json`: which bases to combine and which files to check
- `@<scope>/typescript-config` package: the shared presets in a monorepo

## Where each setting goes

- Code that Node runs: tools, scripts, workers, libraries
  - Bases: `@tsconfig/strictest`, `@tsconfig/node-lts`, `@tsconfig/node-ts`
  - Imports: the real file name, such as `./user.ts`
- Next.js app
  - Bases: the bases above, then `@tsconfig/next`
  - Imports: as generators write them, such as `@/lib/utils`
- Monorepo
  - `packages/typescript-config/base.json`: the bases above and `noEmit`
  - Each workspace `tsconfig.json`: extends `base.json`, sets `include`

```json
// file:tsconfig.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": [
    "@tsconfig/strictest/tsconfig.json",
    "@tsconfig/node-lts/tsconfig.json",
    "@tsconfig/node-ts/tsconfig.json"
  ],
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src", "tools", "*.ts"]
}
```

```json
// file:apps/web/tsconfig.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": [
    "@<scope>/typescript-config/base.json",
    "@tsconfig/next/tsconfig.json"
  ],
  "compilerOptions": {
    // `next build` rewrites "preserve" to "react-jsx".
    "jsx": "react-jsx",
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]
}
```

## Rules

- Extend published bases instead of writing options by hand.
  - Why: updating a base brings its new options to every project.
- Check the merged options with `tsc --showConfig`.
- Import the real file name, with `.ts`, in code that Node runs.
  - Why: Node strips types and does not map `./user.js` to `./user.ts`.
  - Why: `node`, `tsc`, and bundlers all resolve the real file name.
- Extend `@tsconfig/next` last in a Next.js app.
  - Why: its `module` and `moduleResolution` must win over the Node bases.
- Keep the generated import style in a Next.js app.
  - Why: shadcn and create-next-app write imports without extensions.
  - Why: `NodeNext` rejects those imports; `bundler` accepts them.
- Alias with `package.json` `imports` (`#lib/*`), not `paths`, outside Next.js.
  - Why: Node, `tsc`, and bundlers read the same map.
  - With `noEmit`, write `#lib/user.ts` and set these options:
    - `"allowImportingTsExtensions": true`
    - `"rewriteRelativeImportExtensions": false`
  - Why: `rewriteRelativeImportExtensions` rejects `#lib/user.ts` (TS2877).
  - Why: it can rewrite only relative paths.
- Do not restate an option that a base or the default already sets.
  - Example: `strictNullChecks`, which `strict` already turns on
  - Example: `baseUrl`, which `paths` no longer needs
- Do not write `"exclude": ["node_modules"]`.
  - Why: `include` wildcards such as `**/*.ts` skip `node_modules`.
  - Why: an inherited `exclude` resolves from the base's own directory.
- List only the directories that hold sources in `include`.
  - Add dot directories, such as `.storybook`, as their own entries.
- Put `paths` only in the workspace that imports through it.
- Name the shared package `@<scope>/typescript-config`.
  - Why: Turborepo and create-turbo use this name.
