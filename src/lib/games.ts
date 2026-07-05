import { readSheetRows } from "./sheets";

export type Game = {
  myludoId: string;
  ean: string[];
  titre: string;
  sousTitre: string;
  edition: number | null;
  joueursMin: number | null;
  joueursMax: number | null;
  dureeMin: number | null;
  dureeMax: number | null;
  age: string;
  categories: string[];
  themes: string[];
  mecanismes: string[];
  editeur: string[];
  auteurs: string[];
  notePerso: number | null;
  noteMoyenne: number | null;
  dateAcquisition: string;
  emplacement: string;
  image: string;
  source: string;
  description: string;
  rowIndex: number;
};

type FieldKind = "string" | "number" | "list" | "date";

type GameValue = string | string[] | number | null;

type ColumnSpec = {
  header: string;
  key: keyof Game;
  kind: FieldKind;
};

const COLUMNS: ColumnSpec[] = [
  { header: "myludo_id", key: "myludoId", kind: "string" },
  { header: "european_article_number", key: "ean", kind: "list" },
  { header: "titre", key: "titre", kind: "string" },
  { header: "sous_titre", key: "sousTitre", kind: "string" },
  { header: "edition", key: "edition", kind: "number" },
  { header: "joueurs_min", key: "joueursMin", kind: "number" },
  { header: "joueurs_max", key: "joueursMax", kind: "number" },
  { header: "duree_min", key: "dureeMin", kind: "number" },
  { header: "duree_max", key: "dureeMax", kind: "number" },
  { header: "age", key: "age", kind: "string" },
  { header: "categories", key: "categories", kind: "list" },
  { header: "themes", key: "themes", kind: "list" },
  { header: "mecanismes", key: "mecanismes", kind: "list" },
  { header: "editeur", key: "editeur", kind: "list" },
  { header: "auteurs", key: "auteurs", kind: "list" },
  { header: "note_perso", key: "notePerso", kind: "number" },
  { header: "note_moyenne", key: "noteMoyenne", kind: "number" },
  { header: "date_acquisition", key: "dateAcquisition", kind: "date" },
  { header: "emplacement", key: "emplacement", kind: "string" },
  { header: "image", key: "image", kind: "string" },
  { header: "source", key: "source", kind: "string" },
  { header: "description", key: "description", kind: "string" },
];

function parseNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return null;
  }
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

function parseList(raw: string): string[] {
  return raw
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

function emptyValue(kind: FieldKind): GameValue {
  if (kind === "list") {
    return [];
  }
  if (kind === "number") {
    return null;
  }
  return "";
}

function parseCell(raw: string, kind: FieldKind): GameValue {
  if (kind === "number") {
    return parseNumber(raw);
  }
  if (kind === "list") {
    return parseList(raw);
  }
  return raw.trim();
}

export function rowsToGames(rows: string[][]): Game[] {
  if (rows.length === 0) {
    return [];
  }
  const [headerRow, ...dataRows] = rows;
  const indexByHeader = new Map<string, number>();
  headerRow.forEach((label, index) => {
    indexByHeader.set(label.trim().toLowerCase(), index);
  });

  return dataRows
    .map((row, index) => ({ row, rowIndex: index + 2 }))
    .filter(({ row }) => row.some((cell) => cell.trim() !== ""))
    .map(({ row, rowIndex }) => {
      const game: Record<string, GameValue | number> = { rowIndex };
      for (const column of COLUMNS) {
        const index = indexByHeader.get(column.header);
        const raw = index === undefined ? undefined : row[index];
        game[column.key] =
          raw === undefined || raw === ""
            ? emptyValue(column.kind)
            : parseCell(raw, column.kind);
      }
      return game as unknown as Game;
    });
}

function isoDateToSerial(iso: string): number | "" {
  const match = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return "";
  }
  const utc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Math.round((utc - Date.UTC(1899, 11, 30)) / 86400000);
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    return parseNumber(value);
  }
  return null;
}

function coerceString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function coerceList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter((item) => item !== "");
  }
  if (typeof value === "string") {
    return parseList(value);
  }
  return [];
}

export function normalizeGame(input: Record<string, unknown>): Game {
  const game: Record<string, GameValue | number> = {
    rowIndex: typeof input.rowIndex === "number" ? input.rowIndex : 0,
  };
  for (const column of COLUMNS) {
    const value = input[column.key];
    if (column.kind === "number") {
      game[column.key] = coerceNumber(value);
    } else if (column.kind === "list") {
      game[column.key] = coerceList(value);
    } else {
      game[column.key] = coerceString(value);
    }
  }
  return game as unknown as Game;
}

export function gameToRow(game: Game): (string | number)[] {
  return COLUMNS.map((column) => {
    const value = game[column.key];
    if (column.kind === "number") {
      return typeof value === "number" ? value : "";
    }
    if (column.kind === "date") {
      return typeof value === "string" ? isoDateToSerial(value) : "";
    }
    if (column.kind === "list") {
      return Array.isArray(value) ? value.join("; ") : "";
    }
    return typeof value === "string" ? value : "";
  });
}

export async function fetchGames(): Promise<Game[]> {
  const rows = await readSheetRows();
  return rowsToGames(rows);
}
