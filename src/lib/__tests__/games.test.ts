import { test, expect } from "vitest";
import { rowsToGames, gameToRow, normalizeGame, Game } from "../games";

const HEADER = [
  "MYLUDO_ID",
  "EUROPEAN_ARTICLE_NUMBER",
  "TITRE",
  "SOUS_TITRE",
  "EDITION",
  "JOUEURS_MIN",
  "JOUEURS_MAX",
  "DUREE_MIN",
  "DUREE_MAX",
  "AGE",
  "CATEGORIES",
  "THEMES",
  "MECANISMES",
  "EDITEUR",
  "AUTEURS",
  "NOTE_PERSO",
  "NOTE_MOYENNE",
  "DATE_ACQUISITION",
  "EMPLACEMENT",
  "IMAGE",
  "SOURCE",
];

function row(overrides: Partial<Record<string, string>>): string[] {
  return HEADER.map((h) => overrides[h] ?? "");
}

test("maps a full Myludo row to a typed Game", () => {
  const rows = [
    HEADER,
    [
      "75231",
      "3770024165050",
      "2 Pommes 3 Pains",
      "",
      "2024",
      "2",
      "6",
      "15",
      "30",
      "8+",
      "Jeu de Cartes",
      "Alimentation",
      "Rapidité",
      "Prétexte",
      "Clément Gustave; Tommy Paupe",
      "",
      "6.6",
      "2025-09-28",
      "",
      "",
      "myludo",
    ],
  ];
  const games = rowsToGames(rows);
  expect(games).toHaveLength(1);
  const game: Game = games[0];
  expect(game.myludoId).toBe("75231");
  expect(game.ean).toEqual(["3770024165050"]);
  expect(game.titre).toBe("2 Pommes 3 Pains");
  expect(game.joueursMin).toBe(2);
  expect(game.joueursMax).toBe(6);
  expect(game.dureeMin).toBe(15);
  expect(game.dureeMax).toBe(30);
  expect(game.age).toBe("8+");
  expect(game.categories).toEqual(["Jeu de Cartes"]);
  expect(game.auteurs).toEqual(["Clément Gustave", "Tommy Paupe"]);
  expect(game.notePerso).toBeNull();
  expect(game.noteMoyenne).toBe(6.6);
  expect(game.source).toBe("myludo");
});

test("leaves non-numeric player/duration cells empty as null", () => {
  const games = rowsToGames([
    HEADER,
    row({ TITRE: "Pictionary Man", JOUEURS_MIN: "2", SOURCE: "manuel" }),
  ]);
  expect(games[0].joueursMin).toBe(2);
  expect(games[0].joueursMax).toBeNull();
  expect(games[0].dureeMin).toBeNull();
  expect(games[0].dureeMax).toBeNull();
});

test("splits multi-value cells on ';' regardless of surrounding spaces", () => {
  const games = rowsToGames([
    HEADER,
    row({
      TITRE: "The Mind",
      EUROPEAN_ARTICLE_NUMBER: "3760207030329;4012426880667",
      EDITEUR: "Nürnberger Spielkarten Verlag; Oya",
    }),
  ]);
  expect(games[0].ean).toEqual(["3760207030329", "4012426880667"]);
  expect(games[0].editeur).toEqual(["Nürnberger Spielkarten Verlag", "Oya"]);
});

test("ignores fully empty rows", () => {
  const games = rowsToGames([HEADER, row({}), row({ TITRE: "Paléo" })]);
  expect(games).toHaveLength(1);
  expect(games[0].titre).toBe("Paléo");
});

test("resolves columns by header, not position, and tolerates reordering", () => {
  const games = rowsToGames([
    ["TITRE", "SOURCE", "JOUEURS_MIN"],
    ["Concept", "manuel", "4"],
  ]);
  expect(games[0].titre).toBe("Concept");
  expect(games[0].source).toBe("manuel");
  expect(games[0].joueursMin).toBe(4);
  expect(games[0].ean).toEqual([]);
  expect(games[0].noteMoyenne).toBeNull();
});

test("returns an empty array when there are no rows", () => {
  expect(rowsToGames([])).toEqual([]);
});

test("rowIndex maps to the 1-based sheet row", () => {
  const games = rowsToGames([
    ["TITRE"],
    ["Alpha"],
    ["Beta"],
  ]);
  expect(games.map((g) => [g.titre, g.rowIndex])).toEqual([
    ["Alpha", 2],
    ["Beta", 3],
  ]);
});

test("gameToRow serializes a game into typed cells in column order", () => {
  const [game] = rowsToGames([
    HEADER,
    [
      "75231",
      "3770024165050",
      "2 Pommes 3 Pains",
      "",
      "2024",
      "2",
      "6",
      "15",
      "30",
      "8+",
      "Jeu de Cartes",
      "Alimentation",
      "Rapidité",
      "Prétexte",
      "Clément Gustave; Tommy Paupe",
      "",
      "6.6",
      "2025-09-28",
      "",
      "",
      "myludo",
    ],
  ]);
  const row = gameToRow(game);
  expect(row[0]).toBe("75231");
  expect(row[2]).toBe("2 Pommes 3 Pains");
  expect(row[4]).toBe(2024);
  expect(row[5]).toBe(2);
  expect(row[6]).toBe(6);
  expect(row[14]).toBe("Clément Gustave; Tommy Paupe");
  expect(row[15]).toBe("");
  expect(row[16]).toBe(6.6);
  expect(row[17]).toBe(45928);
  expect(row[20]).toBe("myludo");
});

test("normalizeGame coerces untrusted input into a valid Game", () => {
  const game = normalizeGame({
    titre: "  Concept  ",
    joueursMin: "4",
    joueursMax: 12,
    dureeMin: "",
    noteMoyenne: "7.2",
    categories: ["Jeu", " ", "Ambiance "],
    editeur: "Repos; Asmodee",
    source: "manuel",
    rowIndex: 16,
    junk: "ignored",
  });
  expect(game.titre).toBe("Concept");
  expect(game.joueursMin).toBe(4);
  expect(game.joueursMax).toBe(12);
  expect(game.dureeMin).toBeNull();
  expect(game.noteMoyenne).toBe(7.2);
  expect(game.categories).toEqual(["Jeu", "Ambiance"]);
  expect(game.editeur).toEqual(["Repos", "Asmodee"]);
  expect(game.source).toBe("manuel");
  expect(game.rowIndex).toBe(16);
  expect((game as unknown as Record<string, unknown>).junk).toBeUndefined();
});
