import { test, expect } from "vitest";
import { Game } from "../games";
import {
  isSoloOnly,
  playerCountsInSet,
  buildPrintSections,
  columnCountFor,
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
    bggId: "",
    rowIndex: 0,
    ...overrides,
  };
}

function config(overrides: Partial<PrintConfig>): PrintConfig {
  return {
    density: "normal",
    splitByType: false,
    splitByCategory: false,
    splitByTheme: false,
    splitByMechanic: false,
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

test("buildPrintSections splitByCategory makes one page per category, duplicating multi-category games", () => {
  const a = makeGame({ titre: "A", categories: ["Cartes", "Familial"] });
  const b = makeGame({ titre: "B", categories: ["Familial"] });
  const sections = buildPrintSections(
    [a, b],
    config({ splitByCategory: true }),
  );
  expect(sections.map((s) => s.label)).toEqual(["Cartes", "Familial"]);
  expect(sections[0].games).toEqual([a]);
  expect(sections[1].games).toEqual([a, b]);
});

test("buildPrintSections splitByTheme and splitByMechanic use their fields", () => {
  const a = makeGame({ titre: "A", themes: ["Espace"], mecanismes: ["Draft"] });
  expect(
    buildPrintSections([a], config({ splitByTheme: true })).map((s) => s.label),
  ).toEqual(["Espace"]);
  expect(
    buildPrintSections([a], config({ splitByMechanic: true })).map(
      (s) => s.label,
    ),
  ).toEqual(["Draft"]);
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

test("buildPrintSections returns no pages for an empty list", () => {
  expect(buildPrintSections([], config({}))).toEqual([]);
  expect(
    buildPrintSections(
      [],
      config({
        splitByType: true,
        splitByPlayers: true,
        splitByCategory: true,
      }),
    ),
  ).toEqual([]);
});

test("splitByPlayers with solo=exclude skips the 1-player page", () => {
  const wide = makeGame({ titre: "Wide", joueursMin: 1, joueursMax: 3 });
  const soloOnly = makeGame({ titre: "Solo", joueursMin: 1, joueursMax: 1 });
  const sections = buildPrintSections(
    [wide, soloOnly],
    config({ splitByPlayers: true, solo: "exclude" }),
  );
  expect(sections.map((s) => s.label)).toEqual(["2 joueurs", "3 joueurs"]);
  expect(sections.flatMap((s) => s.games)).toEqual([wide, wide]);
});

test("splitByPlayers with solo=only keeps only the 1-player page", () => {
  const soloOnly = makeGame({ titre: "Solo", joueursMin: 1, joueursMax: 1 });
  const wide = makeGame({ titre: "Wide", joueursMin: 1, joueursMax: 4 });
  const sections = buildPrintSections(
    [soloOnly, wide],
    config({ splitByPlayers: true, solo: "only" }),
  );
  expect(sections.map((s) => s.label)).toEqual(["1 joueur"]);
  expect(sections[0].games).toEqual([soloOnly]);
});

test("playerCountsInSet caps very large maximums and ignores missing data", () => {
  expect(
    playerCountsInSet([makeGame({ joueursMin: 1, joueursMax: 20 })]),
  ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  expect(
    playerCountsInSet([makeGame({ joueursMin: null, joueursMax: null })]),
  ).toEqual([]);
});

test("splitByCategory drops games that have no category", () => {
  const withCat = makeGame({ titre: "A", categories: ["Cartes"] });
  const without = makeGame({ titre: "B", categories: [] });
  const sections = buildPrintSections(
    [withCat, without],
    config({ splitByCategory: true }),
  );
  expect(sections.map((s) => s.label)).toEqual(["Cartes"]);
  expect(sections[0].games).toEqual([withCat]);
});

test("splitByDuration places a game spanning buckets on several pages", () => {
  const spanning = makeGame({ titre: "Span", dureeMin: 20, dureeMax: 90 });
  const sections = buildPrintSections(
    [spanning],
    config({ splitByDuration: true }),
  );
  expect(sections.map((s) => s.label)).toEqual([
    "< 30 min",
    "30-60 min",
    "1-2 h",
  ]);
});

test("columnCountFor uses a single column for rich and three otherwise", () => {
  expect(columnCountFor("rich")).toBe(1);
  expect(columnCountFor("normal")).toBe(3);
  expect(columnCountFor("compact")).toBe(3);
});
