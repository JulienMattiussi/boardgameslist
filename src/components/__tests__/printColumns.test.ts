import { test, expect } from "vitest";
import { readFileSync } from "node:fs";

const printListCss = readFileSync(
  new URL("../PrintList.module.css", import.meta.url),
  "utf8",
);
const printModalCss = readFileSync(
  new URL("../PrintModal.module.css", import.meta.url),
  "utf8",
);

test("printed sheet fills each column before the next so pages pack fully", () => {
  expect(printListCss).toMatch(/\.columns\s*\{[^}]*column-fill:\s*auto/);
});

test("preview balances its columns so every column shows in the thumbnail", () => {
  expect(printModalCss).toMatch(
    /\.pageColumns\s*\{[^}]*column-fill:\s*balance/,
  );
  expect(printModalCss).not.toMatch(
    /\.pageColumns\s*\{[^}]*column-fill:\s*auto/,
  );
});
