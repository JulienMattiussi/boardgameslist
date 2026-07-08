// @vitest-environment jsdom
import { test, expect, vi, afterEach, beforeEach, type Mock } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { Game } from "@/lib/games";
import { GameFormModal } from "../GameFormModal";

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
    rowIndex: 2,
    ...overrides,
  };
}

afterEach(cleanup);
beforeEach(() => {
  vi.restoreAllMocks();
});

const CATAN_GAME = {
  bggId: "13",
  titre: "Catan",
  annee: 1995,
  joueursMin: 3,
  joueursMax: 4,
  dureeMin: 60,
  dureeMax: 120,
  age: 10,
  categories: ["Economic"],
  themes: [],
  mecanismes: ["Dice Rolling"],
  auteurs: ["Klaus Teuber"],
  editeur: ["KOSMOS"],
  noteMoyenne: null,
  image: "https://img/catan.jpg",
  description: "Trade and build.",
};

function openBggWith(id: string) {
  fireEvent.click(screen.getByText("Recuperer depuis BGG"));
  fireEvent.change(
    screen.getByPlaceholderText("URL ou id BoardGameGeek (ex: 13)"),
    { target: { value: id } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Recuperer" }));
}

test("BGG fetch by id fills the empty form fields", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ game: CATAN_GAME }),
    }) as Mock,
  );

  render(<GameFormModal game={null} onClose={vi.fn()} onSaved={vi.fn()} />);
  openBggWith("13");

  await waitFor(() => {
    expect(screen.getByDisplayValue("https://img/catan.jpg")).toBeTruthy();
  });
  expect(fetch).toHaveBeenCalledWith("/api/bgg/thing?id=13");
  expect(screen.getByDisplayValue("Catan")).toBeTruthy();
  expect(screen.getByDisplayValue("Klaus Teuber")).toBeTruthy();
});

test("BGG fetch overwrites title and metadata of a manual game but keeps description", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        game: { ...CATAN_GAME, categories: ["Jeu de Cartes"] },
      }),
    }) as Mock,
  );

  const game = makeGame({
    source: "manuel",
    titre: "Mon titre",
    description: "Ma description",
    categories: ["Ancienne"],
    image: "",
  });
  render(<GameFormModal game={game} onClose={vi.fn()} onSaved={vi.fn()} />);
  openBggWith("13");

  await waitFor(() => {
    expect(screen.getByDisplayValue("Jeu de Cartes")).toBeTruthy();
  });
  expect(screen.getByDisplayValue("Catan")).toBeTruthy();
  expect(screen.getByDisplayValue("Ma description")).toBeTruthy();
  expect(screen.getByDisplayValue("https://img/catan.jpg")).toBeTruthy();
});

test("keeps the Myludo id: shows it and sends it back on save", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  vi.stubGlobal("fetch", fetchMock as Mock);

  const game = makeGame({ myludoId: "75231", titre: "Jeu", rowIndex: 5 });
  render(<GameFormModal game={game} onClose={vi.fn()} onSaved={vi.fn()} />);

  expect(screen.getByText("Myludo #75231")).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());

  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe("/api/games");
  expect(options.method).toBe("PUT");
  const body = JSON.parse(options.body as string);
  expect(body.myludoId).toBe("75231");
  expect(body.rowIndex).toBe(5);
});

test("BGG re-sync overwrites an already bgg-sourced game", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        game: { ...CATAN_GAME, categories: ["Jeu de Cartes"] },
      }),
    }) as Mock,
  );

  const game = makeGame({
    source: "bgg",
    titre: "Ancien titre",
    categories: ["Vieux"],
    image: "old.jpg",
  });
  render(<GameFormModal game={game} onClose={vi.fn()} onSaved={vi.fn()} />);
  openBggWith("13");

  await waitFor(() => {
    expect(screen.getByDisplayValue("Catan")).toBeTruthy();
  });
  expect(screen.getByDisplayValue("Jeu de Cartes")).toBeTruthy();
  expect(screen.getByDisplayValue("https://img/catan.jpg")).toBeTruthy();
});

test("BGG fetch only fills empty fields for a Myludo game", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        game: { ...CATAN_GAME, categories: ["Jeu de Cartes"] },
      }),
    }) as Mock,
  );

  const game = makeGame({
    source: "myludo",
    titre: "Titre Myludo",
    categories: ["Categorie Myludo"],
    image: "",
  });
  render(<GameFormModal game={game} onClose={vi.fn()} onSaved={vi.fn()} />);
  openBggWith("13");

  await waitFor(() => {
    expect(screen.getByDisplayValue("https://img/catan.jpg")).toBeTruthy();
  });
  expect(screen.getByDisplayValue("Titre Myludo")).toBeTruthy();
  expect(screen.getByDisplayValue("Categorie Myludo")).toBeTruthy();
});

test("BGG fetch surfaces an error when the request fails", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "BGG indisponible" }),
    }) as Mock,
  );

  render(<GameFormModal game={null} onClose={vi.fn()} onSaved={vi.fn()} />);
  openBggWith("13");

  expect(
    await screen.findByText("Recuperation BGG indisponible."),
  ).toBeTruthy();
});
