import { fc, test } from "@fast-check/vitest";
import { describe, expect } from "vitest";

import { parseDiffLinesByFile } from "./hunk.ts";

describe("parseDiffLinesByFile", () => {
  test("returns the contract example", () => {
    expect(parseDiffLinesByFile("+++ b/a.ts\n@@ -2 +4,2 @@\n+x\n+y\n")).toEqual(
      new Map([["a.ts", new Set([4, 5])]])
    );
  });

  test("includes line one for an explicit count of one", () => {
    expect(parseDiffLinesByFile("+++ b/a.ts\n@@ -0,0 +1,1 @@\n+x\n")).toEqual(
      new Map([["a.ts", new Set([1])]])
    );
  });

  test("uses one new-side line when the count is omitted", () => {
    expect(
      parseDiffLinesByFile("+++ b/a.ts\n@@ -3,2 +7 @@\n-old\n-text\n+x\n")
    ).toEqual(new Map([["a.ts", new Set([7])]]));
  });

  test("ignores hunk header text inside a changed line", () => {
    expect(
      parseDiffLinesByFile(
        '+++ b/a.ts\n@@ -0,0 +1 @@\n+const header = "@@ -1 +9,3 @@";\n'
      )
    ).toEqual(new Map([["a.ts", new Set([1])]]));
  });

  test("adds no lines for a count of zero", () => {
    const changed = parseDiffLinesByFile(
      "+++ b/a.ts\n@@ -1,2 +0,0 @@\n-old\n-text\n"
    );

    expect([...changed.values()].flatMap((lines) => [...lines])).toEqual([]);
  });

  test("merges separate hunks of one file", () => {
    const diff = `+++ b/a.ts
@@ -2 +4,2 @@
-old
+x
+y
@@ -8 +11 @@
-old
+z
`;

    expect(parseDiffLinesByFile(diff)).toEqual(
      new Map([["a.ts", new Set([4, 5, 11])]])
    );
  });

  test("keeps each path after b/ and separates its changed lines", () => {
    const diff = `diff --git a/src/a.ts b/src/a.ts
--- a/src/a.ts
+++ b/src/a.ts
@@ -2 +4,2 @@
-old
+x
+y
diff --git a/tools/b.ts b/tools/b.ts
--- a/tools/b.ts
+++ b/tools/b.ts
@@ -3 +9 @@
-old
+z
`;

    expect(parseDiffLinesByFile(diff)).toEqual(
      new Map([
        ["src/a.ts", new Set([4, 5])],
        ["tools/b.ts", new Set([9])],
      ])
    );
  });

  test.prop([
    fc.integer({ max: 500, min: 1 }),
    fc.integer({ max: 20, min: 1 }),
  ])("includes exactly the inclusive new-side range", (start, count) => {
    const changed = parseDiffLinesByFile(
      `+++ b/a.ts\n@@ -1 +${start},${count} @@\n`
    ).get("a.ts");

    expect(changed?.size).toBe(count);
    expect(
      [...(changed ?? [])].every(
        (value) => value >= start && value <= start + count - 1
      )
    ).toBe(true);
  });
});
