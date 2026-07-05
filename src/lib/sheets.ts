import { google } from "googleapis";

const READONLY_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const SHEET_NAME = "Jeux";

function getAuth(): InstanceType<typeof google.auth.GoogleAuth> {
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (privateKey) {
    return new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: privateKey.replace(/\\n/g, "\n"),
      },
      scopes: [READONLY_SCOPE],
    });
  }
  // Local dev falls back to the key file pointed to by GOOGLE_APPLICATION_CREDENTIALS.
  return new google.auth.GoogleAuth({ scopes: [READONLY_SCOPE] });
}

export async function readSheetRows(): Promise<string[][]> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not set");
  }
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: SHEET_NAME,
    // Typed cells: numbers come back as numbers (locale-proof), dates as ISO strings.
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
  });
  const values = res.data.values ?? [];
  return values.map((row) => row.map((cell) => (cell == null ? "" : String(cell))));
}
