import { Game } from "./games";

export type SortKey =
  | "titre"
  | "notePerso"
  | "noteMoyenne"
  | "complexite"
  | "duree"
  | "age"
  | "dateAcquisition";

export type SortDirection = "asc" | "desc";

export const NATURAL_SORT_DIRECTION: Record<SortKey, SortDirection> = {
  titre: "asc",
  notePerso: "desc",
  noteMoyenne: "desc",
  complexite: "desc",
  duree: "asc",
  age: "asc",
  dateAcquisition: "desc",
};

export type GameKind = "societe" | "enigme";

export type DurationBucket = {
  min: number;
  max: number;
};

export type Filters = {
  query: string;
  players: number | null;
  duration: DurationBucket | null;
  kind: GameKind | null;
};

const ENIGMA_KEYWORDS = [
  "enquete",
  "enigme",
  "escape",
  "puzzle",
  "mystere",
  "livre dont",
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function matchesQuery(game: Game, query: string): boolean {
  const q = normalize(query.trim());
  if (q === "") {
    return true;
  }
  const haystack = normalize(
    [
      game.titre,
      game.sousTitre,
      game.editeur.join(" "),
      game.auteurs.join(" "),
      game.categories.join(" "),
      game.themes.join(" "),
      game.description,
    ].join(" "),
  );
  return haystack.includes(q);
}

export function gameKind(game: Game): GameKind {
  const haystack = normalize([...game.categories, ...game.themes].join(" "));
  return ENIGMA_KEYWORDS.some((keyword) => haystack.includes(keyword))
    ? "enigme"
    : "societe";
}

export function gameSupportsPlayers(game: Game, count: number): boolean {
  const { joueursMin, joueursMax } = game;
  if (joueursMin === null && joueursMax === null) {
    return false;
  }
  const min = joueursMin ?? 1;
  const max = joueursMax ?? Number.POSITIVE_INFINITY;
  return count >= min && count <= max;
}

export function gameInDuration(game: Game, bucket: DurationBucket): boolean {
  const { dureeMin, dureeMax } = game;
  if (dureeMin === null && dureeMax === null) {
    return false;
  }
  const min = dureeMin ?? dureeMax ?? 0;
  const max = dureeMax ?? Number.POSITIVE_INFINITY;
  return min <= bucket.max && max >= bucket.min;
}

export function filterGames(games: Game[], filters: Filters): Game[] {
  return games.filter(
    (game) =>
      matchesQuery(game, filters.query) &&
      (filters.players === null ||
        gameSupportsPlayers(game, filters.players)) &&
      (filters.duration === null || gameInDuration(game, filters.duration)) &&
      (filters.kind === null || gameKind(game) === filters.kind),
  );
}

const SORT_COMPARATORS: Record<SortKey, (a: Game, b: Game) => number> = {
  titre: (a, b) => a.titre.localeCompare(b.titre, "fr"),
  notePerso: (a, b) => (a.notePerso ?? -1) - (b.notePerso ?? -1),
  noteMoyenne: (a, b) => (a.noteMoyenne ?? -1) - (b.noteMoyenne ?? -1),
  complexite: (a, b) => (a.complexite ?? -1) - (b.complexite ?? -1),
  duree: (a, b) =>
    (a.dureeMax ?? a.dureeMin ?? Number.POSITIVE_INFINITY) -
    (b.dureeMax ?? b.dureeMin ?? Number.POSITIVE_INFINITY),
  age: (a, b) =>
    (a.age ?? Number.POSITIVE_INFINITY) - (b.age ?? Number.POSITIVE_INFINITY),
  dateAcquisition: (a, b) =>
    (a.dateAcquisition || "").localeCompare(b.dateAcquisition || ""),
};

export function sortGames(
  games: Game[],
  key: SortKey,
  direction: SortDirection = NATURAL_SORT_DIRECTION[key],
): Game[] {
  const sign = direction === "desc" ? -1 : 1;
  const comparator = SORT_COMPARATORS[key];
  return [...games].sort((a, b) => sign * comparator(a, b));
}
