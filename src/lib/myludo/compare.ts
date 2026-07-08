import { Game } from "../games";
import { MyludoImport } from "./types";
import { normalizeTitle } from "./dedup";

type FieldStatus = "same" | "fill" | "conflict" | "existing-only";

export type CardRow = {
  label: string;
  keys: string[];
  existing: string;
  incoming: string;
  status: FieldStatus;
};

function repr(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return String(value);
}

function range(min: number | null, max: number | null): string {
  if (min === null && max === null) {
    return "";
  }
  if (max === null) {
    return `${min}+`;
  }
  if (min === max) {
    return `${min}`;
  }
  return `${min}-${max}`;
}

// JSON exports store the EAN as a number, dropping a leading zero (UPC-A 12
// digits vs EAN-13); strip leading zeros so the same barcode is not a conflict.
function canonEan(value: string): string {
  return value
    .split(", ")
    .map((code) => code.replace(/^0+/, ""))
    .join(", ");
}

function rangeContains(
  outerMin: number | null,
  outerMax: number | null,
  innerMin: number | null,
  innerMax: number | null,
): boolean {
  const lowOuter = outerMin ?? Number.NEGATIVE_INFINITY;
  const highOuter = outerMax ?? Number.POSITIVE_INFINITY;
  const lowInner = innerMin ?? Number.NEGATIVE_INFINITY;
  const highInner = innerMax ?? Number.POSITIVE_INFINITY;
  return lowOuter <= lowInner && highInner <= highOuter;
}

const FIELDS: {
  label: string;
  keys: string[];
  existing: (game: Game) => string;
  incoming: (incoming: MyludoImport) => string;
  canon?: (value: string) => string;
  compat?: (game: Game, incoming: MyludoImport) => boolean;
}[] = [
  {
    label: "Titre",
    keys: ["titre"],
    existing: (g) => g.titre,
    incoming: (i) => i.titre,
    canon: normalizeTitle,
  },
  {
    label: "Sous-titre",
    keys: ["sousTitre"],
    existing: (g) => g.sousTitre,
    incoming: (i) => i.sousTitre,
  },
  {
    label: "Edition",
    keys: ["edition"],
    existing: (g) => repr(g.edition),
    incoming: (i) => repr(i.edition),
  },
  {
    label: "Joueurs",
    keys: ["joueursMin", "joueursMax"],
    existing: (g) => range(g.joueursMin, g.joueursMax),
    incoming: (i) => range(i.joueursMin, i.joueursMax),
    compat: (g, i) =>
      rangeContains(g.joueursMin, g.joueursMax, i.joueursMin, i.joueursMax),
  },
  {
    label: "Duree",
    keys: ["dureeMin", "dureeMax"],
    existing: (g) => range(g.dureeMin, g.dureeMax),
    incoming: (i) => range(i.dureeMin, i.dureeMax),
    compat: (g, i) =>
      rangeContains(g.dureeMin, g.dureeMax, i.dureeMin, i.dureeMax),
  },
  {
    label: "Age",
    keys: ["age"],
    existing: (g) => repr(g.age),
    incoming: (i) => repr(i.age),
  },
  {
    label: "Categories",
    keys: ["categories"],
    existing: (g) => repr(g.categories),
    incoming: (i) => repr(i.categories),
  },
  {
    label: "Themes",
    keys: ["themes"],
    existing: (g) => repr(g.themes),
    incoming: (i) => repr(i.themes),
  },
  {
    label: "Mecanismes",
    keys: ["mecanismes"],
    existing: (g) => repr(g.mecanismes),
    incoming: (i) => repr(i.mecanismes),
  },
  {
    label: "Editeur",
    keys: ["editeur"],
    existing: (g) => repr(g.editeur),
    incoming: (i) => repr(i.editeur),
  },
  {
    label: "Auteurs",
    keys: ["auteurs"],
    existing: (g) => repr(g.auteurs),
    incoming: (i) => repr(i.auteurs),
  },
  {
    label: "Note perso",
    keys: ["notePerso"],
    existing: (g) => repr(g.notePerso),
    incoming: (i) => repr(i.notePerso),
  },
  {
    label: "Note moyenne",
    keys: ["noteMoyenne"],
    existing: (g) => repr(g.noteMoyenne),
    incoming: (i) => repr(i.noteMoyenne),
  },
  {
    label: "Date d'acquisition",
    keys: ["dateAcquisition"],
    existing: (g) => g.dateAcquisition,
    incoming: (i) => i.dateAcquisition,
  },
  {
    label: "Emplacement",
    keys: ["emplacement"],
    existing: (g) => g.emplacement,
    incoming: (i) => i.emplacement,
  },
  {
    label: "Code-barres (EAN)",
    keys: ["ean"],
    existing: (g) => repr(g.ean),
    incoming: (i) => repr(i.ean),
    canon: canonEan,
  },
  {
    label: "ID Myludo",
    keys: ["myludoId"],
    existing: (g) => g.myludoId,
    incoming: (i) => i.myludoId,
  },
];

function status(existing: string, incoming: string): FieldStatus {
  if (existing === incoming) {
    return "same";
  }
  if (existing === "") {
    return "fill";
  }
  if (incoming === "") {
    return "existing-only";
  }
  return "conflict";
}

export function compareGames(
  existing: Game,
  incoming: MyludoImport,
): CardRow[] {
  return FIELDS.map((field) => {
    const left = field.existing(existing);
    const right = field.incoming(incoming);
    const canonLeft = field.canon ? field.canon(left) : left;
    const canonRight = field.canon ? field.canon(right) : right;
    let rowStatus = status(canonLeft, canonRight);
    if (rowStatus === "conflict" && field.compat?.(existing, incoming)) {
      rowStatus = "same";
    }
    return {
      label: field.label,
      keys: field.keys,
      existing: left,
      incoming: right,
      status: rowStatus,
    };
  });
}

// Identical means nothing to arbitrate: no field is filled or in conflict (an
// existing-only value is always kept, so it does not break the identity).
export function isIdenticalDuplicate(rows: CardRow[]): boolean {
  return rows.every(
    (row) => row.status === "same" || row.status === "existing-only",
  );
}
