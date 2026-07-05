import { test, expect } from "vitest";
import { Game } from "../games";
import {
  matchesQuery,
  gameSupportsPlayers,
  gameInDuration,
  gameKind,
  filterGames,
  sortGames,
} from "../filter";

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
    age: "",
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

test("query matching is accent- and case-insensitive across fields", () => {
  const game = makeGame({
    titre: "Les Âmes Seules",
    auteurs: ["Bruno Faidutti"],
    description: "Un livre-jeu narratif et solitaire.",
  });
  expect(matchesQuery(game, "ames")).toBe(true);
  expect(matchesQuery(game, "FAIDUTTI")).toBe(true);
  expect(matchesQuery(game, "narratif")).toBe(true);
  expect(matchesQuery(game, "zzz")).toBe(false);
  expect(matchesQuery(game, "  ")).toBe(true);
});

test("gameKind classifies puzzle/enquete games as enigme, others as societe", () => {
  expect(gameKind(makeGame({ categories: ["Jeu de Cartes"] }))).toBe("societe");
  expect(
    gameKind(makeGame({ categories: ["Livre dont vous êtes le héros"], themes: ["Enquêtes & Mystères"] }))
  ).toBe("enigme");
  expect(gameKind(makeGame({ themes: ["Escape Game"] }))).toBe("enigme");
});

test("player support respects ranges and open-ended bounds", () => {
  expect(gameSupportsPlayers(makeGame({ joueursMin: 2, joueursMax: 6 }), 4)).toBe(true);
  expect(gameSupportsPlayers(makeGame({ joueursMin: 2, joueursMax: 6 }), 8)).toBe(false);
  expect(gameSupportsPlayers(makeGame({ joueursMin: 1, joueursMax: null }), 9)).toBe(true);
  expect(gameSupportsPlayers(makeGame({ joueursMin: null, joueursMax: null }), 2)).toBe(false);
});

test("duration bucket membership uses range overlap and open-ended max", () => {
  const short = { min: 0, max: 29 };
  const epic = { min: 121, max: Number.POSITIVE_INFINITY };
  expect(gameInDuration(makeGame({ dureeMin: 15, dureeMax: 30 }), short)).toBe(true);
  expect(gameInDuration(makeGame({ dureeMin: 60, dureeMax: 60 }), short)).toBe(false);
  expect(gameInDuration(makeGame({ dureeMin: 120, dureeMax: null }), epic)).toBe(true);
  expect(gameInDuration(makeGame({ dureeMin: null, dureeMax: null }), short)).toBe(false);
});

test("filterGames combines query, player, duration and kind filters", () => {
  const games = [
    makeGame({ titre: "Citadelles", joueursMin: 2, joueursMax: 8, dureeMax: 60, categories: ["Jeu de Cartes"] }),
    makeGame({ titre: "The Mind", joueursMin: 2, joueursMax: 4, dureeMax: 15, categories: ["Jeu de Cartes"] }),
    makeGame({ titre: "Pictionary Man", joueursMin: 2, joueursMax: null, dureeMax: null }),
    makeGame({ titre: "Enquete", joueursMin: 1, joueursMax: 4, dureeMax: 90, themes: ["Enquêtes"] }),
  ];
  const all = { players: null, duration: null, kind: null } as const;
  expect(filterGames(games, { ...all, query: "the" }).map((g) => g.titre)).toEqual(["The Mind"]);
  expect(filterGames(games, { ...all, query: "", players: 6 }).map((g) => g.titre)).toEqual([
    "Citadelles",
    "Pictionary Man",
  ]);
  expect(
    filterGames(games, { ...all, query: "", duration: { min: 0, max: 29 } }).map((g) => g.titre)
  ).toEqual(["The Mind"]);
  expect(filterGames(games, { ...all, query: "", kind: "enigme" }).map((g) => g.titre)).toEqual(["Enquete"]);
});

test("sortGames orders by title, rating, then duration without mutating input", () => {
  const games = [
    makeGame({ titre: "Zeus", noteMoyenne: 6, dureeMax: 90 }),
    makeGame({ titre: "Alpha", noteMoyenne: 8, dureeMax: 30 }),
    makeGame({ titre: "Mid", noteMoyenne: null, dureeMax: null }),
  ];
  expect(sortGames(games, "titre").map((g) => g.titre)).toEqual(["Alpha", "Mid", "Zeus"]);
  expect(sortGames(games, "note").map((g) => g.titre)).toEqual(["Alpha", "Zeus", "Mid"]);
  expect(sortGames(games, "duree").map((g) => g.titre)).toEqual(["Alpha", "Zeus", "Mid"]);
  expect(games[0].titre).toBe("Zeus");
});

test("sortGames orders by minimum age with unknown ages last", () => {
  const games = [
    makeGame({ titre: "Douze", age: "12+" }),
    makeGame({ titre: "Six", age: "6+" }),
    makeGame({ titre: "Inconnu", age: "" }),
    makeGame({ titre: "Huit", age: "8+" }),
  ];
  expect(sortGames(games, "age").map((g) => g.titre)).toEqual([
    "Six",
    "Huit",
    "Douze",
    "Inconnu",
  ]);
});
