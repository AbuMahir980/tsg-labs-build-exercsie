import {
  createMcpHandler,
} from "@modelcontextprotocol/server";

import {
  localhostHostValidation,
  localhostOriginValidation,
  toNodeHandler,
} from "@modelcontextprotocol/node";

import {
  createServer as createHttpServer,
} from "node:http";

import { createMcpServer } from "./server.js";

import {
  HOST,
  PORT,
  IS_PRODUCTION,
  MCP_AUTH_TOKEN,
} from "./config/env.js";

const handler = createMcpHandler(createMcpServer);
const nodeHandler = toNodeHandler(handler);

const validateHost = localhostHostValidation();
const validateOrigin = localhostOriginValidation();

createHttpServer((req, res) => {
  if (!IS_PRODUCTION) {
    if (
      !validateHost(req, res) ||
      !validateOrigin(req, res)
    ) {
      return;
    }
  }

  if (IS_PRODUCTION) {
    if (
      !MCP_AUTH_TOKEN ||
      req.headers.authorization !==
        `Bearer ${MCP_AUTH_TOKEN}`
    ) {
      res.writeHead(401);
      res.end("Unauthorized");
      return;
    }

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