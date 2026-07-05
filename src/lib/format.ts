export type RatingLevel = "high" | "mid" | "low";

export function hueFromString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) % 360;
  }
  return hash;
}

export function ratingLevel(note: number | null): RatingLevel | null {
  if (note === null) {
    return null;
  }
  if (note >= 7.5) {
    return "high";
  }
  if (note >= 6) {
    return "mid";
  }
  return "low";
}

export function formatRange(min: number | null, max: number | null): string {
  if (min === null && max === null) {
    return "";
  }
  if (min === null) {
    return String(max);
  }
  if (max === null) {
    return `${min}+`;
  }
  if (min === max) {
    return String(min);
  }
  return `${min}-${max}`;
}
