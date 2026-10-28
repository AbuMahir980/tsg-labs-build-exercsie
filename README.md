# Papahandmadeit Limited Drop Assistant

A Chord teammate built for the TSG Labs Build Exercise.

**Role preference:** Forward-Deployed Engineering

## What it does

Papahandmadeit is an African fashion and visual-art brand that releases some products in limited quantities through WhatsApp.

This assistant helps a customer:

- check whether an item is available;
- reserve an item;
- receive a Paystack test payment link;
- verify that payment was actually successful;
- choose pickup or delivery.

The inventory and reservation data are stored in Google Sheets for the exercise.

## Architecture

```text id="nw8q4h"
WhatsApp Simulator
        ↓
      Chord
        ↓
Papahandmadeit Skill
        ↓
 Custom MCP Server
     ↙       ↘
Google Sheets   Paystack
```

The MCP server is deployed publicly so Chord can call the custom tools.

## Custom Tools

The project includes these MCP tools:

- `check_inventory` — checks one item and returns its current stock, variant and price.
- `list_available_items` — lists products that currently have stock available.
- `create_reservation` — rechecks stock and creates a reservation.
- `create_payment` — creates a Paystack test transaction for a reservation.
- `verify_payment` — verifies the stored payment reference directly with Paystack.
- `update_fulfilment` — records pickup or delivery after payment has been verified.

The assistant does not treat a customer's message saying they have paid as proof of payment. Payment must first be verified with Paystack.

## Repository Structure

```text id="e0n7iv"
.
├── README.md
├── FIELD_NOTES.md
├── GO_LIVE_NOTE.md
├── docs/
│   ├── failure-paths.md
│   ├── happy-path-conversation.md
│   └── tool-contracts.md
├── skills/
│   └── papahandmadeit-limited-drop/
│       └── SKILL.md
└── tools/
    └── mcp-server/
        ├── src/
        ├── package.json
        └── package-lock.json
```

## Running the MCP Server

From the repository:

```bash id="s5sx0o"
cd tools/mcp-server
npm install
npm start
```

Required configuration includes:

```text id="dnl7nv"
GOOGLE_SHEET_ID
PAYSTACK_SECRET_KEY
MCP_AUTH_TOKEN
```

The Google service-account credentials also need access to the test spreadsheet.

The local `.env`, service-account credentials and `node_modules` are excluded from Git.

## Test Setup

This project uses:

- Chord for the teammate and Skill;
- the Chord WhatsApp Simulator for the customer conversation;
- Google Sheets for test inventory and reservations;
- Paystack in test mode only;
- a hosted MCP server for the custom tools.

No real customer data, live Paystack credentials or personal WhatsApp number are used.

## Running the Demo

A typical flow is:

```text id="8e6by9"
Check item
→ Reserve
→ Create payment
→ Customer pays
→ Verify payment
→ Record pickup or delivery
```

The agent checks inventory again immediately before creating a reservation because stock may have changed after the customer's first enquiry.

## AI Usage

I used ChatGPT during the exercise mainly to think through the workflow, review some implementation decisions and help when I got stuck during debugging.

I still built and tested the integrations myself, including the Google Sheet inventory flow, Paystack test payment flow, MCP server and Chord setup. Where something did not work as expected, I tested it, checked the actual response or error, and adjusted the implementation from there.

## Notes

See `FIELD_NOTES.md` for the main problems I encountered while building and testing the project.

See `GO_LIVE_NOTE.md` for what would need to be in place before using the assistant with real Papahandmadeit customers.