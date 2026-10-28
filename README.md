# Papahandmadeit Limited Drop Assistant

A Chord AI teammate that helps Papahandmadeit handle limited-drop sales through a WhatsApp-style conversation.

Built for the **TSG Labs Build Exercise**.

**Role preference:** Forward-Deployed Engineering

## Problem

Papahandmadeit is an African fashion and visual-art brand that sells handmade clothing inspired by African culture and aesthetics.

Some products are released in limited quantities and promoted through WhatsApp Status. During a drop, customers can message at the same time, and delayed replies can mean that a customer misses an item or that the business has to manually check stock, reserve products and confirm payments.

I built a Chord teammate that handles one limited-drop purchase flow from start to finish. It can check live inventory, reserve an available item, create a Paystack test payment, verify the payment and record whether the customer wants pickup or delivery.

I deliberately left out a full e-commerce website, live WhatsApp Business integration, delivery tracking and production payment credentials. The goal was to build a small end-to-end workflow that works reliably before expanding the scope.

## How It Works

The flow is:

Customer  
→ WhatsApp Simulator  
→ Chord teammate  
→ Papahandmadeit Skill  
→ Custom MCP server  
→ Google Sheets / Paystack

The Google Sheet acts as the inventory and reservation store for the demo.

Paystack is used only in **test mode**.

## Customer Flow

A typical conversation works like this:

1. Customer asks if an item is available.
2. The agent checks the live inventory.
3. Customer agrees to reserve an item.
4. The agent checks inventory again before creating the reservation.
5. A reservation is created and the available quantity is updated.
6. The agent asks for an email address if needed for payment.
7. A Paystack test payment is created for the amount stored against the reservation.
8. Customer completes the payment.
9. Customer tells the agent they have paid.
10. The agent independently verifies the payment with Paystack.
11. Only a successful payment with the correct amount and reservation reference is accepted.
12. The customer chooses pickup or delivery.
13. The fulfilment preference is saved against the reservation.

The agent does not treat a customer's message saying “I have paid” as proof of payment.

## Custom Tools

The MCP server exposes the following tools to Chord.

### `check_inventory`

Checks the Google Sheet for one specific product and returns its current availability, variant and price.

### `list_available_items`

Returns the limited-drop products that currently have stock available.

### `create_reservation`

Rechecks the selected item, creates a reservation and updates the reserved quantity in the inventory.

### `create_payment`

Creates a Paystack test transaction using the amount stored against the reservation and saves the resulting payment reference.

### `verify_payment`

Verifies the stored payment reference directly with Paystack.

It checks that:

- Paystack reports the payment as successful;
- the payment belongs to the reservation;
- the amount received matches the expected amount.

Only then is the reservation treated as paid.

### `update_fulfilment`

Records either `PICKUP` or `DELIVERY` after payment has been successfully verified.

For delivery, the customer's supplied address is also stored.

## Repository Structure

```text
.
├── README.md
├── FIELD_NOTES.md
├── docs/
├── skills/
│   └── papahandmadeit-limited-drop/
│       └── SKILL.md
└── tools/
    └── mcp-server/
        ├── src/
        │   ├── config/
        │   ├── tools/
        │   ├── index.ts
        │   └── server.ts
        ├── package.json
        └── package-lock.json
```

The Skill contains the business context, workflow rules, tool-use rules, payment rules and customer conversation behaviour.

The MCP server contains the integrations used by the Skill.

## Running the MCP Server Locally

From the repository:

```bash
cd tools/mcp-server
npm install
npm start
```

The server exposes a Streamable HTTP MCP endpoint at:

```text
/mcp
```

The deployed version is hosted publicly for Chord to access.

## Required Configuration

The integration requires:

- `GOOGLE_SHEET_ID`
- `PAYSTACK_SECRET_KEY`
- `MCP_AUTH_TOKEN`
- Google service-account credentials with access to the test spreadsheet

All payment credentials used for this exercise are **Paystack test credentials**.

The local `.env` file, Google service-account credentials and `node_modules` are excluded from Git.

No real customer data, live payment keys or personal WhatsApp number is used.

## Google Sheet

The test spreadsheet contains two main tabs.

### `INVENTORY`

Stores:

- SKU
- product name
- variant
- price
- total stock
- reserved quantity
- sold quantity
- available quantity

### `RESERVATIONS`

Stores:

- reservation ID
- SKU
- quantity
- expected payment amount
- reservation status
- payment reference
- payment status
- fulfilment method
- delivery address
- creation time
- payment time

This is intentionally a lightweight data store for the exercise rather than a production database.

## Chord Setup

The project uses:

- a custom Papahandmadeit Skill;
- the hosted MCP server as the tool connection;
- bearer authentication for the MCP endpoint;
- the Chord WhatsApp Simulator for the customer conversation.

The Chord teammate is left active so the workflow can be tested through the simulator.

## Failure Handling

The workflow includes handling for several cases.

If an item becomes unavailable before reservation, the reservation is not created.

If a payment is pending, it is not treated as successful.

If a payment fails, the failed payment is not repeatedly verified as though it could later become successful.

If the reservation is still active, a new payment attempt can be created.

If the reservation itself has expired, been cancelled or been released, inventory must be checked again before creating another reservation.

Fulfilment details cannot be recorded until payment has been successfully verified.

## Current Limitations

This is an exercise build and not a production commerce system.

Before using it with real customers, I would replace or strengthen several areas, including:

- move from Google Sheets to a transactional database or add stronger concurrency controls;
- connect a real WhatsApp Business number;
- use live Paystack credentials only after production checks;
- add payment webhooks instead of relying only on customer-triggered verification;
- add reservation expiry and automatic stock release;
- add monitoring and alerts when tools fail;
- add a clear human handoff path;
- add business notifications when a paid order is ready for fulfilment.

These are covered further in the go-live note.

## AI Usage

I used ChatGPT during the exercise mainly to think through the workflow, review some of my implementation decisions, and help when I got stuck during debugging.

I still built and tested the integrations myself, including the Google Sheet inventory flow, Paystack test payment flow, MCP server and Chord setup. Where something did not work as expected, I tested it, checked the actual response or error, and adjusted the implementation from there.

## Deployment

The MCP server is deployed on Render and connected to Chord through its public HTTPS `/mcp` endpoint.

The Papahandmadeit teammate is configured and active in Chord, with the WhatsApp Simulator used for the end-to-end test conversation.

See `FIELD_NOTES.md` for the problems encountered during development and deployment.