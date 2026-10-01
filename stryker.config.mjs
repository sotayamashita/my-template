export default {
  coverageAnalysis: "perTest",
  mutate: ["src/**/*.ts", "!src/**/*.test.ts"],
  // pnpm keeps the runner out of reach of Stryker's default plugin lookup.
  plugins: ["@stryker-mutator/vitest-runner"],
  reporters: ["clear-text", "progress"],
  testRunner: "vitest",
  // Stryker rewrites tsconfig.json with the TypeScript JS API, which
  // TypeScript 7 no longer ships. No path in it points outside the project.
  tsconfigFile: "",
};
