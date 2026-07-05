import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isEditorRequest } from "@/lib/session";
import { normalizeGame, gameToRow } from "@/lib/games";
import { appendGameRows, updateGameRows } from "@/lib/sheets";

type Operation = { rowIndex: number | null; fields: Record<string, unknown> };

export async function POST(request: Request) {
  if (!(await isEditorRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as { operations?: Operation[] };
  const operations = Array.isArray(body.operations) ? body.operations : [];

  const appends: (string | number)[][] = [];
  const updates: { rowIndex: number; values: (string | number)[] }[] = [];
  for (const operation of operations) {
    const row = gameToRow(normalizeGame(operation.fields));
    if (typeof operation.rowIndex === "number" && operation.rowIndex >= 2) {
      updates.push({ rowIndex: operation.rowIndex, values: row });
    } else {
      appends.push(row);
    }
  }

  await updateGameRows(updates);
  await appendGameRows(appends);
  revalidatePath("/");
  return NextResponse.json({
    ok: true,
    created: appends.length,
    updated: updates.length,
  });
}
