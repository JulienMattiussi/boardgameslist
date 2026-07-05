import { MyludoImport, MyludoFormat, MyludoRaw } from "./types";
import { readJson, readCsv } from "./readers";
import { readXlsx } from "./readXlsx";
import { rawToImport } from "./normalize";

export function formatFromName(filename: string): MyludoFormat | null {
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "json" || ext === "csv" || ext === "xlsx") {
    return ext;
  }
  return null;
}

function readRaws(format: MyludoFormat, bytes: Uint8Array): MyludoRaw[] {
  if (format === "xlsx") {
    return readXlsx(bytes);
  }
  const text = new TextDecoder("utf-8").decode(bytes);
  return format === "json" ? readJson(text) : readCsv(text);
}

export function parseMyludo(
  format: MyludoFormat,
  bytes: Uint8Array,
): MyludoImport[] {
  const raws = readRaws(format, bytes);
  if (raws.length === 0) {
    throw new Error("Aucun jeu trouve dans le fichier.");
  }
  // Require only the three stable Myludo columns so any other added or dropped
  // column is tolerated; EAN is the reliable, game-bound identifier.
  const header = raws[0];
  const missing = ["ID", "EAN", "Titre"].filter(
    (column) => !(column in header),
  );
  if (missing.length > 0) {
    throw new Error(
      `Ce fichier ne ressemble pas a un export Myludo (colonnes manquantes : ${missing.join(", ")}).`,
    );
  }
  return raws.map(rawToImport);
}
