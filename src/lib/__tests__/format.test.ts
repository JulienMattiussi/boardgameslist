import { test, expect } from "vitest";
import { formatRange } from "../format";

test("formats a min-max range", () => {
  expect(formatRange(2, 6)).toBe("2-6");
});

test("collapses an equal min and max to a single value", () => {
  expect(formatRange(60, 60)).toBe("60");
});

test("renders an open-ended range as min+", () => {
  expect(formatRange(1, null)).toBe("1+");
  expect(formatRange(120, null)).toBe("120+");
});

test("renders a max-only range as the max value", () => {
  expect(formatRange(null, 4)).toBe("4");
});

test("returns an empty string when both bounds are missing", () => {
  expect(formatRange(null, null)).toBe("");
});
