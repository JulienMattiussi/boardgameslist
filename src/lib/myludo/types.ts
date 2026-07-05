import { Game } from "../games";

// Per-format readers all emit this shape: keyed by Myludo column names, with
// multi-value columns (EAN, categories, authors...) already split into string[].
export type MyludoRaw = Record<string, string | string[]>;

export type MyludoImport = {
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
};

export type MyludoFormat = "json" | "csv" | "xlsx";

export type FieldConflict = {
  field: string;
  current: string;
  incoming: string;
};

export type PlanEntry =
  | { kind: "new"; incoming: MyludoImport }
  | {
      kind: "match";
      matchedBy: "myludo_id" | "ean";
      incoming: MyludoImport;
      existing: Game;
      conflicts: FieldConflict[];
    }
  | {
      kind: "probable";
      matchedBy: "title";
      incoming: MyludoImport;
      existing: Game;
    };

export type ImportPlan = {
  entries: PlanEntry[];
};
