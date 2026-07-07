import { test, expect } from "vitest";
import { Game } from "../games";
import {
  isSoloOnly,
  playerCountsInSet,
  buildPrintSections,
  layoutColumns,
  PrintConfig,
} from "../print";

function makeGame(overrides: Partial<Game>): Game {
  return {
    myludoId: "",
    ean: [],
    titre: "",
    sousTitre: "",
    edition: null,
    joueursMin: null,
    joueursMax: null,
    dureeMin: null,
    dureeMax: null,
    age: null,
    categories: [],
    themes: [],
    mecanismes: [],
    editeur: [],
    auteurs: [],
    notePerso: null,
    noteMoyenne: null,
    dateAcquisition: "",
    emplacement: "",
    image: "",
    source: "manuel",
    description: "",
    rowIndex: 0,
    ...overrides,
  };
}

function config(overrides: Partial<PrintConfig>): PrintConfig {
  return {
    richness: "minimal",
    optimizeTitles: false,
    splitByType: false,
    splitByDuration: false,
    splitByPlayers: false,
    solo: "all",
    ...overrides,
  };
}

test("isSoloOnly is true only for games locked to a single player", () => {
  expect(isSoloOnly(makeGame({ joueursMin: 1, joueursMax: 1 }))).toBe(true);
  expect(isSoloOnly(makeGame({ joueursMin: 1, joueursMax: 4 }))).toBe(false);
  expect(isSoloOnly(makeGame({ joueursMin: 1, joueursMax: null }))).toBe(false);
  expect(isSoloOnly(makeGame({ joueursMin: 2, joueursMax: 2 }))).toBe(false);
});

test("playerCountsInSet lists every count supported by at least one game", () => {
  const games = [
    makeGame({ joueursMin: 1, joueursMax: 1 }),
    makeGame({ joueursMin: 2, joueursMax: 4 }),
  ];
  expect(playerCountsInSet(games)).toEqual([1, 2, 3, 4]);
});

test("buildPrintSections without splits returns the whole list on one page", () => {
  const games = [makeGame({ titre: "A" }), makeGame({ titre: "B" })];
  const sections = buildPrintSections(games, config({}));
  expect(sections).toHaveLength(1);
  expect(sections[0].label).toBe("");
  expect(sections[0].games).toEqual(games);
});

test("buildPrintSections solo=only and solo=exclude partition solo games", () => {
  const solo = makeGame({ titre: "Solo", joueursMin: 1, joueursMax: 1 });
  const duo = makeGame({ titre: "Duo", joueursMin: 2, joueursMax: 4 });
  expect(buildPrintSections([solo, duo], config({ solo: "only" }))).toEqual([
    { label: "", games: [solo] },
  ]);
  expect(buildPrintSections([solo, duo], config({ solo: "exclude" }))).toEqual([
    { label: "", games: [duo] },
  ]);
});

test("buildPrintSections splitByType splits by kind and skips empty kinds", () => {
  const board = makeGame({ titre: "Board", categories: ["Jeu de Cartes"] });
  const enigma = makeGame({ titre: "Escape", themes: ["Escape Game"] });
  const sections = buildPrintSections(
    [board, enigma],
    config({ splitByType: true }),
  );
  expect(sections.map((s) => s.label)).toEqual([
    "Jeux de plateau",
    "Enquetes & enigmes",
  ]);
});

test("buildPrintSections splitByPlayers duplicates games across supported counts", () => {
  const wide = makeGame({ titre: "Wide", joueursMin: 1, joueursMax: 3 });
  const sections = buildPrintSections([wide], config({ splitByPlayers: true }));
  expect(sections.map((s) => s.label)).toEqual([
    "1 joueur",
    "2 joueurs",
    "3 joueurs",
  ]);
  expect(sections.every((s) => s.games.length === 1)).toBe(true);
});

test("buildPrintSections splitByDuration splits by duration bucket and skips empty buckets", () => {
  const quick = makeGame({ titre: "Quick", dureeMin: 15, dureeMax: 20 });
  const epic = makeGame({ titre: "Epic", dureeMin: 180, dureeMax: 180 });
  const sections = buildPrintSections(
    [quick, epic],
    config({ splitByDuration: true }),
  );
  expect(sections.map((s) => s.label)).toEqual(["< 30 min", "2 h +"]);
  expect(sections[0].games).toEqual([quick]);
  expect(sections[1].games).toEqual([epic]);
});

test("buildPrintSections combines type, players, and solo filter", () => {
  const board2to4 = makeGame({
    titre: "Board",
    categories: ["Jeu de Cartes"],
    joueursMin: 2,
    joueursMax: 4,
  });
  const boardSolo = makeGame({
    titre: "BoardSolo",
    categories: ["Jeu de Cartes"],
    joueursMin: 1,
    joueursMax: 1,
  });
  const enigma2 = makeGame({
    titre: "Escape",
    themes: ["Escape Game"],
    joueursMin: 2,
    joueursMax: 2,
  });
  const sections = buildPrintSections(
    [board2to4, boardSolo, enigma2],
    config({ splitByType: true, splitByPlayers: true, solo: "exclude" }),
  );
  expect(sections.map((s) => s.label)).toEqual([
    "Jeux de plateau · 2 joueurs",
    "Jeux de plateau · 3 joueurs",
    "Jeux de plateau · 4 joueurs",
    "Enquetes & enigmes · 2 joueurs",
  ]);
  expect(sections.every((s) => s.games.every((g) => !isSoloOnly(g)))).toBe(
    true,
  );
});

test("layoutColumns keeps order and equal weights when not optimizing", () => {
  const games = [
    makeGame({ titre: "aaaa" }),
    makeGame({ titre: "bb" }),
    makeGame({ titre: "cccccc" }),
  ];
  const columns = layoutColumns(games, false);
  expect(columns.map((c) => c.weight)).toEqual([1, 1, 1]);
  expect(columns.flatMap((c) => c.games.map((g) => g.titre))).toEqual([
    "aaaa",
    "bb",
    "cccccc",
  ]);
});

test("layoutColumns sorts by title length and weights columns when optimizing", () => {
  const games = [
    makeGame({ titre: "cccccc" }),
    makeGame({ titre: "aa" }),
    makeGame({ titre: "bbbb" }),
  ];
  const columns = layoutColumns(games, true);
  expect(columns.flatMap((c) => c.games.map((g) => g.titre))).toEqual([
    "aa",
    "bbbb",
    "cccccc",
  ]);
  expect(columns.map((c) => c.weight)).toEqual([2, 4, 6]);
});
