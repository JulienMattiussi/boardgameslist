import { formatFromName, parseMyludo } from "./myludo/parse";
import { MyludoFormat, MyludoImport } from "./myludo/types";
import { parseDelimited } from "./myludo/readers";
import { parseBggCollection, isBggCollection } from "./bgg/import";

export type ImportSource = "myludo" | "bgg";

export type ParsedImport = {
  source: ImportSource;
  imports: MyludoImport[];
};

export { formatFromName };

export function parseCollection(
  format: MyludoFormat,
  bytes: Uint8Array,
): ParsedImport {
  if (format === "csv") {
    const text = new TextDecoder().decode(bytes).replace(/^\uFEFF/, "");
    const firstRow = parseDelimited(text, ";")[0] ?? [];
    const header = firstRow.map((column) =>
      column.replace(/^['\uFEFF]+/, "").trim(),
    );
    if (isBggCollection(header)) {
      return { source: "bgg", imports: parseBggCollection(text) };
    }
  }
  return { source: "myludo", imports: parseMyludo(format, bytes) };
}
