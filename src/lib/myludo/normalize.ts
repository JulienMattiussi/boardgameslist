import { MyludoRaw, MyludoImport } from "./types";

const PLAYER_WORDS: Record<string, [number, number]> = { duo: [2, 2] };

export function parseRange(raw: string): {
  min: number | null;
  max: number | null;
} {
  const value = raw.trim();
  if (value === "") {
    return { min: null, max: null };
  }
  const word = PLAYER_WORDS[value.toLowerCase()];
  if (word) {
    return { min: word[0], max: word[1] };
  }
  const norm = value.replace(/[\u2013\u2014]/g, "-");
  let match = norm.match(/^(\d+)\s*\+$/);
  if (match) {
    return { min: Number(match[1]), max: null };
  }
  match = norm.match(/^(\d+)\s*-\s*(\d+)$/);
  if (match) {
    return { min: Number(match[1]), max: Number(match[2]) };
  }
  match = norm.match(/^\((\d+)\)$/);
  if (match) {
    return { min: Number(match[1]), max: Number(match[1]) };
  }
  match = norm.match(/^(\d+)$/);
  if (match) {
    return { min: Number(match[1]), max: Number(match[1]) };
  }
  return { min: null, max: null };
}

function asString(value: string | string[] | undefined): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (Array.isArray(value)) {
    return (value[0] ?? "").trim();
  }
  return "";
}

function asList(value: string | string[] | undefined): string[] {
  const items = Array.isArray(value) ? value : value ? [value] : [];
  return items.map((item) => String(item).trim()).filter((item) => item !== "");
}

function parseIntOrNull(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  return Number(trimmed);
}

function parseNote(raw: string): number | null {
  const value = Number(raw.trim());
  if (!Number.isFinite(value) || value === 0) {
    return null;
  }
  return value;
}

export function rawToImport(raw: MyludoRaw): MyludoImport {
  const joueurs = parseRange(asString(raw["Joueur(s)"]));
  const duree = parseRange(asString(raw["Durée"]));
  return {
    myludoId: asString(raw["ID"]),
    ean: asList(raw["EAN"]),
    titre: asString(raw["Titre"]),
    sousTitre: asString(raw["Sous-titre"]),
    edition: parseIntOrNull(asString(raw["Édition"])),
    joueursMin: joueurs.min,
    joueursMax: joueurs.max,
    dureeMin: duree.min,
    dureeMax: duree.max,
    age: asString(raw["Age(s)"]),
    categories: asList(raw["Catégorie(s)"]),
    themes: asList(raw["Thème(s)"]),
    mecanismes: asList(raw["Mécanisme(s)"]),
    editeur: asList(raw["Éditeur(s)"]),
    auteurs: asList(raw["Auteur(s)"]),
    notePerso: parseNote(asString(raw["Note personnelle"])),
    noteMoyenne: parseNote(asString(raw["Note moyenne"])),
    dateAcquisition: asString(raw["Date d'acquisition"]),
    emplacement: asString(raw["Emplacement"]),
  };
}
