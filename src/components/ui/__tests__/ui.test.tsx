// @vitest-environment jsdom
import { test, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

afterEach(cleanup);
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { Chip } from "../Chip";
import { Field } from "../Field";
import { MetaItem } from "../MetaItem";
import { DetailRow } from "../DetailRow";

function DummyIcon({ className }: { className?: string }) {
  return <svg className={className} data-testid="icon" />;
}

test("Button: renders, fires onClick, reflects variant and disabled", () => {
  const onClick = vi.fn();
  const { rerender } = render(
    <Button variant="danger" onClick={onClick}>
      Supprimer
    </Button>,
  );
  const button = screen.getByRole("button", { name: "Supprimer" });
  expect(button.className).toContain("danger");
  fireEvent.click(button);
  expect(onClick).toHaveBeenCalledTimes(1);

  rerender(
    <Button onClick={onClick} disabled>
      Supprimer
    </Button>,
  );
  expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
});

test("IconButton: exposes an accessible label and fires onClick", () => {
  const onClick = vi.fn();
  render(
    <IconButton label="Imprimer" onClick={onClick}>
      <DummyIcon />
    </IconButton>,
  );
  const button = screen.getByRole("button", { name: "Imprimer" });
  expect(button.getAttribute("title")).toBe("Imprimer");
  fireEvent.click(button);
  expect(onClick).toHaveBeenCalledTimes(1);
});

test("Chip: toggles active class and fires onClick", () => {
  const onClick = vi.fn();
  const { rerender } = render(
    <Chip active={false} onClick={onClick}>
      Tous
    </Chip>,
  );
  expect(screen.getByRole("button").className).toContain("chip");
  fireEvent.click(screen.getByRole("button"));
  expect(onClick).toHaveBeenCalledTimes(1);

  rerender(
    <Chip active onClick={onClick}>
      Tous
    </Chip>,
  );
  expect(screen.getByRole("button").className).toContain("active");
});

test("Field: renders label, icon, hint and children", () => {
  render(
    <Field label="Categories" Icon={DummyIcon} hint="separees par ;">
      <input aria-label="cat" />
    </Field>,
  );
  expect(screen.getByText("Categories")).toBeTruthy();
  expect(screen.getByText("separees par ;")).toBeTruthy();
  expect(screen.getByTestId("icon")).toBeTruthy();
  expect(screen.getByLabelText("cat")).toBeTruthy();
});

test("MetaItem: renders icon, value and label", () => {
  render(<MetaItem Icon={DummyIcon} value="2-6" label="joueurs" />);
  expect(screen.getByTestId("icon")).toBeTruthy();
  expect(screen.getByText("2-6")).toBeTruthy();
  expect(screen.getByText("joueurs")).toBeTruthy();
});

test("DetailRow: renders label and value", () => {
  render(<DetailRow label="Themes" value="Fantastique" />);
  expect(screen.getByText("Themes")).toBeTruthy();
  expect(screen.getByText("Fantastique")).toBeTruthy();
});
