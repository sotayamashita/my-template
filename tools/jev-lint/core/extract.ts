import { parseSync, Visitor } from "oxc-parser";
import type {
  Argument,
  ArrowFunctionExpression,
  Expression,
  Function as FunctionNode,
  Program,
} from "oxc-parser";

import type { Target } from "../rule.ts";

/**
 * Parser file name, distinct from source text. Every string is allowed,
 * including an empty or nonexistent path; no file is read or path normalized.
 */
export type SourceFilePath = string & {
  readonly __brand: "SourceFilePath";
};

/**
 * Source text in JavaScript UTF-16 code units. Every string is allowed,
 * including empty text and text with syntax errors; no text is normalized.
 */
export type SourceText = string & {
  readonly __brand: "SourceText";
};

/** One-based source line, a positive integer. */
export type Line = number & { readonly __brand: "Line" };

/** Return value unchanged as Line; throw RangeError if its invariant fails. */
export const line = (value: number): Line => {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError("Line must be a positive integer.");
  }

  // SAFETY: the check above enforces the Line invariant.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return value as Line;
};

/** Return the same string as a parser file name; no value is rejected. */
export const sourceFilePath = (value: string): SourceFilePath =>
  // SAFETY: every string is a valid SourceFilePath; the brand distinguishes its role.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  value as SourceFilePath;

/** Return the same string as source text; no value is rejected. */
export const sourceText = (value: string): SourceText =>
  // SAFETY: every string is valid SourceText; the brand distinguishes its role.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  value as SourceText;

/** Rule input: comment context, test context, or the selected declaration. */
type State =
  | {
      readonly code: string;
      readonly comment: string;
      readonly file: SourceFilePath;
    }
  | {
      readonly code: string;
      readonly file: SourceFilePath;
      readonly imports: string;
    }
  | { readonly code: string; readonly file: SourceFilePath };

/** A selected source fragment and the rule targets that judge it. */
export interface Fragment {
  readonly targets: readonly Target[];
  readonly file: SourceFilePath;
  /** The fragment's first line. */
  readonly line: Line;
  readonly state: State;
}

// Parser offsets use UTF-16 code units; end is exclusive.
interface Range {
  readonly start: number;
  readonly end: number;
}

interface Span extends Range {
  readonly targets: readonly Target[];
  readonly state: State;
}

const MAX_CODE_LINES = 10;

const rootName = (node: Expression): string => {
  if (node.type === "Identifier") {
    return node.name;
  }

  if (node.type === "MemberExpression") {
    return rootName(node.object);
  }

  if (node.type === "CallExpression") {
    return rootName(node.callee);
  }

  return "";
};

const isFunction = (
  node: Argument | null | undefined
): node is ArrowFunctionExpression | FunctionNode =>
  node?.type === "ArrowFunctionExpression" ||
  node?.type === "FunctionExpression";

const functionTargets = (
  fn: ArrowFunctionExpression | FunctionNode
): readonly Target[] =>
  fn.returnType?.typeAnnotation.type === "TSTypePredicate"
    ? ["function", "type-guard"]
    : ["function"];

const nodeSpans = (
  program: Program,
  {
    file,
    imports,
    source,
  }: {
    readonly file: SourceFilePath;
    readonly imports: string;
    readonly source: SourceText;
  }
): Span[] => {
  const spans: Span[] = [];
  const add = (node: Range, targets: readonly Target[], extra = {}) => {
    const code = source.slice(node.start, node.end);

    spans.push({
      end: node.end,
      start: node.start,
      state: { code, file, ...extra },
      targets,
    });
  };

  new Visitor({
    CallExpression(node) {
      const root = rootName(node.callee);

      if (
        (root === "it" || root === "test") &&
        node.arguments.some(isFunction)
      ) {
        add(node, ["test"], { imports });
      }
    },
    FunctionDeclaration(node) {
      add(node, functionTargets(node));
    },
    MethodDefinition(node) {
      add(node, functionTargets(node.value));
    },
    TSInterfaceDeclaration(node) {
      add(node, ["type"]);
    },
    TSTypeAliasDeclaration(node) {
      add(node, ["type"]);
    },
    VariableDeclarator(node) {
      if (isFunction(node.init)) {
        add(node, functionTargets(node.init));
      }
    },
  }).visit(program);

  return spans;
};

const codeAfter = (lines: readonly string[], endLine: Line): string => {
  const code: string[] = [];

  for (const text of lines.slice(endLine, endLine + MAX_CODE_LINES)) {
    if (text.trim() === "") {
      break;
    }

    code.push(text);
  }

  return code.join("\n");
};

/**
 * Return fragments when a changed line falls within their first-to-last
 * lines, inclusive. Comment fragments come first in source order, then other
 * fragments in AST visit order, outer before inner; overlapping spans remain.
 * Comments on consecutive lines form one block with the exact source slice
 * as state.comment and ["comment"] as targets.
 * Inside a function or test, comment state.code starts at the innermost
 * collected span's start and extends through ten lines after the block,
 * capped at that span's end. Otherwise it contains up to ten following lines,
 * stopping before the first blank line; context can be empty.
 * Function declarations, class methods, and variable declarators initialized
 * with an arrow function or function expression have ["function"] targets.
 * A type-predicate return annotation adds "type-guard", including assertions.
 * Interfaces and type aliases have ["type"] targets.
 * Calls rooted at it or test with an arrow-function or function-expression
 * argument have ["test"] targets, including test.only and it.each(...)(...).
 * Their state.imports contains exact static-import slices in source order,
 * joined by LF, or "" when absent. Other node kinds produce no fragment.
 * Non-comment state.code is the selected node's exact source slice.
 * Every fragment and state retain file; fragment.line is its first line.
 * The file name selects the parser dialect. Parser diagnostics are ignored;
 * fragments still come from the returned AST and comments.
 *
 * @example
 * extractFragments(sourceFilePath("a.ts"), sourceText("const f = () => 1;"),
 *   new Set([line(1)])) returns [{ file: "a.ts", line: 1, targets: ["function"],
 *   state: { code: "f = () => 1", file: "a.ts" } }].
 */
export const extractFragments = (
  file: SourceFilePath,
  source: SourceText,
  changedLines: ReadonlySet<Line>
): Fragment[] => {
  const lines = source.split("\n");
  let offset = 0;
  const lineStarts = lines.map((text) => {
    const start = offset;

    offset += text.length + 1;

    return start;
  });
  const lineOf = (position: number): Line =>
    line(lineStarts.findLastIndex((start) => start <= position) + 1);

  const { comments, module, program } = parseSync(file, source);
  const imports = module.staticImports
    .map(({ start, end }) => source.slice(start, end))
    .join("\n");

  const commentBlocks: Range[] = [];

  for (const { start, end } of comments) {
    const last = commentBlocks.at(-1);

    if (last && lineOf(start) === lineOf(last.end) + 1) {
      commentBlocks[commentBlocks.length - 1] = { end, start: last.start };
    } else {
      commentBlocks.push({ end, start });
    }
  }

  const nodes = nodeSpans(program, { file, imports, source });
  const functions = nodes.filter(({ targets }) =>
    targets.some((target) => target === "function" || target === "test")
  );
  const codeAround = ({ start, end }: Range): string => {
    const fn = functions.findLast(
      (candidate) => candidate.start <= start && end <= candidate.end
    );

    if (fn === undefined) {
      return codeAfter(lines, lineOf(end));
    }

    const nextLineStart = lineStarts[lineOf(end) + MAX_CODE_LINES];
    const stop =
      nextLineStart === undefined ? source.length : nextLineStart - 1;

    return source.slice(fn.start, Math.min(fn.end, stop));
  };

  const spans: Span[] = [
    ...commentBlocks.map((block) => ({
      ...block,
      state: {
        code: codeAround(block),
        comment: source.slice(block.start, block.end),
        file,
      },
      targets: ["comment" as const],
    })),
    ...nodes,
  ];

  return spans
    .filter(({ start, end }) => {
      const first = lineOf(start);
      const last = lineOf(end);

      return [...changedLines].some(
        (changedLine) => changedLine >= first && changedLine <= last
      );
    })
    .map(({ start, state, targets }) => ({
      file,
      line: lineOf(start),
      state,
      targets,
    }));
};
