import { parseDelimited } from "../myludo/readers";
import { MyludoImport } from "../myludo/types";

function toInt(value: string): number | null {
  if (value === "") {
    return null;
  }
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toRating(value: string): number | null {
  if (value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0
    ? Math.round(parsed * 10) / 10
    : null;
}

export function isBggCollection(header: string[]): boolean {
  const columns = new Set(header.map((column) => column.trim().toLowerCase()));
  return columns.has("objectid") && columns.has("objectname");
}

export function parseBggCollection(text: string): MyludoImport[] {
  const rows = parseDelimited(text.replace(/^\uFEFF/, ""), ";");
  if (rows.length < 2) {
    return [];
  }
  const header = rows[0].map((column) =>
    column.replace(/^['\uFEFF]+/, "").trim(),
  );
  const at = (name: string) => header.indexOf(name);
  const columns = {
    objectname: at("objectname"),
    objectid: at("objectid"),
    rating: at("rating"),
    average: at("average"),
    minplayers: at("minplayers"),
    maxplayers: at("maxplayers"),
    minplaytime: at("minplaytime"),
    maxplaytime: at("maxplaytime"),
    playingtime: at("playingtime"),
    yearpublished: at("yearpublished"),
    barcode: at("barcode"),
    acquisitiondate: at("acquisitiondate"),
    invlocation: at("invlocation"),
    own: at("own"),
  };
  const cell = (row: string[], index: number) =>
    index >= 0 ? (row[index] ?? "").trim() : "";

  return rows
    .slice(1)
    .filter((row) => row.some((value) => value.trim() !== ""))
    .filter((row) => columns.own < 0 || cell(row, columns.own) === "1")
    .map((row) => {
      const ean = cell(row, columns.barcode);
      const playtime = toInt(cell(row, columns.playingtime));
      return {
        myludoId: "",
        bggId: cell(row, columns.objectid),
        ean: ean ? [ean] : [],
        titre: cell(row, columns.objectname),
        sousTitre: "",
        edition: toInt(cell(row, columns.yearpublished)),
        joueursMin: toInt(cell(row, columns.minplayers)),
        joueursMax: toInt(cell(row, columns.maxplayers)),
        dureeMin: toInt(cell(row, columns.minplaytime)) ?? playtime,
        dureeMax: toInt(cell(row, columns.maxplaytime)) ?? playtime,
        age: null,
        categories: [],
        themes: [],
        mecanismes: [],
        editeur: [],
        auteurs: [],
        notePerso: toRating(cell(row, columns.rating)),
        noteMoyenne: toRating(cell(row, columns.average)),
        dateAcquisition: cell(row, columns.acquisitiondate),
        emplacement: cell(row, columns.invlocation),
      } satisfies MyludoImport;
    })
    .filter((game) => game.bggId !== "" || game.titre !== "");
}
