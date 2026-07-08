import { parseGeekItem, parseRating, BggGame } from "./map";

const BASE = "https://api.geekdo.com/api";
const TIMEOUT_MS = 15000;

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`BGG request failed (${response.status})`);
  }
  return response.json();
}

export async function getGameById(id: string): Promise<BggGame | null> {
  const clean = id.trim();
  if (clean === "") {
    return null;
  }
  const query = `objecttype=thing&objectid=${encodeURIComponent(clean)}`;
  const [item, dynamic] = await Promise.all([
    fetchJson(`${BASE}/geekitems?${query}`),
    fetchJson(`${BASE}/dynamicinfo?${query}`).catch(() => null),
  ]);
  const game = parseGeekItem(item);
  if (game) {
    game.noteMoyenne = parseRating(dynamic);
  }
  return game;
}
