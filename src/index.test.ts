import { fc, test } from "@fast-check/vitest";
import { describe, expect } from "vitest";

import { greet } from "./index.ts";

describe("greet", () => {
  test("greets Ada by name", () => {
    expect(greet("Ada")).toBe("Hello, Ada!");
  });

  test.prop([fc.string()])("keeps any name inside the greeting", (name) => {
    const greeting = greet(name);
    expect(greeting.startsWith("Hello, ")).toBe(true);
    expect(greeting.endsWith("!")).toBe(true);
    expect(greeting).toContain(name);
  });
});
