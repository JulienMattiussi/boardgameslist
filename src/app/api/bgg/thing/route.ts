import { NextResponse } from "next/server";
import { isEditorRequest } from "@/lib/session";
import { getGameById } from "@/lib/bgg/client";
import { parseBggId } from "@/lib/bgg/map";

export const maxDuration = 30;

export async function GET(request: Request) {
  if (!(await isEditorRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = parseBggId(new URL(request.url).searchParams.get("id") ?? "");
  if (id === "") {
    return NextResponse.json({ error: "id BGG invalide" }, { status: 400 });
  }
  try {
    const game = await getGameById(id);
    if (!game) {
      return NextResponse.json({ error: "Jeu introuvable" }, { status: 404 });
    }
    return NextResponse.json({ game });
  } catch {
    return NextResponse.json({ error: "BGG indisponible" }, { status: 502 });
  }
}
