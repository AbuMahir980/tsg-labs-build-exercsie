import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod";


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
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              received_query: item_query,
            }),
          },
        ],
      };
    }
  );

  return server;
}

const server = createServer();
console.log("MCP server created successfully.")