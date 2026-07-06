import { GoogleAuth } from "google-auth-library";

const READONLY_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const SHEET_NAME = "Jeux";

function createAuth() {
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (privateKey) {
    return new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: privateKey.replace(/\\n/g, "\n"),
      },
      scopes: [READONLY_SCOPE],
    });
  }
  return new GoogleAuth({ scopes: [READONLY_SCOPE] });
}

// Reused across warm invocations so the access token is cached, not re-signed.
let auth: ReturnType<typeof createAuth> | null = null;

function getSpreadsheetId(): string {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not set");
  }
  return spreadsheetId;
}

export async function readSheetRows(): Promise<string[][]> {
  auth = auth ?? createAuth();
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  if (!token) {
    throw new Error("Impossible d'obtenir un jeton d'acces Google.");
  }
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${getSpreadsheetId()}` +
    `/values/${encodeURIComponent(SHEET_NAME)}` +
    `?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    throw new Error(`Lecture Google Sheets echouee (${res.status}).`);
  }
  const data = (await res.json()) as { values?: unknown[][] };
  const values = data.values ?? [];
  return values.map((row) =>
    row.map((cell) => (cell == null ? "" : String(cell))),
  );
}
