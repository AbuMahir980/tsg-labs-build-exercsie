# TSG Labs Build Exercise — Working TODO

> **Temporary working file.**
>
> This is our single checklist for the TSG Labs assessment.
>
> We will work in two stages:
>
> **Stage A — Pre-Chord preparation:** planning, learning, writing, and design before triggering the timed access window.
>
> **Stage B — Timed implementation:** Chord setup, tool building, testing, debugging, documentation, recording, and submission.
>
> **Rule:** One step at a time. Do not jump ahead.

---

# STAGE A — PRE-CHORD PREPARATION

## A0 — Project Setup

Already completed:

- [x] Create the local project/repository.
- [x] Add `docs/assessment-blueprint.md`.
- [x] Add `docs/working-todo.md`.
- [x] Add `FIELD_NOTES.md`.
- [x] Confirm Papahandmadeit can be used as the business case.
- [x] Decide to use synthetic/test data only.

Do not create the Chord account yet unless ready for TSG to activate credits and simulator access.

---

## A1 — Lock the Problem

### You do

Write the first version of the required 3–4 sentence problem statement yourself.

It must answer:

1. Who is Papahandmadeit?
2. What business problem happens today?
3. What will the agent do?
4. What are we deliberately not building?

### I guide/review

- [ ] Review clarity.
- [ ] Check whether the problem is commercially meaningful.
- [ ] Check whether it suits Forward-Deployed Engineering.
- [ ] Remove unnecessary scope.
- [ ] Make sure nothing is overstated.

### Output

- [ ] Approved 3–4 sentence problem statement.
- [ ] Role preference confirmed as **Forward-Deployed Engineering** unless we discover a strong reason to change it.

---

## A2 — Understand Chord Conceptually

Before opening the platform, learn the basic building blocks.

### Concepts

- [ ] Teammate
- [ ] Skill
- [ ] Tool
- [ ] Model
- [ ] Channel
- [ ] Tool call
- [ ] Simulator

### Learning method

For each concept:

1. I explain it in simple English.
2. I show how it relates to Papahandmadeit.
3. You explain it back in your own words.
4. We move on only when it is clear.

### Output

You should be able to explain:

- [ ] What a Chord teammate is.
- [ ] What a skill does.
- [ ] What a tool does.
- [ ] What the model does.
- [ ] What the WhatsApp channel does.
- [ ] How a customer message can lead to a tool action.

---

## A3 — Learn How to Write a Good Skill

We do this before writing the final Papahandmadeit skill.

### Skill-writing concepts

- [ ] Business context
- [ ] Single job
- [ ] Source-of-truth rules
- [ ] Tool-use rules
- [ ] Conversation rules
- [ ] Decision rules
- [ ] Failure handling
- [ ] Handoff/stopping rule

### Important principle

The skill should not merely say:

> “Be helpful.”

It should tell the agent how the business works, when to use tools, what it must not invent, and what to do when something fails.

### Output

- [ ] You understand what makes a useful skill.
- [ ] You can explain why each section exists.

---

## A4 — Draft the Papahandmadeit Skill Locally

Create:

```text
skills/
└── papahandmadeit/
    └── SKILL.md
```

We will draft it section by section.

### Section 1 — Business Context

- [ ] Write who Papahandmadeit is.
- [ ] Explain limited product drops.
- [ ] Explain why customers need fast confirmation.

### Section 2 — Agent Job

- [ ] Write one clear sentence describing the teammate's job.

Target idea:

> Help a customer check a limited item, reserve an available unit, complete payment, choose fulfilment, and hand the order over to the business.

### Section 3 — Source-of-Truth Rules

Write rules such as:

- [ ] Never invent stock availability.
- [ ] Never say an item is reserved until the reservation tool succeeds.
- [ ] Never say payment is successful until Paystack verification succeeds.
- [ ] Never invent a product or price.
- [ ] Use the business data returned by tools.

### Section 4 — Conversation Rules

- [ ] Ask only for information needed for the current step.
- [ ] Ask for explicit reservation confirmation.
- [ ] Do not request delivery details before payment is confirmed.
- [ ] Keep responses concise and suitable for WhatsApp.

### Section 5 — Tool-Use Rules

- [ ] When to check inventory.
- [ ] When to create a reservation.
- [ ] When to create a payment.
- [ ] When to verify payment.
- [ ] When to save fulfilment information.

### Section 6 — Failure Handling

Define what the agent does when:

- [ ] Product not found.
- [ ] Product sold out.
- [ ] Reservation fails.
- [ ] Payment creation fails.
- [ ] Payment is not yet successful.
- [ ] A tool returns an empty/unexpected response.

### Section 7 — Handoff Rule

- [ ] Define when the agent has finished its job.
- [ ] Do not claim the owner has been notified unless the system really sends a notification.

### How we work

For every section:

1. I teach the idea.
2. You write the section.
3. I review it.
4. You explain why you wrote it that way.
5. We refine it.

### Output

- [ ] First local draft of `SKILL.md` written mainly by you.

---

## A5 — Design the Happy-Path Conversation

Write the full conversation before implementation.

### Customer flow

- [ ] Customer asks about a product.
- [ ] Agent identifies the product.
- [ ] Agent checks inventory.
- [ ] Agent reports availability.
- [ ] Agent asks if it should reserve one.
- [ ] Customer agrees.
- [ ] Agent creates reservation.
- [ ] Agent receives reservation ID.
- [ ] Agent creates Paystack test payment.
- [ ] Agent sends payment link/reference.
- [ ] Customer completes test payment.
- [ ] Customer says they have paid.
- [ ] Agent verifies payment.
- [ ] Agent marks reservation paid.
- [ ] Agent asks pickup or delivery.
- [ ] Customer chooses.
- [ ] Agent saves fulfilment details.
- [ ] Agent hands off to Papahandmadeit.

### I guide/review

- [ ] Check that every factual claim has a source.
- [ ] Mark where each tool must be called.
- [ ] Remove unnecessary questions.
- [ ] Confirm where the conversation should end.

### Output

- [ ] Approved happy-path conversation.

---

## A6 — Design the Failure Paths

Do not code them yet.

Write expected behaviour for:

- [ ] Product not found.
- [ ] Product sold out.
- [ ] Customer does not want to reserve.
- [ ] Stock disappears before reservation.
- [ ] Reservation fails.
- [ ] Payment creation fails.
- [ ] Payment verification returns unsuccessful.
- [ ] External system returns empty/unexpected data.

### Output

- [ ] Short failure-path guide.

---

## A7 — Design the Google Sheet

We can decide the data structure before integrating anything.

### Tab 1 — `INVENTORY`

Proposed columns:

- [ ] `sku`
- [ ] `product_name`
- [ ] `variant`
- [ ] `price_ngn`
- [ ] `stock_total`
- [ ] `reserved_count`
- [ ] `sold_count`
- [ ] `available_count` or a derived equivalent

### Tab 2 — `RESERVATIONS`

Proposed columns:

- [ ] `reservation_id`
- [ ] `sku`
- [ ] `quantity`
- [ ] `status`
- [ ] `payment_reference`
- [ ] `customer_name` — fake/test only
- [ ] `customer_contact` — fake/test only if needed
- [ ] `fulfilment_method`
- [ ] `delivery_address`
- [ ] `created_at`
- [ ] `paid_at`

### Important design questions

- [ ] Should `available_count` be stored or calculated?
- [ ] What changes when an item is reserved?
- [ ] What changes when payment becomes successful?
- [ ] What information is actually necessary for the MVP?

### Output

- [ ] Approved Sheet design.
- [ ] 2–4 fake products ready to add later.

---

## A8 — Design the Tool Contracts

Do not code the tools yet.

For each possible tool/action, define:

- input;
- output;
- failure cases;
- what the agent may say after success.

### Inventory/order actions

- [ ] `find_product`
- [ ] `check_availability`
- [ ] `create_reservation`
- [ ] `mark_reservation_paid`
- [ ] `save_fulfilment`

### Payment actions

- [ ] `create_payment`
- [ ] `verify_payment`

### Questions to answer for each tool

- [ ] What goes in?
- [ ] What comes back?
- [ ] What can fail?
- [ ] What should the agent do if it fails?

### Output

- [ ] Simple tool-contract document/notes.

---

## A9 — Learn the API Fundamentals

Before writing the integrations, understand:

- [ ] What an API is.
- [ ] Request vs response.
- [ ] GET.
- [ ] POST.
- [ ] PATCH/PUT conceptually.
- [ ] JSON.
- [ ] Headers.
- [ ] API keys.
- [ ] Bearer authentication.
- [ ] Environment variables.
- [ ] HTTP status codes.
- [ ] `async/await`.
- [ ] Promises.
- [ ] Error handling.

### Learning method

For each concept:

1. Plain-English explanation.
2. Small generic example.
3. Apply it mentally to Paystack/Google Sheets.
4. You explain it back.

### Output

- [ ] You can explain what will happen when our tool calls an external API.

---

## A10 — Understand the Paystack Test Flow

Before implementation, understand this sequence:

```text
Create transaction
        ↓
Receive payment URL/reference
        ↓
Customer completes test payment
        ↓
Verify transaction by reference
        ↓
Only then mark reservation paid
```

### Learn

- [ ] Why payment creation is not the same as payment success.
- [ ] Why a customer saying “I paid” is not proof.
- [ ] Why reservation ID and payment reference should be separate.
- [ ] Why test keys must be used.
- [ ] What happens if payment fails.

### Output

- [ ] You can explain the full payment lifecycle in your own words.

---

## A11 — Prepare the README Skeleton

Create headings only for now:

```md
# Papahandmadeit Limited-Drop Agent

## Problem

## Solution

## Architecture

## How It Works

## Skills

## Tools

## Setup

## Testing

## Limitations

## Go-Live Considerations

## AI Usage
```

### Output

- [ ] README skeleton committed locally.

---

## A12 — Prepare the Field-Notes Habit

Review `FIELD_NOTES.md`.

Before timed implementation starts, know what counts as a useful note:

- [ ] exact error where useful;
- [ ] what happened;
- [ ] what you suspected;
- [ ] what you checked;
- [ ] root cause;
- [ ] fix/workaround;
- [ ] specific Chord/docs/API improvement.

### Rule

Do not manufacture problems.

### Output

- [ ] Ready to log real issues immediately during Stage B.

---

## A13 — Prepare the Go-Live Note Outline

Do not write the final note yet.

Prepare headings/prompts for:

- [ ] What the agent does.
- [ ] What it does not do.
- [ ] Live Paystack keys.
- [ ] Real WhatsApp number.
- [ ] Real inventory.
- [ ] Reservation expiry.
- [ ] Concurrent buyers.
- [ ] Failed/delayed payments.
- [ ] Human escalation.
- [ ] Merchant notifications.
- [ ] Monitoring.
- [ ] Delivery ownership.

### Output

- [ ] Half-page structure ready for later completion.

---

## A14 — Prepare the Testing Checklist

### Happy path

- [ ] Product found.
- [ ] Item available.
- [ ] Reservation succeeds.
- [ ] Payment creation succeeds.
- [ ] Payment verification succeeds.
- [ ] Fulfilment saved.

### Failure cases

- [ ] Product missing.
- [ ] Sold out.
- [ ] Reservation failure.
- [ ] Payment creation failure.
- [ ] Invalid payment reference.
- [ ] Payment unsuccessful.
- [ ] Empty/unexpected tool response.

### Output

- [ ] Test checklist ready before timed implementation.

---

## A15 — Decide When to Trigger the Timed Stage

Before creating the Chord account and emailing TSG:

- [ ] Confirm you have enough time over the next few days.
- [ ] Confirm Stage A planning is sufficiently complete.
- [ ] Confirm local skill draft exists.
- [ ] Confirm conversation flow exists.
- [ ] Confirm Sheet design exists.
- [ ] Confirm tool contracts exist.
- [ ] Confirm API basics are understood.

Then:

- [ ] Create Chord account.
- [ ] Send Emmanuel the account email.
- [ ] Record the exact date/time when credits and simulator access arrive.

> According to the brief, the 5-day period starts when access arrives.

---

# STAGE B — TIMED IMPLEMENTATION

## B1 — Inspect the Real Chord Environment

Once access is active:

- [ ] Open Chord.
- [ ] Open simulator.
- [ ] Read the exact Chord skill/tool documentation.
- [ ] Compare actual format with our local assumptions.
- [ ] Update `SKILL.md` only where the real platform requires it.
- [ ] Record any documentation/platform issue in `FIELD_NOTES.md`.

### Output

- [ ] Confirmed Chord structure.

---

## B2 — Create the Chord Teammate

- [ ] Create teammate.
- [ ] Attach/publish skill.
- [ ] Test a simple conversation before adding external tools.
- [ ] Confirm skill instructions affect responses.

### Output

- [ ] Basic teammate working.

---

## B3 — Create the Test Google Sheet

- [ ] Create `INVENTORY`.
- [ ] Create `RESERVATIONS`.
- [ ] Add 2–4 fake products.
- [ ] Use only synthetic data.

### Output

- [ ] External inventory source ready.

---

## B4 — Build the Smallest Inventory Tool

### First milestone

- [ ] Find/read product.
- [ ] Return structured availability.

### Then

- [ ] Re-check stock before reservation.
- [ ] Create reservation.
- [ ] Update reservation/inventory state.

### Test

- [ ] Available product.
- [ ] Sold-out product.
- [ ] Missing product.
- [ ] Unexpected/empty response.

### Output

- [ ] Chord can take a real inventory action outside Chord.

---

## B5 — Build Paystack Test Payment

### Implement

- [ ] Store test key securely.
- [ ] Create test transaction.
- [ ] Link transaction to reservation.
- [ ] Return payment URL/reference.

### Test

- [ ] Successful transaction creation.
- [ ] Invalid request.
- [ ] External API failure.

### Output

- [ ] Agent can produce a real Paystack test transaction.

---

## B6 — Add Payment Verification

- [ ] Verify transaction by payment reference.
- [ ] If successful:
  - [ ] mark reservation `PAID`;
  - [ ] update inventory state;
  - [ ] record payment reference/time.
- [ ] If unsuccessful:
  - [ ] do not mark paid;
  - [ ] tell customer the payment is not yet confirmed.

### Test

- [ ] Successful payment.
- [ ] Invalid reference.
- [ ] Failed/pending state if supported.
- [ ] Unexpected response.

### Output

- [ ] Paid state only occurs after external verification.

---

## B7 — Add Fulfilment

After payment confirmation:

- [ ] Ask `PICKUP` or `DELIVERY`.
- [ ] Save pickup choice.
- [ ] For delivery, request fake/test address.
- [ ] Save delivery details.
- [ ] Confirm order details were recorded.
- [ ] Hand off to Papahandmadeit team.

### Do not add

- [ ] No courier API.
- [ ] No tracking.
- [ ] No packing system.
- [ ] No false “owner notified” claim.

---

## B8 — Connect the Full Conversation

- [ ] Run the full happy path.
- [ ] Confirm inventory tool is used.
- [ ] Confirm reservation record is created.
- [ ] Confirm Paystack transaction is created.
- [ ] Confirm payment is verified.
- [ ] Confirm paid state is written back.
- [ ] Confirm fulfilment is saved.
- [ ] Confirm final customer response is accurate.

---

## B9 — Failure Testing

Test the most meaningful failures:

- [ ] Product not found.
- [ ] Sold out.
- [ ] Stock disappears before reservation.
- [ ] Reservation failure.
- [ ] Payment creation failure.
- [ ] Payment verification failure.
- [ ] Empty/unexpected external response.

For every genuine build/deployment issue:

- [ ] Update `FIELD_NOTES.md` immediately.

---

## B10 — README

Complete:

- [ ] Project overview.
- [ ] Problem.
- [ ] Solution.
- [ ] Architecture.
- [ ] Skill/tool summary.
- [ ] Setup/run instructions.
- [ ] Testing.
- [ ] Limitations.
- [ ] AI usage disclosure.

Keep it concise.

---

## B11 — Deployment Field Notes

Choose the best 2–3 genuine issues.

For each:

- [ ] What happened.
- [ ] Exact error where useful.
- [ ] How the cause was investigated.
- [ ] Root cause.
- [ ] Fix/workaround.
- [ ] Specific improvement to Chord/docs/API.

Do not manufacture problems.

---

## B12 — Go-Live Note

Half page maximum.

Explain for the business owner:

- [ ] what the agent does;
- [ ] what it does not do;
- [ ] what must change before real customers use it;
- [ ] live payment keys;
- [ ] real WhatsApp connection;
- [ ] real inventory;
- [ ] abandoned reservations;
- [ ] concurrent buyers;
- [ ] payment failure/reconciliation;
- [ ] who handles exceptions;
- [ ] alerts/monitoring.

---

## B13 — 3-Minute Screen Recording

Target story:

1. Problem in one sentence.
2. Customer asks about product.
3. Agent checks stock.
4. Reservation happens.
5. Paystack transaction happens.
6. Payment is verified.
7. Sheet shows final state.
8. Fulfilment is captured.
9. End.

- [ ] Stay under 3 minutes.
- [ ] Show the actual tool action.

---

## B14 — Final QA

- [ ] Agent remains live on Chord.
- [ ] Simulator works.
- [ ] Repo access works.
- [ ] README instructions are accurate.
- [ ] No live keys committed.
- [ ] No real customer data.
- [ ] Paystack is test mode.
- [ ] Google Drive permissions are correct.
- [ ] All six requested submission pieces are present.
- [ ] AI usage is disclosed truthfully.
- [ ] Submit before the 5-day deadline.

---

# HOW WE WILL WORK TOGETHER

For every technical or product step:

1. **I explain the problem in simple English.**
2. **I teach only the concept needed at that moment.**
3. **I show a small generic pattern/syntax where necessary.**
4. **You write the real Papahandmadeit implementation.**
5. **You send it back for review.**
6. **I review mistakes and explain why.**
7. **You correct it yourself.**
8. **You explain the concept back to me.**
9. **We record genuine build/deployment issues.**
10. **Then we move to the next item.**

The aim is not only to submit a working agent.

The aim is for you to understand it well enough to handle TSG changing the requirements during the live follow-up session.
