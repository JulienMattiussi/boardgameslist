import { test, expect } from "vitest";
import { parseBggCollection, isBggCollection } from "../import";
import { parseCollection } from "../../import";

const BGG_CSV = [
  "objectname;objectid;own;rating;average;minplayers;maxplayers;minplaytime;maxplaytime;bggrecagerange;yearpublished;barcode;acquisitiondate;invlocation",
  "Catan;13;1;7.5;7.09;3;4;60;120;10+;1995;;2024-01-15;Etagere A",
  "Wishlist Game;999;0;0;6;2;4;30;30;8+;2020;;;",
  "Bomb Busters;414855;1;0;6.56;2;6;15;15;6+;2024;3760052143861;;",
].join("\n");

const bytes = (text: string) => new TextEncoder().encode(text);

test("isBggCollection detects the BGG collection header", () => {
  expect(isBggCollection(["objectname", "objectid", "rating"])).toBe(true);
  expect(isBggCollection(["ID", "EAN", "Titre"])).toBe(false);
});

test("parseBggCollection maps rows and keeps only owned games", () => {
  const games = parseBggCollection(BGG_CSV);
  expect(games.map((g) => g.titre)).toEqual(["Catan", "Bomb Busters"]);

  const catan = games[0];
  expect(catan.bggId).toBe("13");
  expect(catan.myludoId).toBe("");
  expect(catan.notePerso).toBe(7.5);
  expect(catan.noteMoyenne).toBe(7.1);
  expect(catan.joueursMin).toBe(3);
  expect(catan.joueursMax).toBe(4);
  expect(catan.dureeMin).toBe(60);
  expect(catan.dureeMax).toBe(120);
  expect(catan.age).toBeNull();
  expect(catan.edition).toBe(1995);
  expect(catan.ean).toEqual([]);
  expect(catan.dateAcquisition).toBe("2024-01-15");
  expect(catan.emplacement).toBe("Etagere A");

  const bomb = games[1];
  expect(bomb.notePerso).toBeNull();
  expect(bomb.noteMoyenne).toBe(6.6);
  expect(bomb.age).toBeNull();
  expect(bomb.ean).toEqual(["3760052143861"]);
});

test("parseBggCollection falls back to playingtime for duration", () => {
  const csv =
    "objectid;objectname;own;playingtime;minplaytime;maxplaytime\n5;X;1;45;;";
  const [game] = parseBggCollection(csv);
  expect(game.dureeMin).toBe(45);
  expect(game.dureeMax).toBe(45);
});

test("parseCollection routes a BGG CSV to the bgg source", () => {
  const result = parseCollection("csv", bytes(BGG_CSV));
  expect(result.source).toBe("bgg");
  expect(result.imports).toHaveLength(2);
});

test("parseCollection routes a Myludo CSV to the myludo source", () => {
  const myludoCsv = "ID;EAN;Titre\n75231;;2 Pommes 3 Pains";
  const result = parseCollection("csv", bytes(myludoCsv));
  expect(result.source).toBe("myludo");
  expect(result.imports[0].titre).toBe("2 Pommes 3 Pains");
  expect(result.imports[0].myludoId).toBe("75231");
});

test("parseCollection treats JSON as Myludo", () => {
  const json = JSON.stringify([{ ID: "1", EAN: "", Titre: "Test" }]);
  expect(parseCollection("json", bytes(json)).source).toBe("myludo");
});
