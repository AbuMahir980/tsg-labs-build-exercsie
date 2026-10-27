import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod";
import { localhostHostValidation, localhostOriginValidation, toNodeHandler, } from "@modelcontextprotocol/node";
import { createServer as createHttpServer } from "node:http";

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