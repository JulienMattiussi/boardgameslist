// @vitest-environment jsdom
import { test, expect, vi, afterEach, type Mock } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";

vi.mock("@/lib/import", () => ({
  formatFromName: vi.fn(() => "csv"),
  parseCollection: vi.fn(),
}));

import { parseCollection } from "@/lib/import";
import { Game } from "@/lib/games";
import { ImportModal } from "../ImportModal";

afterEach(cleanup);

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

const importGame = {
  myludoId: "",
  bggId: "13",
  ean: [],
  titre: "Catan",
  sousTitre: "",
  edition: 1995,
  joueursMin: 3,
  joueursMax: 4,
  dureeMin: 60,
  dureeMax: 120,
  age: 10,
  categories: [],
  themes: [],
  mecanismes: [],
  editeur: [],
  auteurs: [],
  notePerso: null,
  noteMoyenne: 7.1,
  dateAcquisition: "",
  emplacement: "",
};

const bggGame = {
  bggId: "13",
  titre: "Catan",
  annee: 1995,
  joueursMin: 3,
  joueursMax: 4,
  dureeMin: 60,
  dureeMax: 120,
  age: 10,
  categories: ["Jeu de Cartes"],
  themes: ["Économie"],
  mecanismes: ["Jet De Dés"],
  auteurs: ["Klaus Teuber"],
  editeur: ["KOSMOS"],
  noteMoyenne: 7.1,
  image: "https://img/catan.jpg",
  description: "Trade.",
};

type ApplyBody = { operations: Array<{ fields: Record<string, unknown> }> };

test("import enriches new games via BGG before applying", async () => {
  (parseCollection as Mock).mockReturnValue({
    source: "bgg",
    imports: [importGame],
  });

  const applyBodies: ApplyBody[] = [];
  const fetchMock = vi.fn((url: string, options?: { body?: string }) => {
    if (url.startsWith("/api/bgg/thing")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ game: bggGame }),
      });
    }
    applyBodies.push(JSON.parse(options?.body ?? "{}") as ApplyBody);
    return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
  });
  vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
  const onImported = vi.fn();

  const { container } = render(
    <ImportModal games={[]} onClose={vi.fn()} onImported={onImported} />,
  );

  const input = container.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  const file = new File(["objectid;objectname"], "collection.csv", {
    type: "text/csv",
  });
  fireEvent.change(input, { target: { files: [file] } });

  await screen.findByText(/Fichier BoardGameGeek/);
  fireEvent.click(screen.getByRole("button", { name: "Analyser" }));
  fireEvent.click(screen.getByRole("button", { name: /Importer/ }));

  await waitFor(() => expect(onImported).toHaveBeenCalled());

  expect(applyBodies).toHaveLength(1);
  const fields = applyBodies[0].operations[0].fields;
  expect(fields.bggId).toBe("13");
  expect(fields.source).toBe("bgg");
  expect(fields.categories).toEqual(["Jeu de Cartes"]);
  expect(fields.mecanismes).toEqual(["Jet De Dés"]);
  expect(fields.image).toBe("https://img/catan.jpg");
});

test("bulk 'garder l'import' resolves every match and merges on apply", async () => {
  const imp = {
    ...importGame,
    bggId: "",
    titre: "Alpha",
    age: 12,
  };
  (parseCollection as Mock).mockReturnValue({
    source: "myludo",
    imports: [imp],
  });

  const applyBodies: {
    operations: Array<{ fields: Record<string, unknown> }>;
  }[] = [];
  const fetchMock = vi.fn((_url: string, options?: { body?: string }) => {
    applyBodies.push(JSON.parse(options?.body ?? "{}"));
    return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
  });
  vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

  const existing = makeGame({
    titre: "Alpha",
    age: 10,
    rowIndex: 5,
    source: "myludo",
  });
  render(
    <ImportModal games={[existing]} onClose={vi.fn()} onImported={vi.fn()} />,
  );

  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  fireEvent.change(input, {
    target: { files: [new File(["x"], "c.csv", { type: "text/csv" })] },
  });
  await screen.findByText(/Fichier Myludo/);
  fireEvent.click(screen.getByRole("button", { name: "Analyser" }));

  fireEvent.click(screen.getByRole("button", { name: "garder l'import" }));
  fireEvent.click(screen.getByRole("button", { name: /Importer/ }));

  await waitFor(() => expect(applyBodies).toHaveLength(1));
  const fields = applyBodies[0].operations[0].fields;
  expect(fields.age).toBe(12);
  expect(fields.rowIndex).toBe(5);
  expect(fields.source).toBe("myludo");
});

test("bulk 'garder l'actuel' keeps existing data but injects the bgg_id", async () => {
  const imp = { ...importGame, bggId: "13", titre: "Alpha", age: 12 };
  (parseCollection as Mock).mockReturnValue({ source: "bgg", imports: [imp] });

  const applyBodies: {
    operations: Array<{ fields: Record<string, unknown> }>;
  }[] = [];
  const fetchMock = vi.fn((url: string, options?: { body?: string }) => {
    if (url.startsWith("/api/bgg/thing")) {
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }
    applyBodies.push(JSON.parse(options?.body ?? "{}"));
    return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
  });
  vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

  const existing = makeGame({
    titre: "Alpha",
    age: 10,
    rowIndex: 5,
    source: "manuel",
  });
  render(
    <ImportModal games={[existing]} onClose={vi.fn()} onImported={vi.fn()} />,
  );

  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  fireEvent.change(input, {
    target: { files: [new File(["x"], "c.csv", { type: "text/csv" })] },
  });
  await screen.findByText(/Fichier BoardGameGeek/);
  fireEvent.click(screen.getByRole("button", { name: "Analyser" }));

  fireEvent.click(screen.getByRole("button", { name: "garder l'actuel" }));
  fireEvent.click(screen.getByRole("button", { name: /Importer/ }));

  await waitFor(() => expect(applyBodies).toHaveLength(1));
  const fields = applyBodies[0].operations[0].fields;
  expect(fields.bggId).toBe("13");
  expect(fields.age).toBe(10);
  expect(fields.source).toBe("bgg");
  expect(fields.rowIndex).toBe(5);
});
