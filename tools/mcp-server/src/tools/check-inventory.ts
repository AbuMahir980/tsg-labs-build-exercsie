import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod";

import { sheets } from "../config/google.js";
import { GOOGLE_SHEET_ID } from "../config/env.js";

export function registerCheckInventory(
  server: McpServer
) {
  server.registerTool(
    "check_inventory",
    {
      description:
        "Check availability of a Papahandmadeit limited-drop item.",
      inputSchema: z.object({
        item_query: z.string().min(1),
      }),
    },
    async ({ item_query }) => {
      try {
        const response =
          await sheets.spreadsheets.values.get({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: "INVENTORY!A2:H",
            valueRenderOption: "UNFORMATTED_VALUE",
          });

        const rows = response.data.values ?? [];
        const query = item_query.trim().toLowerCase();

        const match = rows.find((row) => {
          const sku = String(row[0] ?? "").trim().toLowerCase();
          const productName = String(row[1] ?? "").trim().toLowerCase();
          const variant = String(row[2] ?? "").trim().toLowerCase();

          const searchableItem = `${productName} ${variant}`.trim();

          return (
            sku === query ||
            query.includes(sku) ||
            productName === query ||
            productName.includes(query) ||
            query.includes(productName) ||
            searchableItem.includes(query) ||
            query.includes(searchableItem)
          );
        });

        if (!match) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                found: false,
              }),
            }],
          };
        }

        return {
          content: [{
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
                  : "Unable to check inventory",
            }),
          }],
        };
      }
    }
  );
}