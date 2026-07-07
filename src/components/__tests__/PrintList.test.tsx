// @vitest-environment jsdom
import { test, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { Game } from "@/lib/games";
import { PrintList } from "../PrintList";

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
    rowIndex: 0,
    ...overrides,
  };
}

function headers(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("th")).map(
    (th) => th.textContent ?? "",
  );
}

test("PrintList normal renders three columns with the base headers only", () => {
  const { container } = render(
    <PrintList
      games={[makeGame({ titre: "A", rowIndex: 0 })]}
      summary=""
      density="normal"
    />,
  );
  expect(container.querySelectorAll("table")).toHaveLength(3);
  const th = headers(container);
  expect(th).toContain("Titre");
  expect(th).not.toContain("Age");
  expect(th).not.toContain("Note");
});

test("PrintList rich uses two columns, adds Age and Note, an image placeholder and meta lines", () => {
  const game = makeGame({
    titre: "A",
    rowIndex: 0,
    categories: ["Cartes"],
    mecanismes: ["Draft"],
    auteurs: ["Auteur X"],
    editeur: ["Editeur Y"],
    age: 8,
    notePerso: 9,
  });
  const { container } = render(
    <PrintList games={[game]} summary="" density="rich" />,
  );
  expect(container.querySelectorAll("table")).toHaveLength(2);
  const th = headers(container);
  expect(th).toContain("Age");
  expect(th).toContain("Note");
  expect(container.querySelectorAll(".thumb").length).toBeGreaterThan(0);
  expect(container.textContent).toContain("Cartes");
  expect(container.textContent).toContain("Draft");
  expect(container.textContent).toContain("Auteur X");
});

test("PrintList compact marks the sheet as compact", () => {
  const { container } = render(
    <PrintList
      games={[makeGame({ rowIndex: 0 })]}
      summary=""
      density="compact"
    />,
  );
  expect(container.querySelectorAll(".compact")).toHaveLength(1);
  expect(container.querySelectorAll("table")).toHaveLength(3);
});

test("PrintList renders a section label and an empty list without crashing", () => {
  const { container } = render(
    <PrintList
      games={[]}
      summary="Filtre"
      label="2 joueurs"
      density="normal"
    />,
  );
  expect(container.textContent).toContain("2 joueurs");
  expect(container.querySelectorAll("tbody tr")).toHaveLength(0);
});
