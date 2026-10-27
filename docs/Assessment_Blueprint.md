# TSG Labs Build Exercise — Papahandmadeit Assessment Blueprint

> **Purpose:** Preserve the working idea, scope, architecture, business rules, learning goals, and decisions before the 5-day assessment window begins.
>
> **Status:** Pre-build planning document. This is an internal working document and does not need to be submitted unless useful later.

---

## 1. Role Direction

**Primary role preference:** Forward-Deployed Engineering

Why this fits:
- The exercise heavily rewards integration quality.
- Deployment/debugging field notes carry major weight.
- The proposed agent connects a real WhatsApp business workflow to inventory and payment systems.
- The work demonstrates customer-facing problem solving, technical integration, and deployment thinking.

---

## 2. Business

**Business:** Papahandmadeit

Papahandmadeit is a Nigerian fashion business that sells handmade/traditional fashion pieces. A useful part of its sales workflow happens through WhatsApp, including limited product drops.

For the assessment:
- Use **made-up inventory data only**.
- Use **Paystack test mode only**.
- Use **no real customer data**.
- Use **no live payment keys**.
- If the Papahandmadeit name is used publicly in the submission, get the owner's permission first.

---

## 3. Problem We Are Solving

Papahandmadeit sometimes releases limited fashion pieces through WhatsApp. Customers may respond quickly to a status post, but the owner cannot always respond to every buyer immediately.

This creates several problems:
- customers do not know whether the item is still available;
- multiple customers may be asking for the same limited stock;
- manual replies slow down conversion;
- reservations and payments can be difficult to track;
- the owner needs a simple view of what is available, reserved, paid, and awaiting fulfilment.

### Proposed solution

Build a Chord-powered WhatsApp agent that can:

1. identify the product the customer wants;
2. check current availability;
3. ask whether the customer wants to reserve one;
4. create a reservation record;
5. create a Paystack test payment;
6. verify the payment;
7. mark the reservation as paid;
8. collect a simple fulfilment choice: pickup or delivery;
9. save the fulfilment information;
10. hand the order over to the Papahandmadeit team.

---

## 4. Core MVP

The assessment is intentionally small. The MVP should remain:

**Product enquiry → inventory check → reservation → payment creation → payment verification → paid order → fulfilment choice → business handoff**

### Deliberately excluded from the MVP

These are real production concerns but should not be built unless the core flow is already complete:

- a full website or customer portal;
- a merchant/admin dashboard;
- live Paystack keys;
- real WhatsApp numbers;
- real customer or inventory data;
- automatic reservation expiry;
- courier integration;
- delivery tracking;
- automated packing/ready-for-pickup notifications;
- refunds;
- complex order editing;
- analytics;
- loyalty programmes;
- a full database;
- multi-location inventory.

These exclusions can become part of the final go-live note.

---

## 5. Proposed Data Source — Google Sheets

Google Sheets is preferred over building a full back office because:
- it is simple;
- it is familiar to a non-technical business owner;
- the owner can update inventory directly;
- the agent can read and update the same source;
- it keeps the prototype focused on the actual workflow.

### Sheet 1 — INVENTORY

Suggested columns:

| Column | Meaning |
|---|---|
| `sku` | Unique product code |
| `product_name` | Human-readable product name |
| `variant` | Optional colour/size/style |
| `price_ngn` | Price |
| `stock_total` | Total units for the drop |
| `reserved_count` | Units currently held but unpaid |
| `sold_count` | Units with confirmed payment |
| `available_count` | Units still available |

Example fake data:

| sku | product_name | variant | price_ngn | stock_total | reserved_count | sold_count | available_count |
|---|---|---|---:|---:|---:|---:|---:|
| PH001 | Limited Danshiki | Brown | 85000 | 5 | 1 | 2 | 2 |
| PH002 | Handmade Kaftan | Black | 70000 | 3 | 0 | 1 | 2 |
| PH003 | Limited Agbada | Cream | 120000 | 1 | 0 | 0 | 1 |

> We will decide later whether `available_count` should be stored or calculated. In a production system, derived values are often safer when calculated from a single source of truth.

### Sheet 2 — RESERVATIONS / ORDERS

Suggested columns:

| Column | Meaning |
|---|---|
| `reservation_id` | Unique reservation identifier, e.g. `RES-001` |
| `sku` | Product being reserved |
| `quantity` | MVP will normally be `1` |
| `status` | e.g. `PAYMENT_PENDING`, `PAID`, `CANCELLED` |
| `payment_reference` | Paystack payment attempt reference |
| `customer_name` | Fake/test data for assessment |
| `customer_contact` | Fake/test data only if needed |
| `fulfilment_method` | `PICKUP` or `DELIVERY` |
| `delivery_address` | Fake/test address only |
| `created_at` | Reservation creation time |
| `paid_at` | Payment confirmation time |

---

## 6. Reservation and Payment Design

### Important distinction

A **reservation ID** and a **payment reference** should be separate.

Example:

- Reservation: `RES-003`
- Payment reference: `PAY-abcd1234`

Why:
- one reservation may eventually have more than one payment attempt;
- the reservation represents the customer's claim on the product;
- the payment reference represents a specific payment transaction.

### Reservation flow

1. Customer asks for a product.
2. Agent checks current inventory.
3. Agent tells the customer whether it is available.
4. Agent asks for explicit confirmation before reserving.
5. On confirmation, the tool **checks stock again**.
6. If still available:
   - create a reservation record;
   - mark one unit as reserved;
   - return the reservation ID.
7. If no longer available:
   - do not create a reservation;
   - tell the customer it sold out before reservation completed.

This second stock check matters because stock may change between the first enquiry and the customer's confirmation.

### Payment flow

1. Agent creates a Paystack test transaction linked to the reservation.
2. Tool returns the payment reference and payment URL/details.
3. Customer completes the test payment.
4. Customer returns to WhatsApp.
5. Agent calls the payment verification tool.
6. The agent must **not** trust a plain message such as “I have paid.”
7. Only after Paystack reports success:
   - reservation status becomes `PAID`;
   - reserved count decreases;
   - sold count increases;
   - `paid_at` is recorded.
8. Agent confirms payment to the customer.

---

## 7. Fulfilment Handoff

After payment confirmation:

**Agent:** “Your payment has been confirmed. Would you prefer delivery or store pickup?”

### Pickup

Save:

- `fulfilment_method = PICKUP`

Then tell the customer that the Papahandmadeit team will take over the pickup preparation.

### Delivery

Ask for a test delivery address.

Save:

- `fulfilment_method = DELIVERY`
- `delivery_address = <test address>`

Then tell the customer that payment and delivery details have been recorded and the Papahandmadeit team will take over.

### Important honesty rule

Do not say:

> “The owner has been notified.”

unless the system truly sends a notification.

For the MVP, updating the shared Google Sheet is enough. A real merchant notification can be listed as a production requirement.

---

## 8. Proposed Chord Skill Responsibilities

The skill should make the teammate behave as if it understands the Papahandmadeit limited-drop workflow.

It should contain business context and operating rules, not just generic chatbot instructions.

### The skill should teach the agent:

- what Papahandmadeit sells;
- that some items are limited drops;
- that availability must come from the inventory tool;
- never to invent stock numbers;
- never to promise an item before a reservation is successfully created;
- to ask for customer confirmation before reserving;
- to use the reservation returned by the tool;
- to create payment only after a valid reservation exists;
- never to say payment succeeded until verification says so;
- what to say when a product is not found;
- what to say when stock is zero;
- what to do when payment creation fails;
- what to do when payment verification is unsuccessful;
- to ask pickup vs delivery only after confirmed payment;
- to collect only the minimum customer information required;
- to hand off to the business after fulfilment details are captured.

### Skill-writing principles we will learn and apply

When it is time to write the skill manually, we will work through:

1. **Role/context** — Who is this teammate working for?
2. **Job** — What single useful job should it complete?
3. **Source-of-truth rules** — What must come from tools rather than the model?
4. **Decision rules** — What should happen in each important state?
5. **Tool-use rules** — When should each tool be called?
6. **Safety/accuracy rules** — What must the agent never claim without evidence?
7. **Conversation rules** — What information should it ask for and in what order?
8. **Failure handling** — What should it do when a tool fails or returns nothing?
9. **Stopping/handoff rule** — When has the agent finished its job?

The goal is not to make the skill long. The goal is to make the behaviour clear and testable.

---

## 9. Proposed Tools

Exact implementation depends on the Chord documentation.

Potential tool actions:

### Inventory tool

- `find_product`
- `check_availability`
- `create_reservation`
- `mark_reservation_paid`
- `save_fulfilment`

These may be separate actions or one custom tool with several operations depending on how Chord expects tools to be built.

### Payment tool

- `create_payment`
- `verify_payment`

Paystack must use **test mode** only.

---

## 10. End-to-End Demo Conversation

Target conversation:

1. Customer asks about a limited product.
2. Agent identifies the product.
3. Agent checks the Sheet.
4. Agent reports accurate availability.
5. Agent asks whether it should reserve one.
6. Customer says yes.
7. Agent creates reservation.
8. Agent receives `reservation_id`.
9. Agent creates Paystack test payment.
10. Agent sends payment information/link.
11. Customer completes test payment.
12. Customer says they have paid.
13. Agent verifies with Paystack.
14. Agent marks the reservation paid.
15. Agent asks pickup or delivery.
16. Customer chooses.
17. Agent stores fulfilment data.
18. Agent confirms that the order details have been recorded and hands off to the team.

---

## 11. Important Edge Cases

We do not need to build every possible case, but we should understand and test the important ones.

### Must understand/test

- product not found;
- product sold out;
- customer changes their mind before reservation;
- stock disappears between initial check and reservation;
- Paystack transaction creation fails;
- invalid payment reference;
- payment verification says not successful;
- Sheet/API returns an unexpected or empty response.

### Important interview/production issue

**Two customers try to reserve the final unit at nearly the same time.**

Google Sheets is convenient for the prototype but may not provide the strongest concurrency guarantees for a real high-demand drop.

We will discuss:
- atomic reservation;
- transactions/locking;
- why a production inventory service/database may replace Sheets at scale.

This does not need to become a large implementation for the assessment.

---

## 12. Production Concerns for the Go-Live Note

A real deployment would need decisions around:

- live Paystack keys and secure secret storage;
- real WhatsApp Business connection;
- real inventory migration;
- reservation expiry;
- race conditions/concurrent reservations;
- failed or delayed payments;
- payment reconciliation;
- refunds;
- human escalation;
- merchant notifications;
- order fulfilment ownership;
- address handling/privacy;
- monitoring and alerts;
- audit history;
- system downtime;
- customer support when the agent cannot complete the flow.

---

## 13. Learning Goals

This project should teach, not only produce a submission.

We will learn each concept when it becomes necessary.

### Agent / product

- how to define one agent job;
- how to write useful AI skill/instruction files;
- tool-use boundaries;
- source-of-truth thinking;
- conversation design;
- human handoff;
- failure behaviour.

### Integration engineering

- APIs;
- HTTP methods;
- request/response;
- JSON;
- authentication;
- API keys and environment variables;
- external-tool errors;
- timeouts and unexpected responses;
- Paystack test transactions;
- Google Sheets integration.

### System/product thinking

- inventory states;
- reservations;
- payment state;
- data consistency;
- idempotency/concurrency concepts where relevant;
- MVP scoping;
- go-live risks.

### Debugging/deployment

- reproducing errors;
- reading error messages;
- forming hypotheses;
- finding root causes;
- documenting fixes;
- giving actionable platform feedback.

---

## 14. Assessment Deliverables

TSG Labs asks for six things:

1. **Role preference + 3–4 sentence problem statement**
2. **Working Chord agent left live**
3. **Code repo + short README**
4. **3-minute screen recording**
5. **Deployment field notes**
6. **Half-page go-live note**

We should build these progressively rather than at the end.

---

## 15. AI Usage

The brief allows AI tools but requires disclosure.

Our final README should briefly and truthfully explain how AI was used, for example:
- ChatGPT as a learning/technical mentor and reviewer;
- Claude as a second reviewer;
- any coding assistant used during implementation.

The final wording should reflect what was actually used.

---

## 16. Current Decision

**Leading solution:**
Papahandmadeit Limited-Drop WhatsApp Reservation & Payment Agent

**Preferred simple architecture:**

```text
Customer
   |
WhatsApp Simulator
   |
Chord Teammate
   |--------------------|
   |                    |
Inventory/Order Tool    Paystack Tool
   |                    |
Google Sheets           Paystack Test API
```

**MVP finish line:**

> A customer can ask about a limited item, reserve an available unit, receive a test payment, have payment verified, select pickup/delivery, and have the resulting order state recorded outside Chord.

---

## 17. Pre-Build Rule

Do **not** start coding merely because the idea is exciting.

Before implementation:
- preserve the plan;
- create the repo;
- prepare the field-notes file;
- read Chord documentation;
- confirm the exact tool/skill formats;
- write the problem statement;
- map the conversation;
- then build the smallest end-to-end version.
