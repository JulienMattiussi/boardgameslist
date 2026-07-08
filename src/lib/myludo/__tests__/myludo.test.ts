import { test, expect } from "vitest";
import { Game } from "../../games";
import { MyludoImport } from "../types";
import { parseRange, rawToImport } from "../normalize";
import { readJson, readCsv, parseDelimited } from "../readers";
import { parseSharedStrings, sheetToRows, parseDateStyles } from "../readXlsx";
import { buildImportPlan, findConflicts } from "../dedup";
import { newFields, mergeFields } from "../merge";
import { compareGames, isIdenticalDuplicate } from "../compare";
import { parseMyludo } from "../parse";

const bytes = (text: string) => new TextEncoder().encode(text);

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

function makeImport(overrides: Partial<MyludoImport>): MyludoImport {
  return {
    myludoId: "",
    bggId: "",
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
    ...overrides,
  };
}

test("parseRange handles ranges, open-ended, parenthesised, Duo, dashes and junk", () => {
  expect(parseRange("2 — 6")).toEqual({ min: 2, max: 6 });
  expect(parseRange("2-6")).toEqual({ min: 2, max: 6 });
  expect(parseRange("1+")).toEqual({ min: 1, max: null });
  expect(parseRange("(5)")).toEqual({ min: 5, max: 5 });
  expect(parseRange("Duo")).toEqual({ min: 2, max: 2 });
  expect(parseRange("60")).toEqual({ min: 60, max: 60 });
  expect(parseRange("X")).toEqual({ min: null, max: null });
  expect(parseRange("")).toEqual({ min: null, max: null });
});

test("rawToImport normalizes a raw record whatever its origin format", () => {
  const imp = rawToImport({
    ID: "75231",
    EAN: ["3770024165050"],
    Titre: "2 Pommes 3 Pains",
    Édition: "2024",
    "Joueur(s)": "2 — 6",
    Durée: "15 — 30",
    "Age(s)": "8+",
    "Catégorie(s)": ["Jeu de Cartes"],
    "Auteur(s)": ["Clément Gustave", "Tommy Paupe"],
    "Note personnelle": "0",
    "Note moyenne": "6.6",
  });
  expect(imp.myludoId).toBe("75231");
  expect(imp.ean).toEqual(["3770024165050"]);
  expect(imp.edition).toBe(2024);
  expect(imp.joueursMin).toBe(2);
  expect(imp.joueursMax).toBe(6);
  expect(imp.dureeMin).toBe(15);
  expect(imp.dureeMax).toBe(30);
  expect(imp.age).toBe(8);
  expect(imp.categories).toEqual(["Jeu de Cartes"]);
  expect(imp.auteurs).toEqual(["Clément Gustave", "Tommy Paupe"]);
  expect(imp.notePerso).toBeNull();
  expect(imp.noteMoyenne).toBe(6.6);
});

test("readJson and readCsv produce the same normalized import", () => {
  const json = readJson(
    JSON.stringify([
      {
        ID: 75231,
        EAN: [3770024165050],
        Titre: "2 Pommes 3 Pains",
        "Joueur(s)": "2 — 6",
        "Auteur(s)": ["Clément Gustave", "Tommy Paupe"],
      },
    ]),
  );
  const csv = readCsv(
    "ID;EAN;Titre;Joueur(s);Auteur(s)\n" +
      '75231;3770024165050;2 Pommes 3 Pains;"2 — 6";"Clément Gustave,Tommy Paupe"\n',
  );
  expect(rawToImport(json[0])).toEqual(rawToImport(csv[0]));
});

test("readCsv splits multi-value cells and handles quotes", () => {
  const raws = readCsv(
    "ID;EAN;Titre;Auteur(s)\n" +
      '1;"111,222";"Jeu; avec point-virgule";"A,B"\n',
  );
  expect(raws).toHaveLength(1);
  expect(raws[0].EAN).toEqual(["111", "222"]);
  expect(raws[0].Titre).toBe("Jeu; avec point-virgule");
  expect(raws[0]["Auteur(s)"]).toEqual(["A", "B"]);
});

test("parseDelimited keeps quoted delimiters and unescapes doubled quotes", () => {
  const rows = parseDelimited('a;"b;c";"d""e"\n', ";");
  expect(rows[0]).toEqual(["a", "b;c", 'd"e']);
});

test("XLSX helpers parse shared strings and sheet cells into rows", () => {
  const shared = parseSharedStrings(
    "<sst><si><t>ID</t></si><si><t>Titre</t></si>" +
      "<si><r><t>Deux </t></r><r><t>Pommes</t></r></si></sst>",
  );
  expect(shared).toEqual(["ID", "Titre", "Deux Pommes"]);
  const rows = sheetToRows(
    '<sheetData><row r="1"><c r="A1" t="s"><v>0</v></c>' +
      '<c r="B1" t="s"><v>1</v></c></row>' +
      '<row r="2"><c r="A2"><v>75231</v></c>' +
      '<c r="B2" t="s"><v>2</v></c></row></sheetData>',
    shared,
  );
  expect(rows).toEqual([
    ["ID", "Titre"],
    ["75231", "Deux Pommes"],
  ]);
});

test("XLSX converts date-styled serial cells to a readable ISO date", () => {
  const dateStyles = parseDateStyles(
    '<styleSheet><numFmts><numFmt numFmtId="166" formatCode="DD/MM/YYYY"/>' +
      "</numFmts>" +
      '<cellXfs count="2"><xf numFmtId="0"/><xf numFmtId="166"/>' +
      "</cellXfs></styleSheet>",
  );
  expect(dateStyles).toEqual(new Set([1]));
  const rows = sheetToRows(
    '<sheetData><row r="1"><c r="A1" s="0"><v>7</v></c>' +
      '<c r="B1" s="1" t="n"><v>45928.416666667</v></c></row></sheetData>',
    [],
    dateStyles,
  );
  expect(rows).toEqual([["7", "2025-09-28"]]);
});

test("buildImportPlan runs the dedup cascade id -> ean -> title", () => {
  const existing = [
    makeGame({ myludoId: "1", ean: ["111"], titre: "Alpha" }),
    makeGame({ titre: "Bêta" }),
  ];
  const plan = buildImportPlan(
    [
      makeImport({ myludoId: "1", titre: "Alpha" }),
      makeImport({ ean: ["111"], titre: "Autre nom" }),
      makeImport({ titre: "beta" }),
      makeImport({ titre: "Gamma" }),
    ],
    existing,
  );
  expect(plan.entries.map((e) => e.kind)).toEqual([
    "match",
    "match",
    "probable",
    "new",
  ]);
  expect(plan.entries[0]).toMatchObject({ matchedBy: "myludo_id" });
  expect(plan.entries[1]).toMatchObject({ matchedBy: "ean" });
  expect(plan.entries[2]).toMatchObject({ matchedBy: "title" });
});

test("buildImportPlan matches by bgg_id (BGG import injects the id)", () => {
  const existing = [makeGame({ titre: "Catan", bggId: "13" })];
  const plan = buildImportPlan(
    [
      makeImport({ bggId: "13", titre: "Catan (renamed)" }),
      makeImport({ bggId: "999", titre: "Nouveau" }),
    ],
    existing,
  );
  expect(plan.entries[0]).toMatchObject({
    kind: "match",
    matchedBy: "bgg_id",
  });
  expect(plan.entries[1].kind).toBe("new");
});

test("compareGames ignores title case/accents/punctuation and contained ranges", () => {
  const existing = makeGame({
    titre: "Egizia : Shifting Sands",
    dureeMin: 15,
    dureeMax: 30,
    joueursMin: 2,
    joueursMax: 6,
  });
  const incoming = makeImport({
    titre: "Egizia: Shifting Sands",
    dureeMin: 15,
    dureeMax: 15,
    joueursMin: 2,
    joueursMax: 6,
  });
  const rows = compareGames(existing, incoming);
  const at = (label: string) => rows.find((r) => r.label === label)?.status;
  expect(at("Titre")).toBe("same");
  expect(at("Duree")).toBe("same");
  expect(at("Joueurs")).toBe("same");
});

test("compareGames still flags a duration the import widens", () => {
  const existing = makeGame({ titre: "X", dureeMin: 15, dureeMax: 15 });
  const incoming = makeImport({ titre: "X", dureeMin: 15, dureeMax: 30 });
  const duree = compareGames(existing, incoming).find(
    (r) => r.label === "Duree",
  );
  expect(duree?.status).toBe("conflict");
});

test("findConflicts flags differing non-empty fields, fills empty ones silently", () => {
  const existing = makeGame({
    myludoId: "1",
    titre: "Alpha",
    age: 10,
    editeur: [],
  });
  const incoming = makeImport({
    myludoId: "1",
    titre: "Alpha",
    age: 12,
    editeur: ["Iello"],
  });
  const conflicts = findConflicts(existing, incoming);
  expect(conflicts).toEqual([{ field: "age", current: "10", incoming: "12" }]);
});

test("mergeFields fills empty cells, keeps conflicts unless replaced, attaches id", () => {
  const existing = makeGame({
    rowIndex: 5,
    myludoId: "",
    titre: "Alpha",
    age: 10,
    editeur: [],
    image: "cover.png",
    description: "note perso",
  });
  const incoming = makeImport({
    myludoId: "99",
    titre: "Alpha",
    age: 12,
    editeur: ["Iello"],
  });
  const kept = mergeFields(existing, incoming, [], "myludo");
  expect(kept.age).toBe(10);
  expect(kept.editeur).toEqual(["Iello"]);
  expect(kept.myludoId).toBe("99");
  expect(kept.source).toBe("myludo");
  expect(kept.rowIndex).toBe(5);
  expect(kept.image).toBe("cover.png");
  expect(kept.description).toBe("note perso");

  const replaced = mergeFields(existing, incoming, ["age"], "myludo");
  expect(replaced.age).toBe(12);
});

test("compareGames flags only fields whose values differ", () => {
  const rows = compareGames(
    makeGame({ titre: "Alpha", age: 10, joueursMin: 2, joueursMax: 4 }),
    makeImport({ titre: "Alpha", age: 12, joueursMin: 2, joueursMax: 4 }),
  );
  const age = rows.find((row) => row.label === "Age");
  const players = rows.find((row) => row.label === "Joueurs");
  expect(age).toMatchObject({
    existing: "10",
    incoming: "12",
    status: "conflict",
    keys: ["age"],
  });
  expect(players).toMatchObject({ existing: "2-4", status: "same" });
});

test("isIdenticalDuplicate ignores existing-only values but not new or conflicting ones", () => {
  const base = makeGame({ titre: "Alpha", emplacement: "Etagere A" });
  expect(
    isIdenticalDuplicate(compareGames(base, makeImport({ titre: "Alpha" }))),
  ).toBe(true);
  expect(
    isIdenticalDuplicate(
      compareGames(base, makeImport({ titre: "Alpha", age: 10 })),
    ),
  ).toBe(false);
  expect(
    isIdenticalDuplicate(
      compareGames(
        makeGame({ titre: "Alpha", age: 10 }),
        makeImport({ titre: "Alpha", age: 12 }),
      ),
    ),
  ).toBe(false);
});

test("compareGames treats an EAN differing only by a leading zero as identical", () => {
  const rows = compareGames(
    makeGame({ titre: "Alpha", ean: ["0688623900121", "4002051577070"] }),
    makeImport({ titre: "Alpha", ean: ["688623900121", "4002051577070"] }),
  );
  const ean = rows.find((row) => row.label === "Code-barres (EAN)");
  expect(ean?.status).toBe("same");
  expect(isIdenticalDuplicate(rows)).toBe(true);
});

test("newFields tags the import as myludo", () => {
  const fields = newFields(
    makeImport({ titre: "Gamma", myludoId: "7" }),
    "myludo",
  );
  expect(fields.titre).toBe("Gamma");
  expect(fields.source).toBe("myludo");
});

test("parseMyludo rejects files that are not a Myludo export", () => {
  expect(() => parseMyludo("csv", bytes("a;b;c\n1;2;3\n"))).toThrow(/Myludo/);
  expect(() => parseMyludo("csv", bytes(""))).toThrow(/Aucun jeu/);
  expect(() => parseMyludo("csv", bytes("Titre;Age(s)\nAlpha;10+\n"))).toThrow(
    /Myludo/,
  );
});

test("parseMyludo rejects a Myludo-like file missing one identifier column", () => {
  expect(() => parseMyludo("csv", bytes("ID;Titre\n75231;Alpha\n"))).toThrow(
    /EAN/,
  );
});

test("parseMyludo tolerates unknown and missing columns (resilience)", () => {
  const imports = parseMyludo(
    "csv",
    bytes(
      "ID;EAN;Titre;ChampInconnu;Age(s)\n75231;111;Alpha;peu importe;10+\n",
    ),
  );
  expect(imports).toHaveLength(1);
  expect(imports[0].titre).toBe("Alpha");
  expect(imports[0].age).toBe(10);
  expect(imports[0].dureeMin).toBeNull();
  expect(imports[0].categories).toEqual([]);
});
