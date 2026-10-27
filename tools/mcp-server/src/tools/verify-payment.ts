import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod";

import { sheets } from "../config/google.js";
import {
  GOOGLE_SHEET_ID,
  PAYSTACK_SECRET_KEY,
} from "../config/env.js";

export function registerVerifyPayment(
  server: McpServer
) { 
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
              Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
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
}