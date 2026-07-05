import { readSheetRows } from "./sheets";

export type Game = {
  myludoId: string;
  ean: string[];
  titre: string;
  sousTitre: string;
  edition: string;
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
};

type FieldKind = "string" | "number" | "list";

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
  { header: "edition", key: "edition", kind: "string" },
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
  { header: "date_acquisition", key: "dateAcquisition", kind: "string" },
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
    .filter((row) => row.some((cell) => cell.trim() !== ""))
    .map((row) => {
      const game = {} as Record<keyof Game, GameValue>;
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

export async function fetchGames(): Promise<Game[]> {
  const rows = await readSheetRows();
  return rowsToGames(rows);
}
