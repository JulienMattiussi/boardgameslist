import { Game } from "./games";
import {
  gameInDuration,
  gameKind,
  gameSupportsPlayers,
  GameKind,
} from "./filter";

export type PrintDensity = "rich" | "normal" | "compact";

export type SoloFilter = "all" | "only" | "exclude";

export type PrintConfig = {
  density: PrintDensity;
  splitByType: boolean;
  splitByCategory: boolean;
  splitByTheme: boolean;
  splitByMechanic: boolean;
  splitByDuration: boolean;
  splitByPlayers: boolean;
  solo: SoloFilter;
};

export type PrintSection = {
  label: string;
  games: Game[];
};

export type PrintJob = {
  sections: PrintSection[];
  summary: string;
  config: PrintConfig;
};

const COLUMN_COUNT = 3;

const PLAYER_COUNT_CAP = 12;

const KIND_LABELS: Record<GameKind, string> = {
  societe: "Jeux de plateau",
  enigme: "Enquetes & enigmes",
};

const DURATION_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: "< 30 min", min: 0, max: 29 },
  { label: "30-60 min", min: 30, max: 60 },
  { label: "1-2 h", min: 61, max: 120 },
  { label: "2 h +", min: 121, max: Number.POSITIVE_INFINITY },
];

export function isSoloOnly(game: Game): boolean {
  return game.joueursMin === 1 && game.joueursMax === 1;
}

export function playerCountsInSet(games: Game[]): number[] {
  let max = 0;
  for (const game of games) {
    const hi = game.joueursMax ?? game.joueursMin ?? 0;
    if (hi > max) {
      max = hi;
    }
  }
  max = Math.min(max, PLAYER_COUNT_CAP);
  const counts: number[] = [];
  for (let count = 1; count <= max; count++) {
    if (games.some((game) => gameSupportsPlayers(game, count))) {
      counts.push(count);
    }
  }
  return counts;
}

function applySolo(games: Game[], solo: SoloFilter): Game[] {
  if (solo === "only") {
    return games.filter(isSoloOnly);
  }
  if (solo === "exclude") {
    return games.filter((game) => !isSoloOnly(game));
  }
  return games;
}

function joinLabel(parent: string, child: string): string {
  return parent ? `${parent} · ${child}` : child;
}

function splitByValues(
  sections: PrintSection[],
  values: (game: Game) => string[],
): PrintSection[] {
  return sections.flatMap((section) => {
    const distinct = [
      ...new Set(section.games.flatMap((game) => values(game))),
    ].sort((a, b) => a.localeCompare(b, "fr"));
    return distinct.map((value) => ({
      label: joinLabel(section.label, value),
      games: section.games.filter((game) => values(game).includes(value)),
    }));
  });
}

export function buildPrintSections(
  games: Game[],
  config: PrintConfig,
): PrintSection[] {
  const base = applySolo(games, config.solo);
  let sections: PrintSection[] = [{ label: "", games: base }];

  if (config.splitByType) {
    sections = sections.flatMap((section) =>
      (["societe", "enigme"] as GameKind[])
        .map((kind) => ({
          label: joinLabel(section.label, KIND_LABELS[kind]),
          games: section.games.filter((game) => gameKind(game) === kind),
        }))
        .filter((child) => child.games.length > 0),
    );
  }

  if (config.splitByCategory) {
    sections = splitByValues(sections, (game) => game.categories);
  }

  if (config.splitByTheme) {
    sections = splitByValues(sections, (game) => game.themes);
  }

  if (config.splitByMechanic) {
    sections = splitByValues(sections, (game) => game.mecanismes);
  }

  if (config.splitByDuration) {
    sections = sections.flatMap((section) =>
      DURATION_BUCKETS.map((bucket) => ({
        label: joinLabel(section.label, bucket.label),
        games: section.games.filter((game) =>
          gameInDuration(game, { min: bucket.min, max: bucket.max }),
        ),
      })).filter((child) => child.games.length > 0),
    );
  }

  if (config.splitByPlayers) {
    sections = sections.flatMap((section) =>
      playerCountsInSet(section.games)
        .filter((count) => !(config.solo === "exclude" && count === 1))
        .map((count) => ({
          label: joinLabel(
            section.label,
            `${count} joueur${count > 1 ? "s" : ""}`,
          ),
          games: section.games.filter((game) =>
            gameSupportsPlayers(game, count),
          ),
        })),
    );
  }

  return sections.filter((section) => section.games.length > 0);
}

export type PrintColumn = {
  games: Game[];
};

export function columnCountFor(density: PrintDensity): number {
  return density === "rich" ? 2 : COLUMN_COUNT;
}

export function layoutColumns(
  games: Game[],
  columnCount: number = COLUMN_COUNT,
): PrintColumn[] {
  const size = Math.max(1, Math.ceil(games.length / columnCount));
  return Array.from({ length: columnCount }, (_, index) => ({
    games: games.slice(index * size, (index + 1) * size),
  }));
}
