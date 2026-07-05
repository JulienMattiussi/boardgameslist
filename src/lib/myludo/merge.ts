import { Game } from "../games";
import { MyludoImport } from "./types";

// Fields Myludo can fill or update; image/description/source stay as they are.
const IMPORT_FIELDS = [
  "ean",
  "sousTitre",
  "edition",
  "joueursMin",
  "joueursMax",
  "dureeMin",
  "dureeMax",
  "age",
  "categories",
  "themes",
  "mecanismes",
  "editeur",
  "auteurs",
  "notePerso",
  "noteMoyenne",
  "dateAcquisition",
  "emplacement",
];

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return String(value).trim() === "";
}

export function newFields(incoming: MyludoImport): Record<string, unknown> {
  return { ...incoming, source: "myludo" };
}

export function mergeFields(
  existing: Game,
  incoming: MyludoImport,
  replace: string[],
): Record<string, unknown> {
  const current = existing as unknown as Record<string, unknown>;
  const next = incoming as unknown as Record<string, unknown>;
  const fields: Record<string, unknown> = { ...current };
  for (const field of IMPORT_FIELDS) {
    if (isEmpty(current[field]) || replace.includes(field)) {
      fields[field] = next[field];
    }
  }
  fields.myludoId = existing.myludoId || incoming.myludoId;
  fields.source = "myludo";
  fields.rowIndex = existing.rowIndex;
  return fields;
}
