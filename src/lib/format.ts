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
