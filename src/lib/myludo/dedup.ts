import { Game } from "../games";
import { MyludoImport, FieldConflict, PlanEntry, ImportPlan } from "./types";

const CONFLICT_FIELDS = [
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
] as const;

export function normalizeTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function repr(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (Array.isArray(value)) {
    return value.join("; ");
  }
  return String(value);
}

export function findConflicts(
  existing: Game,
  incoming: MyludoImport,
): FieldConflict[] {
  const current = existing as unknown as Record<string, unknown>;
  const next = incoming as unknown as Record<string, unknown>;
  const conflicts: FieldConflict[] = [];
  for (const field of CONFLICT_FIELDS) {
    const currentValue = repr(current[field]);
    const incomingValue = repr(next[field]);
    if (
      currentValue !== "" &&
      incomingValue !== "" &&
      currentValue !== incomingValue
    ) {
      conflicts.push({ field, current: currentValue, incoming: incomingValue });
    }
  }
  return conflicts;
}

export function buildImportPlan(
  imports: MyludoImport[],
  existing: Game[],
): ImportPlan {
  const byId = new Map<string, Game>();
  const byBggId = new Map<string, Game>();
  const byEan = new Map<string, Game>();
  const byTitle = new Map<string, Game>();
  for (const game of existing) {
    if (game.myludoId) {
      byId.set(game.myludoId, game);
    }
    if (game.bggId) {
      byBggId.set(game.bggId, game);
    }
    for (const ean of game.ean) {
      if (ean) {
        byEan.set(ean, game);
      }
    }
    const title = normalizeTitle(game.titre);
    if (title && !byTitle.has(title)) {
      byTitle.set(title, game);
    }
  }

  const entries: PlanEntry[] = imports.map((incoming) => {
    const idMatch = incoming.myludoId ? byId.get(incoming.myludoId) : undefined;
    if (idMatch) {
      return {
        kind: "match",
        matchedBy: "myludo_id",
        incoming,
        existing: idMatch,
        conflicts: findConflicts(idMatch, incoming),
      };
    }
    const bggMatch = incoming.bggId ? byBggId.get(incoming.bggId) : undefined;
    if (bggMatch) {
      return {
        kind: "match",
        matchedBy: "bgg_id",
        incoming,
        existing: bggMatch,
        conflicts: findConflicts(bggMatch, incoming),
      };
    }
    const eanMatch = incoming.ean
      .map((ean) => byEan.get(ean))
      .find((game): game is Game => game !== undefined);
    if (eanMatch) {
      return {
        kind: "match",
        matchedBy: "ean",
        incoming,
        existing: eanMatch,
        conflicts: findConflicts(eanMatch, incoming),
      };
    }
    const titleMatch = byTitle.get(normalizeTitle(incoming.titre));
    if (titleMatch) {
      return {
        kind: "probable",
        matchedBy: "title",
        incoming,
        existing: titleMatch,
      };
    }
    return { kind: "new", incoming };
  });

  return { entries };
}
