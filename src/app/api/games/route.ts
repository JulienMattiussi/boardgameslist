import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isEditorRequest } from "@/lib/session";
import { normalizeGame, gameToRow } from "@/lib/games";
import { appendGameRow, updateGameRow, deleteGameRow } from "@/lib/sheets";

export async function POST(request: Request) {
  if (!(await isEditorRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as Record<string, unknown>;
  const game = normalizeGame(body);
  if (game.titre === "") {
    return NextResponse.json({ error: "Titre requis" }, { status: 400 });
  }
  await appendGameRow(gameToRow(game));
  revalidatePath("/");
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function PUT(request: Request) {
  if (!(await isEditorRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as Record<string, unknown>;
  const game = normalizeGame(body);
  if (game.rowIndex < 2) {
    return NextResponse.json({ error: "rowIndex invalide" }, { status: 400 });
  }
  if (game.titre === "") {
    return NextResponse.json({ error: "Titre requis" }, { status: 400 });
  }
  await updateGameRow(game.rowIndex, gameToRow(game));
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!(await isEditorRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as { rowIndex?: unknown };
  const rowIndex = typeof body.rowIndex === "number" ? body.rowIndex : 0;
  if (rowIndex < 2) {
    return NextResponse.json({ error: "rowIndex invalide" }, { status: 400 });
  }
  await deleteGameRow(rowIndex);
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
