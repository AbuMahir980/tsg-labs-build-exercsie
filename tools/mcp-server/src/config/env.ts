import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({
  path: fileURLToPath(
    new URL("../../../../.env", import.meta.url)
  ),
});

export const GOOGLE_SHEET_ID =
  process.env.GOOGLE_SHEET_ID;

export const PAYSTACK_SECRET_KEY =
  process.env.PAYSTACK_SECRET_KEY;

export const GOOGLE_SERVICE_ACCOUNT_JSON =
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

export const PORT = Number(process.env.PORT ?? 3000);

export const IS_PRODUCTION =
  process.env.NODE_ENV === "production";

export const HOST = IS_PRODUCTION
  ? "0.0.0.0"
  : "127.0.0.1";

export const MCP_AUTH_TOKEN =
  process.env.MCP_AUTH_TOKEN;

if (!GOOGLE_SHEET_ID) {
  throw new Error("GOOGLE_SHEET_ID is missing");
}

if (!PAYSTACK_SECRET_KEY) {
  throw new Error("PAYSTACK_SECRET_KEY is missing");
}