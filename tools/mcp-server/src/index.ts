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

const serviceAccountJson =
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

const googleAuth = new google.auth.GoogleAuth({
  ...(serviceAccountJson
    ? { credentials: JSON.parse(serviceAccountJson) }
    : { keyFile: credentialsPath }),
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

  server.registerTool(
    "create_payment",
    {
      description:
        "Create a Paystack test payment for an active Papahandmadeit reservation.",
      inputSchema: z.object({
        reservation_id: z.string().min(1),
        customer_email: z.string().email(),
      }),
    },
    async ({ reservation_id, customer_email }) => {
      try {
        const reservationsResponse =
          await sheets.spreadsheets.values.get({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: "RESERVATIONS!A2:K",
            valueRenderOption: "UNFORMATTED_VALUE",
          });

        const rows = reservationsResponse.data.values ?? [];

        const rowIndex = rows.findIndex(
          (row) => String(row[0] ?? "") === reservation_id
        );

        if (rowIndex === -1) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                reason: "RESERVATION_NOT_FOUND",
              }),
            }],
          };
        }

        const row = rows[rowIndex];
        const status = String(row[4] ?? "");
        const expectedAmountNgn = Number(row[3] ?? 0);

        if (status !== "PAYMENT_PENDING") {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                reason: "RESERVATION_NOT_ACTIVE",
              }),
            }],
          };
        }

        const paystackResponse = await fetch(
          "https://api.paystack.co/transaction/initialize",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: customer_email,
              amount: expectedAmountNgn * 100,
              metadata: {
                reservation_id,
              },
            }),
          }
        );

        const paystackData = await paystackResponse.json();

        if (!paystackResponse.ok || !paystackData.status) {
          throw new Error(
            paystackData.message ?? "Unable to initialize Paystack payment"
          );
        }

        const paymentReference = paystackData.data.reference;
        const paymentUrl = paystackData.data.authorization_url;
        const reservationRow = rowIndex + 2;

        await sheets.spreadsheets.values.update({
          spreadsheetId: GOOGLE_SHEET_ID,
          range: `RESERVATIONS!F${reservationRow}:G${reservationRow}`,
          valueInputOption: "RAW",
          requestBody: {
            values: [[paymentReference, "PENDING"]],
          },
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              reservation_id,
              payment_reference: paymentReference,
              payment_url: paymentUrl,
              amount_ngn: expectedAmountNgn,
              payment_status: "PENDING",
            }),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              reason: "TOOL_ERROR",
              error:
                error instanceof Error
                  ? error.message
                  : "Unable to create payment",
            }),
          }],
        };
      }
    }
  );

  server.registerTool(
    "verify_payment",
    {
      description:
        "Verify the stored Paystack payment for a Papahandmadeit reservation.",
      inputSchema: z.object({
        reservation_id: z.string().min(1),
      }),
    },
    async ({ reservation_id }) => {
      try {
        const reservationsResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: GOOGLE_SHEET_ID,
          range: "RESERVATIONS!A2:K",
          valueRenderOption: "UNFORMATTED_VALUE",
        });

        const rows = reservationsResponse.data.values ?? [];
        const rowIndex = rows.findIndex(
          (row) => String(row[0] ?? "") === reservation_id
        );

        if (rowIndex === -1) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                reason: "RESERVATION_NOT_FOUND",
              }),
            }],
          };
        }

        const row = rows[rowIndex];
        const sku = String(row[1] ?? "");
        const quantity = Number(row[2] ?? 0);
        const expectedAmountNgn = Number(row[3] ?? 0);
        const reservationStatus = String(row[4] ?? "");
        const paymentReference = String(row[5] ?? "");
        const paymentStatus = String(row[6] ?? "");

        // Idempotency: do not update inventory twice.
        if (
          reservationStatus === "PAID" &&
          paymentStatus === "SUCCESS"
        ) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                verified: true,
                reservation_id,
                payment_reference: paymentReference,
                payment_status: "SUCCESS",
                amount_ngn: expectedAmountNgn,
              }),
            }],
          };
        }

        if (!paymentReference) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                reason: "NO_PAYMENT_REFERENCE",
              }),
            }],
          };
        }

        const response = await fetch(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(paymentReference)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok || !data.status) {
          throw new Error(data.message ?? "Unable to verify Paystack payment");
        }

        const transaction = data.data;
        const rawStatus = String(transaction.status ?? "").toLowerCase();

        if (rawStatus !== "success") {
          let normalizedStatus = "PENDING";

          if (rawStatus === "failed") normalizedStatus = "FAILED";
          if (rawStatus === "expired") normalizedStatus = "EXPIRED";
          if (rawStatus === "abandoned" || rawStatus === "cancelled") {
            normalizedStatus = "CANCELLED";
          }

          await sheets.spreadsheets.values.update({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: `RESERVATIONS!G${rowIndex + 2}`,
            valueInputOption: "RAW",
            requestBody: {
              values: [[normalizedStatus]],
            },
          });

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                verified: false,
                payment_status: normalizedStatus,
              }),
            }],
          };
        }

        if (String(transaction.reference) !== paymentReference) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                verified: false,
                reason: "REFERENCE_MISMATCH",
              }),
            }],
          };
        }

        if (Number(transaction.amount) !== expectedAmountNgn * 100) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                verified: false,
                reason: "AMOUNT_MISMATCH",
              }),
            }],
          };
        }

        const metadataReservationId =
          transaction.metadata &&
          typeof transaction.metadata === "object"
            ? String(transaction.metadata.reservation_id ?? "")
            : "";

        if (metadataReservationId !== reservation_id) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                verified: false,
                reason: "RESERVATION_MISMATCH",
              }),
            }],
          };
        }

        const inventoryResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: GOOGLE_SHEET_ID,
          range: "INVENTORY!A2:H",
          valueRenderOption: "UNFORMATTED_VALUE",
        });

        const inventoryRows = inventoryResponse.data.values ?? [];

        const inventoryIndex = inventoryRows.findIndex(
          (inventoryRow) => String(inventoryRow[0] ?? "") === sku
        );

        if (inventoryIndex === -1) {
          throw new Error("Inventory item not found");
        }

        const inventoryRow = inventoryRows[inventoryIndex];
        const reservedCount = Number(inventoryRow[5] ?? 0);
        const soldCount = Number(inventoryRow[6] ?? 0);

        const paidAt = new Date().toISOString();
        const reservationRow = rowIndex + 2;
        const inventorySheetRow = inventoryIndex + 2;

        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: GOOGLE_SHEET_ID,
          requestBody: {
            valueInputOption: "RAW",
            data: [
              {
                range: `INVENTORY!F${inventorySheetRow}:G${inventorySheetRow}`,
                values: [[
                  Math.max(0, reservedCount - quantity),
                  soldCount + quantity,
                ]],
              },
              {
                range: `RESERVATIONS!E${reservationRow}`,
                values: [["PAID"]],
              },
              {
                range: `RESERVATIONS!G${reservationRow}`,
                values: [["SUCCESS"]],
              },
              {
                range: `RESERVATIONS!K${reservationRow}`,
                values: [[paidAt]],
              },
            ],
          },
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              verified: true,
              reservation_id,
              payment_reference: paymentReference,
              payment_status: "SUCCESS",
              amount_ngn: expectedAmountNgn,
            }),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              reason: "TOOL_ERROR",
              error:
                error instanceof Error
                  ? error.message
                  : "Unable to verify payment",
            }),
          }],
        };
      }
    }
  );

  server.registerTool(
    "update_fulfilment",
    {
      description:
        "Save pickup or delivery preference for a paid Papahandmadeit reservation.",
      inputSchema: z.object({
        reservation_id: z.string().min(1),
        fulfilment_method: z.enum(["PICKUP", "DELIVERY"]),
        delivery_address: z.string().optional(),
      }),
    },
    async ({
      reservation_id,
      fulfilment_method,
      delivery_address,
    }) => {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: GOOGLE_SHEET_ID,
          range: "RESERVATIONS!A2:K",
          valueRenderOption: "UNFORMATTED_VALUE",
        });

        const rows = response.data.values ?? [];

        const rowIndex = rows.findIndex(
          (row) => String(row[0] ?? "") === reservation_id
        );

        if (rowIndex === -1) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                reason: "RESERVATION_NOT_FOUND",
              }),
            }],
          };
        }

        const status = String(rows[rowIndex][4] ?? "");

        if (status !== "PAID") {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                reason: "RESERVATION_NOT_PAID",
              }),
            }],
          };
        }

        if (
          fulfilment_method === "DELIVERY" &&
          !delivery_address?.trim()
        ) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                reason: "DELIVERY_ADDRESS_REQUIRED",
              }),
            }],
          };
        }

        const address =
          fulfilment_method === "DELIVERY"
            ? delivery_address!.trim()
            : "";

        await sheets.spreadsheets.values.update({
          spreadsheetId: GOOGLE_SHEET_ID,
          range: `RESERVATIONS!H${rowIndex + 2}:I${rowIndex + 2}`,
          valueInputOption: "RAW",
          requestBody: {
            values: [[fulfilment_method, address]],
          },
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              reservation_id,
              fulfilment_method,
              ...(address ? { delivery_address: address } : {}),
            }),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              reason: "TOOL_ERROR",
              error:
                error instanceof Error
                  ? error.message
                  : "Unable to update fulfilment",
            }),
          }],
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

const PORT = Number(process.env.PORT ?? 3000);
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const HOST = IS_PRODUCTION ? "0.0.0.0" : "127.0.0.1";

createHttpServer((req, res) => {
  if (!IS_PRODUCTION) {
    if (!validateHost(req, res) || !validateOrigin(req, res)) return;
  }

  if (IS_PRODUCTION) {
    const expectedToken = process.env.MCP_AUTH_TOKEN;

    if (
      !expectedToken ||
      req.headers.authorization !== `Bearer ${expectedToken}`
    ) {
      res.writeHead(401);
      res.end("Unauthorized");
      return;
    }

    // Server-to-server MCP calls normally have no Origin header.
    // Reject unexpected browser-origin requests.
    if (req.headers.origin) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
  }

  void nodeHandler(req, res);
}).listen(PORT, HOST, () => {
  console.log(
    `MCP server running on ${HOST}:${PORT}/mcp`
  );
});