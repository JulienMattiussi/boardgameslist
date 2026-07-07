import { Game } from "./games";
import {
  gameInDuration,
  gameKind,
  gameSupportsPlayers,
  GameKind,
} from "./filter";

export type PrintRichness = "minimal" | "rich";

export type SoloFilter = "all" | "only" | "exclude";

export type PrintConfig = {
  richness: PrintRichness;
  optimizeTitles: boolean;
  splitByType: boolean;
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
      playerCountsInSet(section.games).map((count) => ({
        label: joinLabel(
          section.label,
          `${count} joueur${count > 1 ? "s" : ""}`,
        ),
        games: section.games.filter((game) => gameSupportsPlayers(game, count)),
      })),
    );
  }

  return sections.filter((section) => section.games.length > 0);
}

export type PrintColumn = {
  games: Game[];
  weight: number;
};

function titleLength(game: Game): number {
  return game.titre.length + (game.sousTitre ? game.sousTitre.length + 3 : 0);
}

export function layoutColumns(games: Game[], optimize: boolean): PrintColumn[] {
  const ordered = optimize
    ? [...games].sort((a, b) => titleLength(a) - titleLength(b))
    : games;
  const size = Math.max(1, Math.ceil(ordered.length / COLUMN_COUNT));
  const columns: PrintColumn[] = [];
  for (let index = 0; index < COLUMN_COUNT; index++) {
    const slice = ordered.slice(index * size, (index + 1) * size);
    const weight = optimize ? Math.max(1, ...slice.map(titleLength)) : 1;
    columns.push({ games: slice, weight });
  }
  return columns;
}
