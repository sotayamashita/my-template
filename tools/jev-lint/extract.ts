import { parseSync } from "oxc-parser";

/** A comment block with the code right after it. */
export interface CommentFragment {
  file: string;
  line: number;
  comment: string;
  code: string;
}

interface Block {
  startLine: number;
  endLine: number;
  startOffset: number;
  endOffset: number;
}

const MAX_CODE_LINES = 10;

const toBlocks = (file: string, source: string): Block[] => {
  const lineOf = (offset: number) => source.slice(0, offset).split("\n").length;
  const blocks: Block[] = [];

  for (const comment of parseSync(file, source).comments) {
    const startLine = lineOf(comment.start);
    const endLine = lineOf(comment.end);
    const last = blocks.at(-1);

    if (last && startLine === last.endLine + 1) {
      last.endLine = endLine;
      last.endOffset = comment.end;
    } else {
      blocks.push({
        endLine,
        endOffset: comment.end,
        startLine,
        startOffset: comment.start,
      });
    }
  }

  return blocks;
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
 * Extract the comment blocks that touch a changed line.
 * Comments on consecutive lines form one block.
 */
export const extractComments = (
  file: string,
  source: string,
  changedLines: ReadonlySet<number>
): CommentFragment[] => {
  const lines = source.split("\n");

  return toBlocks(file, source)
    .filter((block) => {
      for (let line = block.startLine; line <= block.endLine; line += 1) {
        if (changedLines.has(line)) {
          return true;
        }
      }
      return false;
    })
    .map((block) => ({
      code: codeAfter(lines, block.endLine),
      comment: source.slice(block.startOffset, block.endOffset),
      file,
      line: block.startLine,
    }));
};
