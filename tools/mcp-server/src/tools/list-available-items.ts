import type { McpServer } from "@modelcontextprotocol/server";
import { sheets } from "../config/google.js";
import { GOOGLE_SHEET_ID } from "../config/env.js";

export function registerListAvailableItems(server: McpServer) {
  server.registerTool(
    "list_available_items",
    {
      description:
        "List all Papahandmadeit limited-drop items that are currently available.",
    },
    async () => {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: GOOGLE_SHEET_ID,
          range: "INVENTORY!A2:H",
          valueRenderOption: "UNFORMATTED_VALUE",
        });

        const rows = response.data.values ?? [];

        const availableItems = rows
          .filter((row) => Number(row[7] ?? 0) > 0)
          .map((row) => ({
            product_name: row[1],
            variant: row[2],
            price_ngn: Number(row[3] ?? 0),
            available_count: Number(row[7] ?? 0),
          }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                items: availableItems,
                count: availableItems.length,
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
                    : "Unable to list available items",
              }),
            },
          ],
        };
      }
    }
  );
}