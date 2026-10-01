import type { Line } from "./extract.ts";
import { line as sourceLine } from "./extract.ts";

const HUNK_HEADER = /^@@ -\S+ \+(?<start>\d+)(?:,(?<count>\d+))? @@/u;

/**
 * Parse LF-separated output of `git diff --unified=0 --no-color
 * --diff-filter=AM` with new-side file headers in `+++ b/<path>` form.
 * Each Map key is the exact path after `b/`.
 * For a hunk with new-side start s and count c, include one-based lines
 * s through s+c-1, inclusive. An omitted count means 1; count 0 adds none.
 * Merge hunks of one file into one Set of line numbers.
 * Only a line that starts with `@@` is a hunk header; text like `@@ -1 +2 @@`
 * inside an added or removed line adds nothing.
 *
 * @example
 * parseDiffLinesByFile("+++ b/a.ts\n@@ -2 +4,2 @@\n+x\n+y\n")
 * returns Map { "a.ts" => Set { 4, 5 } }.
 */
export const parseDiffLinesByFile = (diff: string): Map<string, Set<Line>> => {
  const changed = new Map<string, Set<Line>>();
  let lines = new Set<Line>();

  for (const text of diff.split("\n")) {
    if (text.startsWith("+++ b/")) {
      lines = new Set();
      changed.set(text.slice("+++ b/".length), lines);
      continue;
    }

    const hunk = HUNK_HEADER.exec(text)?.groups;

    if (hunk?.["start"] !== undefined) {
      const start = Number(hunk["start"]);
      const count = Number(hunk["count"] ?? "1");

      for (
        let lineNumber = start;
        lineNumber < start + count;
        lineNumber += 1
      ) {
        lines.add(sourceLine(lineNumber));
      }
    }
  }

  return changed;
};
