import { fc, test } from "@fast-check/vitest";
import { describe, expect } from "vitest";

import {
  extractFragments,
  line,
  sourceFilePath,
  sourceText,
} from "./extract.ts";

describe("sourceFilePath", () => {
  test.each(["", "missing.ts", "../日本語.tsx"])("keeps %j", (value) => {
    expect(sourceFilePath(value)).toBe(value);
  });

  test.prop([fc.string()])("keeps any file name unchanged", (value) => {
    expect(sourceFilePath(value)).toBe(value);
  });
});

describe("sourceText", () => {
  test.each(["", "function {", "// 日本語😀\n"])("keeps %j", (value) => {
    expect(sourceText(value)).toBe(value);
  });

  test.prop([fc.string()])("keeps any source text unchanged", (value) => {
    expect(sourceText(value)).toBe(value);
  });
});

describe("line", () => {
  test.each([1, 2, 9_007_199_254_740_991, Number.MAX_VALUE])(
    "accepts %s without rounding",
    (value) => {
      expect(line(value)).toBe(value);
    }
  );

  test.each([0, -1, 0.5, 1.5, Number.NaN, Infinity, -Infinity])(
    "rejects %s with RangeError",
    (value) => {
      expect(() => line(value)).toThrow(RangeError);
    }
  );

  test.prop([fc.integer({ min: 1 })])("keeps positive integers", (value) => {
    expect(line(value)).toBe(value);
  });

  test.prop([fc.integer({ max: 0 })])(
    "rejects nonpositive integers",
    (value) => {
      expect(() => line(value)).toThrow(RangeError);
    }
  );
});

describe("extractFragments", () => {
  const file = sourceFilePath("a.ts");

  describe("selection and node targets", () => {
    test("returns the contract example", () => {
      expect(
        extractFragments(
          file,
          sourceText("const f = () => 1;"),
          new Set([line(1)])
        )
      ).toEqual([
        {
          file: "a.ts",
          line: 1,
          state: { code: "f = () => 1", file: "a.ts" },
          targets: ["function"],
        },
      ]);
    });

    test("selects nothing without changed lines", () => {
      expect(
        extractFragments(file, sourceText("function f() {}"), new Set())
      ).toEqual([]);
    });

    test("selects nothing from empty source", () => {
      expect(
        extractFragments(file, sourceText(""), new Set([line(1)]))
      ).toEqual([]);
    });

    const boundedFunction = sourceText(`const before = 0;
function selected() {
  return 1;
}
const after = 0;`);

    test.each([
      { changed: 1, selected: false },
      { changed: 2, selected: true },
      { changed: 3, selected: true },
      { changed: 4, selected: true },
      { changed: 5, selected: false },
    ])(
      "selects the inclusive span at line $changed",
      ({ changed, selected }) => {
        expect(
          extractFragments(file, boundedFunction, new Set([line(changed)]))
        ).toEqual(
          selected
            ? [
                {
                  file: "a.ts",
                  line: 2,
                  state: {
                    code: "function selected() {\n  return 1;\n}",
                    file: "a.ts",
                  },
                  targets: ["function"],
                },
              ]
            : []
        );
      }
    );

    test.prop([fc.array(fc.integer({ max: 5, min: 1 }))])(
      "selects a span exactly when any changed line intersects it",
      (changed) => {
        const fragments = extractFragments(
          file,
          boundedFunction,
          new Set(changed.map((value) => line(value)))
        );

        expect(fragments.map((fragment) => fragment.targets)).toEqual(
          changed.some((value) => value >= 2 && value <= 4)
            ? [["function"]]
            : []
        );
      }
    );

    test.each([
      {
        code: "function f() {}",
        name: "function declaration",
        source: "function f() {}",
        targets: ["function"],
      },
      {
        code: "run() {}",
        name: "class method",
        source: "class C { run() {} }",
        targets: ["function"],
      },
      {
        code: "f = function named() {}",
        name: "function-expression initializer",
        source: "const f = function named() {};",
        targets: ["function"],
      },
      {
        code: "interface User { readonly name: string; }",
        name: "interface",
        source: "interface User { readonly name: string; }",
        targets: ["type"],
      },
      {
        code: "type Name = string;",
        name: "type alias",
        source: "type Name = string;",
        targets: ["type"],
      },
      {
        code: "function isText(value: unknown): value is string { return true; }",
        name: "function type predicate",
        source:
          "function isText(value: unknown): value is string { return true; }",
        targets: ["function", "type-guard"],
      },
      {
        code: "isText = (value: unknown): value is string => true",
        name: "arrow-function type predicate",
        source: "const isText = (value: unknown): value is string => true;",
        targets: ["function", "type-guard"],
      },
      {
        code: "isText(value: unknown): value is string { return true; }",
        name: "method type predicate",
        source:
          "class C { isText(value: unknown): value is string { return true; } }",
        targets: ["function", "type-guard"],
      },
      {
        code: "function assertText(value: unknown): asserts value is string {}",
        name: "assertion predicate",
        source:
          "function assertText(value: unknown): asserts value is string {}",
        targets: ["function", "type-guard"],
      },
    ])(
      "extracts $name with its targets and exact code",
      ({ source, code, targets }) => {
        expect(
          extractFragments(file, sourceText(source), new Set([line(1)]))
        ).toEqual([
          { file: "a.ts", line: 1, state: { code, file: "a.ts" }, targets },
        ]);
      }
    );

    test.each([
      { code: 'it("case", () => {})', source: 'it("case", () => {});' },
      {
        code: 'test("case", function () {})',
        source: 'test("case", function () {});',
      },
      {
        code: 'test.only("case", () => {})',
        source: 'test.only("case", () => {});',
      },
      {
        code: 'it.each([1])("case", (value) => value)',
        source: 'it.each([1])("case", (value) => value);',
      },
    ])("extracts test call $source with empty imports", ({ source, code }) => {
      expect(
        extractFragments(file, sourceText(source), new Set([line(1)]))
      ).toEqual([
        {
          file: "a.ts",
          line: 1,
          state: { code, file: "a.ts", imports: "" },
          targets: ["test"],
        },
      ]);
    });

    test("includes exact static imports in test state", () => {
      const source = sourceText(`import { test } from "vitest";
import {
  value,
} from "./value.ts";
const loading = import("./dynamic.ts");
test("case", () => value);`);

      expect(extractFragments(file, source, new Set([line(6)]))).toEqual([
        {
          file: "a.ts",
          line: 6,
          state: {
            code: 'test("case", () => value)',
            file: "a.ts",
            imports:
              'import { test } from "vitest";\nimport {\n  value,\n} from "./value.ts";',
          },
          targets: ["test"],
        },
      ]);
    });

    test.each([
      "const value = 1;",
      "const object = { run() {} };",
      "run(() => {});",
      'test("case", callback);',
      'contest("case", () => {});',
      'describe("group", () => {});',
      'object.test("case", () => {});',
    ])("ignores unlisted node or non-test call %s", (source) => {
      expect(
        extractFragments(file, sourceText(source), new Set([line(1)]))
      ).toEqual([]);
    });
  });

  describe("comments and context", () => {
    test("groups consecutive comments with their exact source slice", () => {
      const source = sourceText("// first\n/* second */\nconst value = 1;");

      expect(extractFragments(file, source, new Set([line(2)]))).toEqual([
        {
          file: "a.ts",
          line: 1,
          state: {
            code: "const value = 1;",
            comment: "// first\n/* second */",
            file: "a.ts",
          },
          targets: ["comment"],
        },
      ]);
    });

    test("keeps comment blocks separate across a blank line", () => {
      const source = sourceText("// first\n\n// second\nconst value = 1;");

      expect(
        extractFragments(file, source, new Set([line(1), line(3)]))
      ).toEqual([
        {
          file: "a.ts",
          line: 1,
          state: { code: "", comment: "// first", file: "a.ts" },
          targets: ["comment"],
        },
        {
          file: "a.ts",
          line: 3,
          state: {
            code: "const value = 1;",
            comment: "// second",
            file: "a.ts",
          },
          targets: ["comment"],
        },
      ]);
    });

    test("retains multiline comment text and context indentation", () => {
      const source = sourceText(
        "  /* title\n   * detail\n   */\n  const value = 1;"
      );

      expect(extractFragments(file, source, new Set([line(2)]))).toEqual([
        {
          file: "a.ts",
          line: 1,
          state: {
            code: "  const value = 1;",
            comment: "/* title\n   * detail\n   */",
            file: "a.ts",
          },
          targets: ["comment"],
        },
      ]);
    });

    test("does not select a comment solely because its context changed", () => {
      const source = sourceText("// context\nconst f = () => 1;");

      expect(extractFragments(file, source, new Set([line(2)]))).toEqual([
        {
          file: "a.ts",
          line: 2,
          state: { code: "f = () => 1", file: "a.ts" },
          targets: ["function"],
        },
      ]);
    });

    test("stops outside context before a whitespace-only line", () => {
      const source = sourceText("// context\none();\n  \ntwo();");

      expect(extractFragments(file, source, new Set([line(1)]))).toEqual([
        {
          file: "a.ts",
          line: 1,
          state: { code: "one();", comment: "// context", file: "a.ts" },
          targets: ["comment"],
        },
      ]);
    });

    test("allows empty outside context at the source end", () => {
      expect(
        extractFragments(file, sourceText("// end"), new Set([line(1)]))
      ).toEqual([
        {
          file: "a.ts",
          line: 1,
          state: { code: "", comment: "// end", file: "a.ts" },
          targets: ["comment"],
        },
      ]);
    });

    test("includes the tenth outside context line and excludes the eleventh", () => {
      const source = sourceText(`// context
one();
two();
three();
four();
five();
six();
seven();
eight();
nine();
ten();
eleven();`);

      expect(extractFragments(file, source, new Set([line(1)]))).toEqual([
        {
          file: "a.ts",
          line: 1,
          state: {
            code: "one();\ntwo();\nthree();\nfour();\nfive();\nsix();\nseven();\neight();\nnine();\nten();",
            comment: "// context",
            file: "a.ts",
          },
          targets: ["comment"],
        },
      ]);
    });

    test("includes preceding function code and caps context at the function end", () => {
      const source = sourceText(`function f() {
  before();
  // context

  after();
}
outside();`);

      const fragments = extractFragments(file, source, new Set([line(3)]));

      expect(fragments[0]).toEqual({
        file: "a.ts",
        line: 3,
        state: {
          code: "function f() {\n  before();\n  // context\n\n  after();\n}",
          comment: "// context",
          file: "a.ts",
        },
        targets: ["comment"],
      });
    });

    test("includes the tenth inside context line and excludes the eleventh", () => {
      const source = sourceText(`function f() {
  // context
  one();
  two();
  three();
  four();
  five();
  six();
  seven();
  eight();
  nine();
  ten();
  eleven();
}`);

      const fragments = extractFragments(file, source, new Set([line(2)]));

      expect(fragments[0]).toEqual({
        file: "a.ts",
        line: 2,
        state: {
          code: "function f() {\n  // context\n  one();\n  two();\n  three();\n  four();\n  five();\n  six();\n  seven();\n  eight();\n  nine();\n  ten();",
          comment: "// context",
          file: "a.ts",
        },
        targets: ["comment"],
      });
    });

    test("takes comment context from the innermost collected function", () => {
      const source = sourceText(`function outer() {
  const inner = () => {
    // context
    work();
  };
}`);

      const fragments = extractFragments(file, source, new Set([line(3)]));

      expect(fragments[0]).toEqual({
        file: "a.ts",
        line: 3,
        state: {
          code: "inner = () => {\n    // context\n    work();\n  }",
          comment: "// context",
          file: "a.ts",
        },
        targets: ["comment"],
      });
    });

    test("takes comment context from a containing test call", () => {
      const source = sourceText(
        'test("case", () => {\n  // context\n  work();\n});'
      );

      const fragments = extractFragments(file, source, new Set([line(2)]));

      expect(fragments[0]).toEqual({
        file: "a.ts",
        line: 2,
        state: {
          code: 'test("case", () => {\n  // context\n  work();\n})',
          comment: "// context",
          file: "a.ts",
        },
        targets: ["comment"],
      });
    });
  });

  describe("asserted type declarations in comment context", () => {
    test.each([
      {
        changed: 5,
        code: `path = (value: string): Path =>
  // context
  value as Path

/** Every string is allowed; the brand marks a parser file name. */
export type Path = string & { readonly __brand: "Path" };`,
        name: "role brand and its JSDoc",
        source: `/** Every string is allowed; the brand marks a parser file name. */
export type Path = string & { readonly __brand: "Path" };

export const path = (value: string): Path =>
  // context
  value as Path;`,
      },
      {
        changed: 5,
        code: `email = (value: string): Email =>
  // context
  value as Email

/** Must contain exactly one "@". */
export type Email = string & { readonly __brand: "Email" };`,
        name: "brand with a condition and its JSDoc",
        source: `/** Must contain exactly one "@". */
export type Email = string & { readonly __brand: "Email" };

export const email = (value: string): Email =>
  // context
  value as Email;`,
      },
      {
        changed: 9,
        code: `record = (value: unknown) => {
  // context
  return value as Record;
}

/**
 * 日本語😀 and original spacing.
 */
export interface Record {
  readonly name: string;
}`,
        name: "exported interface with exact multiline JSDoc and source",
        source: `/**
 * 日本語😀 and original spacing.
 */
export interface Record {
  readonly name: string;
}

const record = (value: unknown) => {
  // context
  return value as Record;
};`,
      },
      {
        changed: 5,
        code: `path = (value: string) => {
  // context
  return value as Path;
}

type Path = string;`,
        name: "type alias without JSDoc, excluding a regular leading comment",
        source: `// A regular comment, not JSDoc.
type Path = string;

const path = (value: string) => {
  // context
  return value as Path;
};`,
      },
    ])("appends $name", ({ changed, code, source }) => {
      expect(
        extractFragments(file, sourceText(source), new Set([line(changed)]))[0]
      ).toEqual({
        file: "a.ts",
        line: changed,
        state: { code, comment: "// context", file: "a.ts" },
        targets: ["comment"],
      });
    });

    test("includes a type declaration that follows the assertion", () => {
      const source = sourceText(`const path = (value: string) => {
  // context
  return value as Path;
};

/** Every string is allowed. */
type Path = string;`);

      expect(extractFragments(file, source, new Set([line(2)]))[0]).toEqual({
        file: "a.ts",
        line: 2,
        state: {
          code: "path = (value: string) => {\n  // context\n  return value as Path;\n}\n\n/** Every string is allowed. */\ntype Path = string;",
          comment: "// context",
          file: "a.ts",
        },
        targets: ["comment"],
      });
    });

    test("appends each asserted type once in declaration source order", () => {
      const source = sourceText(`/** First declaration. */
type First = string;
/** Second declaration. */
interface Second { readonly name: string; }
type Unrelated = number;

const convert = (value: unknown) => {
  // context
  const second = value as Second;
  const first = value as First;
  return [second, first, value as Second];
};`);

      expect(extractFragments(file, source, new Set([line(8)]))[0]).toEqual({
        file: "a.ts",
        line: 8,
        state: {
          code: `convert = (value: unknown) => {
  // context
  const second = value as Second;
  const first = value as First;
  return [second, first, value as Second];
}

/** First declaration. */
type First = string;

/** Second declaration. */
interface Second { readonly name: string; }`,
          comment: "// context",
          file: "a.ts",
        },
        targets: ["comment"],
      });
    });

    test("includes an assertion before the comment in its original context", () => {
      const source = sourceText(`type Path = string;

function path(value: string) {
  const result = value as Path;
  // context
  return result;
}`);

      expect(extractFragments(file, source, new Set([line(5)]))[0]).toEqual({
        file: "a.ts",
        line: 5,
        state: {
          code: "function path(value: string) {\n  const result = value as Path;\n  // context\n  return result;\n}\n\ntype Path = string;",
          comment: "// context",
          file: "a.ts",
        },
        targets: ["comment"],
      });
    });

    test("appends declarations for an assertion outside a function", () => {
      const source = sourceText(`/** Every string is allowed. */
type Path = string;

// context
const result = value as Path;`);

      expect(extractFragments(file, source, new Set([line(4)]))).toEqual([
        {
          file: "a.ts",
          line: 4,
          state: {
            code: "const result = value as Path;\n\n/** Every string is allowed. */\ntype Path = string;",
            comment: "// context",
            file: "a.ts",
          },
          targets: ["comment"],
        },
      ]);
    });

    test("keeps function and type fragments unchanged when they contain an assertion", () => {
      const source = sourceText(`/** Every string is allowed. */
type Path = string;

const path = (value: string) => {
  // context
  return value as Path;
};`);

      const fragments = extractFragments(
        file,
        source,
        new Set([line(2), line(5)])
      );

      expect(fragments.slice(1)).toEqual([
        {
          file: "a.ts",
          line: 2,
          state: { code: "type Path = string;", file: "a.ts" },
          targets: ["type"],
        },
        {
          file: "a.ts",
          line: 4,
          state: {
            code: "path = (value: string) => {\n  // context\n  return value as Path;\n}",
            file: "a.ts",
          },
          targets: ["function"],
        },
      ]);
    });

    test.each([
      {
        code: "const result = value as Imported;",
        name: "imported type",
        source:
          'import type { Imported } from "./missing.ts";\n\n// context\nconst result = value as Imported;',
      },
      {
        code: "const result = value as Missing;",
        name: "unresolved reference",
        source:
          "type Path = string;\n\n// context\nconst result = value as Missing;",
      },
      {
        code: "const result = value as Types.Path;",
        name: "qualified reference",
        source:
          "type Path = string;\n\n// context\nconst result = value as Types.Path;",
      },
      {
        code: "const result = value as Path<string>;",
        name: "generic reference",
        source:
          "type Path<T> = T;\n\n// context\nconst result = value as Path<string>;",
      },
      {
        code: "const result = <Path>value;",
        name: "angle-bracket assertion",
        source:
          "type Path = string;\n\n// context\nconst result = <Path>value;",
      },
      {
        code: "const result = value satisfies Path;",
        name: "satisfies expression",
        source:
          "type Path = string;\n\n// context\nconst result = value satisfies Path;",
      },
      {
        code: "const result = value as string;",
        name: "primitive asserted type",
        source:
          "type Path = string;\n\n// context\nconst result = value as string;",
      },
      {
        code: "const result = value as { readonly name: Path };",
        name: "inline asserted type",
        source:
          "type Path = string;\n\n// context\nconst result = value as { readonly name: Path };",
      },
      {
        code: "const result = value as Path | undefined;",
        name: "union asserted type",
        source:
          "type Path = string;\n\n// context\nconst result = value as Path | undefined;",
      },
      {
        code: 'const result = "value as Path";',
        name: "assertion text in a string",
        source:
          'type Path = string;\n\n// context\nconst result = "value as Path";',
      },
      {
        code: "const result = value;",
        comment: "// context\n// value as Path",
        name: "assertion text in a comment",
        source:
          "type Path = string;\n\n// context\n// value as Path\nconst result = value;",
      },
    ])(
      "does not append declarations for $name",
      ({ code, comment = "// context", source }) => {
        expect(
          extractFragments(file, sourceText(source), new Set([line(3)]))
        ).toEqual([
          {
            file: "a.ts",
            line: 3,
            state: {
              code,
              comment,
              file: "a.ts",
            },
            targets: ["comment"],
          },
        ]);
      }
    );

    test.each([
      "type Path = string;",
      "interface Path { readonly name: string; }",
    ])("does not append a nested declaration: %s", (declaration) => {
      const source = sourceText(`function outer() {
  ${declaration}
  const path = (value: unknown) => {
    // context
    return value as Path;
  };
}`);

      expect(extractFragments(file, source, new Set([line(4)]))[0]).toEqual({
        file: "a.ts",
        line: 4,
        state: {
          code: "path = (value: unknown) => {\n    // context\n    return value as Path;\n  }",
          comment: "// context",
          file: "a.ts",
        },
        targets: ["comment"],
      });
    });

    test("searches only through the tenth line after an inside comment", () => {
      const source = sourceText(`type Included = string;
type Excluded = number;

function convert(value: unknown) {
  // context
  one();
  two();
  three();
  four();
  five();
  six();
  seven();
  eight();
  nine();
  value as Included;
  value as Excluded;
}`);

      expect(extractFragments(file, source, new Set([line(5)]))[0]).toEqual({
        file: "a.ts",
        line: 5,
        state: {
          code: "function convert(value: unknown) {\n  // context\n  one();\n  two();\n  three();\n  four();\n  five();\n  six();\n  seven();\n  eight();\n  nine();\n  value as Included;\n\ntype Included = string;",
          comment: "// context",
          file: "a.ts",
        },
        targets: ["comment"],
      });
    });

    test("does not search past the first blank line outside a function", () => {
      const source = sourceText(`type Path = string;

// context
work();

value as Path;`);

      expect(extractFragments(file, source, new Set([line(3)]))).toEqual([
        {
          file: "a.ts",
          line: 3,
          state: { code: "work();", comment: "// context", file: "a.ts" },
          targets: ["comment"],
        },
      ]);
    });

    test("does not search past the end of the containing function", () => {
      const source = sourceText(`type Path = string;

function convert() {
  // context
  work();
}
value as Path;`);

      expect(extractFragments(file, source, new Set([line(4)]))[0]).toEqual({
        file: "a.ts",
        line: 4,
        state: {
          code: "function convert() {\n  // context\n  work();\n}",
          comment: "// context",
          file: "a.ts",
        },
        targets: ["comment"],
      });
    });
  });

  test("orders comments first and retains overlapping outer and inner functions", () => {
    const source = sourceText(`function outer() {
  // inner
  function inner() {}
}
// final
type Name = string;`);

    const fragments = extractFragments(
      file,
      source,
      new Set([line(1), line(2), line(3), line(4), line(5), line(6)])
    );

    expect(
      fragments.map((fragment) => ({
        line: fragment.line,
        targets: fragment.targets,
      }))
    ).toEqual([
      { line: 2, targets: ["comment"] },
      { line: 5, targets: ["comment"] },
      { line: 1, targets: ["function"] },
      { line: 3, targets: ["function"] },
      { line: 6, targets: ["type"] },
    ]);
  });

  test("uses the file name's TSX dialect and retains it in state", () => {
    expect(
      extractFragments(
        sourceFilePath("view.tsx"),
        sourceText("const render = () => <div />;"),
        new Set([line(1)])
      )
    ).toEqual([
      {
        file: "view.tsx",
        line: 1,
        state: { code: "render = () => <div />", file: "view.tsx" },
        targets: ["function"],
      },
    ]);
  });

  test("ignores fatal parser diagnostics and returns no AST fragments", () => {
    expect(
      extractFragments(file, sourceText("function {"), new Set([line(1)]))
    ).toEqual([]);
  });

  test("extracts a recovered AST function despite parser diagnostics", () => {
    expect(
      extractFragments(
        file,
        sourceText("const value; function f() {}"),
        new Set([line(1)])
      )
    ).toEqual([
      {
        file: "a.ts",
        line: 1,
        state: { code: "function f() {}", file: "a.ts" },
        targets: ["function"],
      },
    ]);
  });

  test("retains parsed comments when fatal diagnostics leave no AST nodes", () => {
    expect(
      extractFragments(
        file,
        sourceText("// context\nfunction {"),
        new Set([line(1)])
      )
    ).toEqual([
      {
        file: "a.ts",
        line: 1,
        state: { code: "function {", comment: "// context", file: "a.ts" },
        targets: ["comment"],
      },
    ]);
  });
});
