import { test, expect } from "vitest";
import { formatRange, hueFromString, ratingLevel } from "../format";

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

test("hueFromString is deterministic and within 0-359", () => {
  const hue = hueFromString("Citadelles");
  expect(hue).toBe(hueFromString("Citadelles"));
  expect(hue).toBeGreaterThanOrEqual(0);
  expect(hue).toBeLessThan(360);
  expect(hueFromString("Citadelles")).not.toBe(hueFromString("Stellar"));
});

test("ratingLevel buckets notes and handles null", () => {
  expect(ratingLevel(7.8)).toBe("high");
  expect(ratingLevel(6.6)).toBe("mid");
  expect(ratingLevel(4)).toBe("low");
  expect(ratingLevel(null)).toBeNull();
});
