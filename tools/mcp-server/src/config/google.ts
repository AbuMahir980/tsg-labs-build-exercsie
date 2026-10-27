import { google } from "googleapis";
import { fileURLToPath } from "node:url";

import {
  GOOGLE_SERVICE_ACCOUNT_JSON,
} from "./env.js";

const credentialsPath = fileURLToPath(
  new URL(
    "../../credentials/google-service-account.json",
    import.meta.url
  )
);

const googleAuth = new google.auth.GoogleAuth({
  ...(GOOGLE_SERVICE_ACCOUNT_JSON
    ? {
        credentials: JSON.parse(
          GOOGLE_SERVICE_ACCOUNT_JSON
        ),
      }
    : {
        keyFile: credentialsPath,
      }),
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
  ],
});

export const sheets = google.sheets({
  version: "v4",
  auth: googleAuth,
});