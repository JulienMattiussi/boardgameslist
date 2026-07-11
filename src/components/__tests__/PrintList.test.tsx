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
    bggId: "",
    rowIndex: 0,
    ...overrides,
  };
}

function headerLabels(container: HTMLElement): string[] {
  const head = container.querySelector(".head");
  return head
    ? Array.from(head.children).map((child) => child.textContent ?? "")
    : [];
}

function columnCount(container: HTMLElement): string {
  const columns = container.querySelector(".columns") as HTMLElement | null;
  return columns?.style.columnCount ?? "";
}

function gameEntries(container: HTMLElement): number {
  return container.querySelectorAll(".entry:not(.head)").length;
}

test("PrintList normal flows three columns with the base headers only", () => {
  const { container } = render(
    <PrintList
      games={[makeGame({ titre: "A", rowIndex: 0 })]}
      summary=""
      density="normal"
    />,
  );
  expect(columnCount(container)).toBe("3");
  const labels = headerLabels(container);
  expect(labels).toContain("Titre");
  expect(labels).not.toContain("Age");
  expect(labels).not.toContain("Note");
});

test("PrintList rich uses a single column, adds Age and Note, an image placeholder and meta lines", () => {
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
  expect(columnCount(container)).toBe("1");
  const labels = headerLabels(container);
  expect(labels).toContain("Age");
  expect(labels).toContain("Note");
  expect(container.querySelectorAll(".thumb").length).toBeGreaterThan(0);
  expect(container.textContent).toContain("Cartes");
  expect(container.textContent).toContain("Draft");
  expect(container.textContent).toContain("Auteur X");
});

test("PrintList rich renders the cover as an img so it loads while the sheet is hidden", () => {
  const game = makeGame({
    titre: "A",
    rowIndex: 0,
    image: "https://img/example.jpg",
  });
  const { container } = render(
    <PrintList games={[game]} summary="" density="rich" />,
  );
  const image = container.querySelector(
    "img[data-print-image]",
  ) as HTMLImageElement | null;
  expect(image).not.toBeNull();
  expect(image?.getAttribute("src")).toBe("https://img/example.jpg");
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
  expect(columnCount(container)).toBe("3");
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
  expect(gameEntries(container)).toBe(0);
});
