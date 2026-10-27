import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod";
import { randomUUID } from "node:crypto";

import { sheets } from "../config/google.js";
import { GOOGLE_SHEET_ID } from "../config/env.js";

export function registerCreateReservation(
  server: McpServer
) {
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
}