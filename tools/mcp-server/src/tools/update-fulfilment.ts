import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod";

import { sheets } from "../config/google.js";
import { GOOGLE_SHEET_ID } from "../config/env.js";

export function registerUpdateFulfilment(
  server: McpServer
) { 
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
}