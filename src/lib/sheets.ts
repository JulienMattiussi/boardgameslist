import { google } from "googleapis";

const READWRITE_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const SHEET_NAME = "Jeux";
const SHEET_ID = 0;
const LAST_COLUMN = "W";

type CellValue = string | number;

function getAuth(
  scopes: string[],
): InstanceType<typeof google.auth.GoogleAuth> {
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (privateKey) {
    return new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: privateKey.replace(/\\n/g, "\n"),
      },
      scopes,
    });
  }
  // Local dev falls back to the key file pointed to by GOOGLE_APPLICATION_CREDENTIALS.
  return new google.auth.GoogleAuth({ scopes });
}

function getSpreadsheetId(): string {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not set");
  }
  return spreadsheetId;
}

export async function appendGameRows(rows: CellValue[][]): Promise<void> {
  if (rows.length === 0) {
    return;
  }
  const sheets = google.sheets({
    version: "v4",
    auth: getAuth([READWRITE_SCOPE]),
  });
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: SHEET_NAME,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: rows },
  });
}

export async function updateGameRows(
  updates: { rowIndex: number; values: CellValue[] }[],
): Promise<void> {
  if (updates.length === 0) {
    return;
  }
  const sheets = google.sheets({
    version: "v4",
    auth: getAuth([READWRITE_SCOPE]),
  });
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: {
      valueInputOption: "RAW",
      data: updates.map(({ rowIndex, values }) => ({
        range: `${SHEET_NAME}!A${rowIndex}:${LAST_COLUMN}${rowIndex}`,
        values: [values],
      })),
    },
  });
}

export async function appendGameRow(values: CellValue[]): Promise<void> {
  await appendGameRows([values]);
}

export async function updateGameRow(
  rowIndex: number,
  values: CellValue[],
): Promise<void> {
  await updateGameRows([{ rowIndex, values }]);
}

export async function deleteGameRow(rowIndex: number): Promise<void> {
  const sheets = google.sheets({
    version: "v4",
    auth: getAuth([READWRITE_SCOPE]),
  });
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: SHEET_ID,
              dimension: "ROWS",
              startIndex: rowIndex - 1,
              endIndex: rowIndex,
            },
          },
        },
      ],
    },
  });
}
