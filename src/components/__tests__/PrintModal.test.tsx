// @vitest-environment jsdom
import { test, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Game } from "@/lib/games";
import { PrintModal } from "../PrintModal";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

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

const shortTitles = Array.from({ length: 60 }, (_, i) =>
  makeGame({ titre: "abc", rowIndex: i, joueursMin: 2, joueursMax: 4 }),
);

function firstPreviewColumnCount(container: HTMLElement): string {
  const columns = container.querySelector(".pageColumns") as HTMLElement | null;
  return columns?.style.columnCount ?? "";
}

test("PrintModal preview flows three columns and reacts to compact density", () => {
  const { container } = render(
    <PrintModal
      games={shortTitles}
      summary=""
      onClose={vi.fn()}
      onPrint={vi.fn()}
    />,
  );

  expect(screen.getByText(/Apercu/)).toBeTruthy();
  expect(firstPreviewColumnCount(container)).toBe("3");
  expect(container.querySelectorAll(".pageColumnsCompact").length).toBe(0);

  fireEvent.click(screen.getByText("Compacte"));

  expect(container.querySelectorAll(".pageColumnsCompact").length).toBe(1);
  expect(firstPreviewColumnCount(container)).toBe("3");

  fireEvent.click(screen.getByText("Riche"));

  expect(firstPreviewColumnCount(container)).toBe("1");
});

test("PrintModal remembers options across mounts", () => {
  const first = render(
    <PrintModal
      games={shortTitles}
      summary=""
      onClose={vi.fn()}
      onPrint={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByText("Compacte"));
  first.unmount();

  const { container } = render(
    <PrintModal
      games={shortTitles}
      summary=""
      onClose={vi.fn()}
      onPrint={vi.fn()}
    />,
  );
  expect(container.querySelectorAll(".pageColumnsCompact").length).toBe(1);
});

test("PrintModal disables printing when there is nothing to print", () => {
  const onPrint = vi.fn();
  render(
    <PrintModal games={[]} summary="" onClose={vi.fn()} onPrint={onPrint} />,
  );

  expect(screen.getByText("Aucun jeu a imprimer.")).toBeTruthy();
  const button = screen.getByRole("button", { name: "Imprimer" });
  expect(button).toHaveProperty("disabled", true);

  fireEvent.click(button);
  expect(onPrint).not.toHaveBeenCalled();
});

test("PrintModal print button forwards the full config", () => {
  const onPrint = vi.fn();
  render(
    <PrintModal
      games={shortTitles}
      summary=""
      onClose={vi.fn()}
      onPrint={onPrint}
    />,
  );

  fireEvent.click(screen.getByText("Par nombre de joueurs"));
  fireEvent.click(screen.getByRole("button", { name: "Imprimer" }));

  expect(onPrint).toHaveBeenCalledWith({
    density: "normal",
    splitByType: false,
    splitByCategory: false,
    splitByTheme: false,
    splitByMechanic: false,
    splitByDuration: false,
    splitByPlayers: true,
    solo: "all",
  });
});
