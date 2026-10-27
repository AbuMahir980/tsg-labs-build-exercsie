import { McpServer } from "@modelcontextprotocol/server";

import { registerCheckInventory } from "./tools/check-inventory.js";
import { registerCreateReservation } from "./tools/create-reservation.js";
import { registerCreatePayment } from "./tools/create-payment.js";
import { registerVerifyPayment } from "./tools/verify-payment.js";
import { registerUpdateFulfilment } from "./tools/update-fulfilment.js";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "papahandmadeit-limited-drop",
    version: "1.0.0",
  });

  registerCheckInventory(server);
  registerCreateReservation(server);
  registerCreatePayment(server);
  registerVerifyPayment(server);
  registerUpdateFulfilment(server);

  return server;
}