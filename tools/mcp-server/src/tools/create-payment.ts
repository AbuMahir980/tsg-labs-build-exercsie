import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod";

import { sheets } from "../config/google.js";
import {
  GOOGLE_SHEET_ID,
  PAYSTACK_SECRET_KEY,
} from "../config/env.js";

export function registerCreatePayment(
  server: McpServer
) { 
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
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
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
}