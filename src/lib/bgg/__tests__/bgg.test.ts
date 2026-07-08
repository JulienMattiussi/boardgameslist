import { test, expect } from "vitest";
import {
  parseGeekItem,
  parseRating,
  parseBggId,
  cleanDescription,
  mapCategories,
  mapThemes,
  mapMechanics,
} from "../map";

const GEEK_ITEM = {
  item: {
    objectid: 13,
    primaryname: { name: "Catan" },
    yearpublished: "1995",
    minplayers: "3",
    maxplayers: "4",
    minplaytime: "60",
    maxplaytime: "120",
    minage: "10",
    imageurl: "https://cf.geekdo-images.com/catan.png",
    description: "<p>In <strong>Catan</strong>, trade &amp; build.</p>",
    links: {
      boardgamecategory: [
        { name: "Card Game" },
        { name: "Economic" },
        { name: "Dice" },
        { name: "Fantasy" },
      ],
      boardgamemechanic: [{ name: "Dice Rolling" }, { name: "Take That" }],
      boardgamedesigner: [{ name: "Klaus Teuber" }],
      boardgamepublisher: [
        { name: "KOSMOS" },
        { name: "999 Games" },
        { name: "Mayfair Games" },
        { name: "Devir" },
      ],
    },
  },
};

const SPARSE_ITEM = {
  item: {
    objectid: 999,
    primaryname: { name: "Prototype" },
    minplayers: "0",
    maxplayers: "0",
    imageurl: "",
    links: {},
  },
};

test("parseGeekItem maps a geekitems payload to a normalized BggGame", () => {
  const game = parseGeekItem(GEEK_ITEM);
  expect(game).not.toBeNull();
  expect(game?.bggId).toBe("13");
  expect(game?.titre).toBe("Catan");
  expect(game?.annee).toBe(1995);
  expect(game?.joueursMin).toBe(3);
  expect(game?.joueursMax).toBe(4);
  expect(game?.dureeMin).toBe(60);
  expect(game?.dureeMax).toBe(120);
  expect(game?.age).toBe(10);
  expect(game?.categories).toEqual(["Jeu de Cartes", "Jeu de dés"]);
  expect(game?.themes).toEqual(["Économie", "Fantasy"]);
  expect(game?.mecanismes).toEqual(["Jet De Dés", "Dans Ta Face"]);
  expect(game?.auteurs).toEqual(["Klaus Teuber"]);
  expect(game?.image).toBe("https://cf.geekdo-images.com/catan.png");
  expect(game?.description).toBe("In Catan, trade & build.");
});

test("parseGeekItem caps the publishers list", () => {
  expect(parseGeekItem(GEEK_ITEM)?.editeur).toEqual([
    "KOSMOS",
    "999 Games",
    "Mayfair Games",
  ]);
});

test("parseGeekItem treats zero/absent values as null and missing links as empty", () => {
  const game = parseGeekItem(SPARSE_ITEM);
  expect(game?.joueursMin).toBeNull();
  expect(game?.joueursMax).toBeNull();
  expect(game?.age).toBeNull();
  expect(game?.noteMoyenne).toBeNull();
  expect(game?.categories).toEqual([]);
  expect(game?.image).toBe("");
});

test("parseGeekItem returns null when there is no item", () => {
  expect(parseGeekItem({})).toBeNull();
  expect(parseGeekItem({ item: {} })).toBeNull();
});

test("parseRating reads and rounds the average from dynamicinfo", () => {
  expect(parseRating({ item: { stats: { average: "7.09049" } } })).toBe(7.1);
  expect(parseRating({ item: { stats: { average: "0" } } })).toBeNull();
  expect(parseRating(null)).toBeNull();
  expect(parseRating({ item: {} })).toBeNull();
});

test("mapCategories maps known BGG categories to French and drops the rest", () => {
  expect(
    mapCategories(["Card Game", "Economic", "Dice", "Party Game"]),
  ).toEqual(["Jeu de Cartes", "Jeu de dés", "Jeu d'Ambiance"]);
  expect(mapCategories(["Deduction", "Murder/Mystery"])).toEqual([
    "Jeu d'Enquête",
  ]);
  expect(mapCategories(["Fantasy", "Economic"])).toEqual([]);
});

test("mapThemes routes thematic BGG categories to French themes", () => {
  expect(mapThemes(["Fantasy", "Economic", "Card Game", "Pirates"])).toEqual([
    "Fantasy",
    "Économie",
    "Pirates",
  ]);
  expect(mapThemes(["World War II", "Napoleonic"])).toEqual(["Guerre"]);
});

test("mapMechanics translates BGG mechanics to French and drops the rest", () => {
  expect(
    mapMechanics(["Hand Management", "Take That", "Unknown Mechanic"]),
  ).toEqual(["Gestion de main", "Dans Ta Face"]);
  expect(mapMechanics(["Open Drafting", "Closed Drafting"])).toEqual(["Draft"]);
});

test("parseBggId extracts the id from a URL or a raw number", () => {
  expect(parseBggId("13")).toBe("13");
  expect(parseBggId("https://boardgamegeek.com/boardgame/13/catan")).toBe("13");
  expect(
    parseBggId("https://boardgamegeek.com/boardgameexpansion/926/seafarers"),
  ).toBe("926");
  expect(parseBggId("  174430  ")).toBe("174430");
  expect(parseBggId("not an id")).toBe("");
});

test("cleanDescription strips tags and decodes entities", () => {
  expect(cleanDescription("A&#10;B")).toBe("A\nB");
  expect(cleanDescription("x &amp; y")).toBe("x & y");
  expect(cleanDescription("<b>bold</b> plain")).toBe("bold plain");
  expect(cleanDescription("")).toBe("");
});
