import { MyludoRaw } from "./types";

const MULTI_COLUMNS = new Set([
  "EAN",
  "Langues",
  "Univers",
  "Gamme(s)",
  "Catégorie(s)",
  "Thème(s)",
  "Mécanisme(s)",
  "Éditeur(s)",
  "Auteur(s)",
  "Illustrateur(s)",
]);

function splitCell(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

function toRaw(column: string, value: unknown): string | string[] {
  if (MULTI_COLUMNS.has(column)) {
    if (Array.isArray(value)) {
      return value
        .map((item) => String(item).trim())
        .filter((item) => item !== "");
    }
    return value == null ? [] : splitCell(String(value));
  }
  return value == null ? "" : String(value).trim();
}

export function readJson(text: string): MyludoRaw[] {
  const data = JSON.parse(text);
  if (!Array.isArray(data)) {
    throw new Error("JSON Myludo attendu : un tableau de jeux");
  }
  return data.map((entry) => {
    const raw: MyludoRaw = {};
    for (const [column, value] of Object.entries(entry as object)) {
      raw[column] = toRaw(column, value);
    }
    return raw;
  });
}

export function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function rowsToRaws(rows: string[][]): MyludoRaw[] {
  if (rows.length < 2) {
    return [];
  }
  // Myludo prefixes the first header cell with an Excel text-guard quote ('ID).
  const header = rows[0].map((column) =>
    column.replace(/^['\uFEFF]+/, "").trim(),
  );
  return rows
    .slice(1)
    .filter((cells) => cells.some((cell) => cell.trim() !== ""))
    .map((cells) => {
      const raw: MyludoRaw = {};
      header.forEach((column, index) => {
        raw[column] = toRaw(column, cells[index] ?? "");
      });
      return raw;
    });
}

export function readCsv(text: string): MyludoRaw[] {
  return rowsToRaws(parseDelimited(text.replace(/^\uFEFF/, ""), ";"));
}
