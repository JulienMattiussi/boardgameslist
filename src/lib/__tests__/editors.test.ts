import { test, expect } from "vitest";
import { parseAllowlist, isEditor } from "../editors";

test("parseAllowlist trims, lowercases and drops empties", () => {
  expect(parseAllowlist(" A@x.com, b@Y.com ,, ")).toEqual(["a@x.com", "b@y.com"]);
  expect(parseAllowlist(undefined)).toEqual([]);
  expect(parseAllowlist("")).toEqual([]);
});

test("isEditor matches case-insensitively and rejects unknown/empty", () => {
  const allow = ["a@x.com", "b@y.com"];
  expect(isEditor("A@X.com", allow)).toBe(true);
  expect(isEditor("c@z.com", allow)).toBe(false);
  expect(isEditor(null, allow)).toBe(false);
  expect(isEditor(undefined, allow)).toBe(false);
  expect(isEditor("a@x.com", [])).toBe(false);
});
