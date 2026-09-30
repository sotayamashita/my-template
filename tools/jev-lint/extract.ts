import { parseSync, Visitor } from "oxc-parser";
import type {
  ArrowFunctionExpression,
  Expression,
  Function as FunctionNode,
  Program,
} from "oxc-parser";

import type { Target } from "./rule.ts";

type State =
  | { code: string; comment: string; file: string }
  | { code: string; file: string; imports: string }
  | { code: string; file: string };

interface Range {
  start: number;
  end: number;
}

interface Span extends Range {
  targets: readonly Target[];
  state: State;
}

/** A piece of source and the targets whose rules judge it. */
export interface Fragment {
  targets: readonly Target[];
  file: string;
  line: number;
  state: State;
}

const MAX_CODE_LINES = 10;

const TEST_FUNCTIONS = new Set(["it", "test"]);

// `test.only(...)` and `it.each(...)(...)` both lead back to the test function.
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
  node: { type: string } | null | undefined
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
  { file, imports, source }: { file: string; imports: string; source: string }
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
      if (
        TEST_FUNCTIONS.has(rootName(node.callee)) &&
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

const codeAfter = (lines: readonly string[], line: number): string => {
  const code: string[] = [];

  for (const text of lines.slice(line, line + MAX_CODE_LINES)) {
    if (text.trim() === "") {
      break;
    }
    code.push(text);
  }

  return code.join("\n");
};

/**
 * Extract the comments, functions, types, and tests that touch a changed line.
 * Comments on consecutive lines form one fragment.
 */
export const extractFragments = (
  file: string,
  source: string,
  changedLines: ReadonlySet<number>
): Fragment[] => {
  const lines = source.split("\n");
  let offset = 0;
  const lineStarts = lines.map((text) => {
    const start = offset;
    offset += text.length + 1;
    return start;
  });
  const lineOf = (position: number) =>
    lineStarts.findLastIndex((start) => start <= position) + 1;

  const { comments, module, program } = parseSync(file, source);
  const imports = module.staticImports
    .map(({ start, end }) => source.slice(start, end))
    .join("\n");

  const commentBlocks: Range[] = [];
  for (const { start, end } of comments) {
    const last = commentBlocks.at(-1);
    if (last && lineOf(start) === lineOf(last.end) + 1) {
      last.end = end;
    } else {
      commentBlocks.push({ end, start });
    }
  }

  const spans: Span[] = [
    ...commentBlocks.map(({ start, end }) => ({
      end,
      start,
      state: {
        code: codeAfter(lines, lineOf(end)),
        comment: source.slice(start, end),
        file,
      },
      targets: ["comment" as const],
    })),
    ...nodeSpans(program, { file, imports, source }),
  ];

  return spans
    .filter(({ start, end }) => {
      const first = lineOf(start);
      const last = lineOf(end);
      return [...changedLines].some((line) => line >= first && line <= last);
    })
    .map(({ start, state, targets }) => ({
      file,
      line: lineOf(start),
      state,
      targets,
    }));
};
