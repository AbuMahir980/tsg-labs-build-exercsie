import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod";
import { localhostHostValidation, localhostOriginValidation, toNodeHandler, } from "@modelcontextprotocol/node";
import { createServer as createHttpServer } from "node:http";
import dotenv from "dotenv";
import { google } from "googleapis";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

dotenv.config({
  path: fileURLToPath(new URL("../../../.env", import.meta.url)),
});

const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;

if (!GOOGLE_SHEET_ID) {
  throw new Error("GOOGLE_SHEET_ID is missing");
}

const credentialsPath = fileURLToPath(
  new URL("../credentials/google-service-account.json", import.meta.url)
);

const googleAuth = new google.auth.GoogleAuth({
  keyFile: credentialsPath,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({
  version: "v4",
  auth: googleAuth,
});

function createServer(): McpServer {

  const server = new McpServer({
    name: "papahandmadeit-limited-drop",
    version: "1.0.0",
  });

  server.registerTool(
    "check_inventory",
    {
      description: "Check current Papahandmadeit inventory for a product name, SKU, or customer description.",
      inputSchema: z.object({
        item_query: z
          .string()
          .min(1, "Item query must be at least 1 character long.")
        .describe("Product name, SKU, or clear customer description")
      }),
    },
    async ({ item_query }) => {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: GOOGLE_SHEET_ID,
          range: "INVENTORY!A2:H",
          valueRenderOption: "UNFORMATTED_VALUE",
        });

        const rows = response.data.values ?? [];

        const query = item_query.trim().toLowerCase();

        const match = rows.find((row) => {
          const sku = String(row[0] ?? "").toLowerCase();
          const productName = String(row[1] ?? "").toLowerCase();
          const variant = String(row[2] ?? "").toLowerCase();

          return (
            sku === query ||
            productName === query ||
            sku.includes(query) ||
            productName.includes(query) ||
            variant.includes(query)
          );
        });

        if (!match) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  found: false,
                }),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                found: true,
                sku: match[0],
                product_name: match[1],
                variant: match[2],
                price_ngn: match[3],
                available_count: match[7],
              }),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Unable to read inventory",
              }),
            },
          ],
        };
      }
    }
  );

  server.registerTool(
    "create_reservation",
    {
      description:
        "Create a reservation for an available Papahandmadeit item after customer confirmation.",
      inputSchema: z.object({
        sku: z.string().min(1),
        quantity: z.number().int().positive().default(1),
      }),
    },
    async ({ sku, quantity }) => {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: GOOGLE_SHEET_ID,
          range: "INVENTORY!A2:H",
          valueRenderOption: "UNFORMATTED_VALUE",
        });

        const rows = response.data.values ?? [];
        const normalizedSku = sku.trim().toLowerCase();

        const rowIndex = rows.findIndex(
          (row) =>
            String(row[0] ?? "").trim().toLowerCase() === normalizedSku
        );

        if (rowIndex === -1) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  reason: "PRODUCT_NOT_FOUND",
                }),
              },
            ],
          };
        }

        const row = rows[rowIndex];

        const priceNgn = Number(row[3] ?? 0);
        const reservedCount = Number(row[5] ?? 0);
        const availableCount = Number(row[7] ?? 0);

        if (availableCount < quantity) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  reason: "OUT_OF_STOCK",
                }),
              },
            ],
          };
        }

        const reservationId = `RES-${randomUUID()
          .slice(0, 8)
          .toUpperCase()}`;

        const expectedAmountNgn = priceNgn * quantity;
        const inventoryRow = rowIndex + 2;
        const createdAt = new Date().toISOString();

        await sheets.spreadsheets.values.update({
          spreadsheetId: GOOGLE_SHEET_ID,
          range: `INVENTORY!F${inventoryRow}`,
          valueInputOption: "RAW",
          requestBody: {
            values: [[reservedCount + quantity]],
          },
        });

        try {
          await sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: "RESERVATIONS!A:K",
            valueInputOption: "RAW",
            insertDataOption: "INSERT_ROWS",
            requestBody: {
              values: [
                [
                  reservationId,
                  row[0],
                  quantity,
                  expectedAmountNgn,
                  "PAYMENT_PENDING",
                  "",
                  "",
                  "",
                  "",
                  createdAt,
                  "",
                ],
              ],
            },
          });
        } catch (error) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: `INVENTORY!F${inventoryRow}`,
            valueInputOption: "RAW",
            requestBody: {
              values: [[reservedCount]],
            },
          });

          throw error;
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                reservation_id: reservationId,
                sku: row[0],
                quantity,
                expected_amount_ngn: expectedAmountNgn,
                status: "PAYMENT_PENDING",
              }),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                reason: "TOOL_ERROR",
                error:
                  error instanceof Error
                    ? error.message
                    : "Unable to create reservation",
              }),
            },
          ],
        };
      }
    }
  );

  

  return server;
};

const handler = createMcpHandler(createServer);
const nodeHandler = toNodeHandler(handler);

const validateHost = localhostHostValidation();
const validateOrigin = localhostOriginValidation();

const PORT = 3000;

createHttpServer((req, res) => {
  if (!validateHost(req, res) || !validateOrigin(req, res)) return;

  void nodeHandler(req, res);
}).listen(PORT, "127.0.0.1", () => {
  console.log(`MCP server running at http://127.0.0.1:${PORT}/mcp`);
});