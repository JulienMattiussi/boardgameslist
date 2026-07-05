import { Game } from "./games";

export type SortKey = "titre" | "notePerso" | "noteMoyenne" | "duree" | "age";

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

export function sortGames(games: Game[], key: SortKey): Game[] {
  const sorted = [...games];
  switch (key) {
    case "titre":
      return sorted.sort((a, b) => a.titre.localeCompare(b.titre, "fr"));
    case "notePerso":
      return sorted.sort((a, b) => (b.notePerso ?? -1) - (a.notePerso ?? -1));
    case "noteMoyenne":
      return sorted.sort(
        (a, b) => (b.noteMoyenne ?? -1) - (a.noteMoyenne ?? -1),
      );
    case "duree":
      return sorted.sort(
        (a, b) =>
          (a.dureeMax ?? a.dureeMin ?? Number.POSITIVE_INFINITY) -
          (b.dureeMax ?? b.dureeMin ?? Number.POSITIVE_INFINITY),
      );
    case "age":
      return sorted.sort(
        (a, b) =>
          (a.age ?? Number.POSITIVE_INFINITY) -
          (b.age ?? Number.POSITIVE_INFINITY),
      );
  }
}
