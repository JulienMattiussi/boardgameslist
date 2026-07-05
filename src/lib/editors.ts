export function parseAllowlist(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email !== "");
}

export function isEditor(
  email: string | null | undefined,
  allowlist: string[]
): boolean {
  if (!email) {
    return false;
  }
  return allowlist.includes(email.toLowerCase());
}
