import { google, sheets_v4, drive_v3 } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
];

export interface GoogleServices {
  sheets: sheets_v4.Sheets;
  drive: drive_v3.Drive;
  folderId?: string;
}

/**
 * Get Google API credentials from environment variables.
 * Supports multiple authentication methods:
 * 1. CREDENTIALS_CONFIG: Base64 encoded service account JSON
 * 2. GOOGLE_SERVICE_ACCOUNT_KEY: Direct JSON string of service account credentials
 * 3. Individual environment variables for service account fields
 */
function getCredentials(): { type: string; [key: string]: unknown } | null {
  // Method 1: Base64 encoded credentials
  const credentialsConfig = process.env.CREDENTIALS_CONFIG;
  if (credentialsConfig) {
    try {
      const decoded = Buffer.from(credentialsConfig, "base64").toString(
        "utf-8"
      );
      return JSON.parse(decoded);
    } catch {
      console.error("Failed to decode CREDENTIALS_CONFIG");
    }
  }

  // Method 2: Direct JSON string
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    try {
      return JSON.parse(serviceAccountKey);
    } catch {
      console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY");
    }
  }

  // Method 3: Individual environment variables
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const projectId = process.env.GOOGLE_PROJECT_ID;

  if (clientEmail && privateKey) {
    return {
      type: "service_account",
      project_id: projectId || "",
      private_key: privateKey.replace(/\\n/g, "\n"),
      client_email: clientEmail,
    };
  }

  return null;
}

/**
 * Initialize Google API services with authentication.
 */
export async function getGoogleServices(): Promise<GoogleServices> {
  const credentials = getCredentials();

  if (!credentials) {
    throw new Error(
      "No Google credentials found. Please set CREDENTIALS_CONFIG, " +
        "GOOGLE_SERVICE_ACCOUNT_KEY, or GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY environment variables."
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: "v4", auth });
  const drive = google.drive({ version: "v3", auth });
  const folderId = process.env.DRIVE_FOLDER_ID || undefined;

  return { sheets, drive, folderId };
}

