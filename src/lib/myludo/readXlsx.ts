import { unzipSync, strFromU8 } from "fflate";
import { MyludoRaw } from "./types";
import { rowsToRaws } from "./readers";

function xmlUnescape(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&");
}

const BUILTIN_DATE_FORMATS = new Set([
  14, 15, 16, 17, 18, 19, 20, 21, 22, 45, 46, 47,
]);

function isDateFormatCode(code: string): boolean {
  const stripped = code.replace(/\[[^\]]*\]/g, "").replace(/"[^"]*"/g, "");
  return /[yd]/i.test(stripped);
}

// Set of cellXf indices (the `s` attribute) whose number format is a date, so
// their serial values can be converted back to a readable date string.
export function parseDateStyles(xml: string): Set<number> {
  const dateFormats = new Set(BUILTIN_DATE_FORMATS);
  for (const match of xml.matchAll(
    /<numFmt\s+numFmtId="(\d+)"\s+formatCode="([^"]*)"/g,
  )) {
    if (isDateFormatCode(match[2])) {
      dateFormats.add(Number(match[1]));
    }
  }
  const cellXfs = xml.match(/<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/);
  const dateStyles = new Set<number>();
  if (cellXfs) {
    let index = 0;
    for (const xf of cellXfs[1].matchAll(/<xf\b[^>]*numFmtId="(\d+)"/g)) {
      if (dateFormats.has(Number(xf[1]))) {
        dateStyles.add(index);
      }
      index++;
    }
  }
  return dateStyles;
}

function serialToDate(serial: number): string {
  const ms = Math.round((serial - 25569) * 86400 * 1000);
  const date = new Date(ms);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function columnIndex(cellRef: string): number {
  const letters = cellRef.replace(/[0-9]/g, "");
  let index = 0;
  for (const letter of letters) {
    index = index * 26 + (letter.charCodeAt(0) - 64);
  }
  return index - 1;
}

export function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  const siRegex = /<si>([\s\S]*?)<\/si>/g;
  let si: RegExpExecArray | null;
  while ((si = siRegex.exec(xml)) !== null) {
    const parts = [...si[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((match) =>
      xmlUnescape(match[1]),
    );
    strings.push(parts.join(""));
  }
  return strings;
}

export function sheetToRows(
  xml: string,
  shared: string[],
  dateStyles: Set<number> = new Set(),
): string[][] {
  const rows: string[][] = [];
  const rowRegex = /<row[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRegex.exec(xml)) !== null) {
    const cells: string[] = [];
    const cellRegex = /<c\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
      const attrs = cellMatch[1];
      const inner = cellMatch[2] ?? "";
      const ref = attrs.match(/r="([A-Z]+)\d+"/);
      const index = ref ? columnIndex(ref[1]) : cells.length;
      const type = attrs.match(/t="([^"]+)"/)?.[1] ?? "";
      const style = attrs.match(/s="(\d+)"/)?.[1];
      let value = "";
      if (type === "s") {
        const v = inner.match(/<v>([\s\S]*?)<\/v>/);
        value = v ? (shared[Number(v[1])] ?? "") : "";
      } else if (type === "inlineStr") {
        const t = inner.match(/<t[^>]*>([\s\S]*?)<\/t>/);
        value = t ? xmlUnescape(t[1]) : "";
      } else {
        const v = inner.match(/<v>([\s\S]*?)<\/v>/);
        value = v ? xmlUnescape(v[1]) : "";
        if (value && style !== undefined && dateStyles.has(Number(style))) {
          value = serialToDate(Number(value));
        }
      }
      cells[index] = value;
    }
    for (let i = 0; i < cells.length; i++) {
      if (cells[i] === undefined) {
        cells[i] = "";
      }
    }
    rows.push(cells);
  }
  return rows;
}

export function readXlsx(bytes: Uint8Array): MyludoRaw[] {
  const files = unzipSync(bytes);
  const sharedFile = files["xl/sharedStrings.xml"];
  const shared = sharedFile ? parseSharedStrings(strFromU8(sharedFile)) : [];
  const stylesFile = files["xl/styles.xml"];
  const dateStyles = stylesFile
    ? parseDateStyles(strFromU8(stylesFile))
    : new Set<number>();
  const sheetPath = Object.keys(files).find((path) =>
    /^xl\/worksheets\/sheet\d+\.xml$/.test(path),
  );
  if (!sheetPath) {
    throw new Error("XLSX Myludo : feuille introuvable");
  }
  return rowsToRaws(
    sheetToRows(strFromU8(files[sheetPath]), shared, dateStyles),
  );
}
