# Tool Contracts

## Context
The Papahandmadeit teammate uses tools exposed through a remote MCP server.

The MCP server connects Chord to the external systems used by the workflow:
- Google Sheets for inventory and reservations
- Paystack test API for payment creation and verification

The teammate should not invent external-system results. Each tool must return a clear success or failure result.

### 1. check_inventory

#### Purpose
Check the current inventory for a Papahandmadeit item before availability is confirmed.

#### Input
- `item_query` — product name, SKU, or clear customer description

#### Tool behaviour
- Search the INVENTORY sheet.
- If the item is found, read its SKU, product name, variant, price and available quantity.
- Do not modify inventory.

#### Expected output

Successful match:

```json
{
  "success": true,
  "found": true,
  "sku": "PHM-002",
  "product_name": "Indigo Heritage Shirt",
  "variant": "Large",
  "price_ngn": 35000,
  "available_count": 5
}
```

No matching product:

```json
{
  "success": true,
  "found": false
}
```

Tool failure:

```json
{
  "success": false,
  "error": "Unable to read inventory"
}
```

### 2. create_reservation

#### Purpose
Create a reservation for an available Papahandmadeit item after the customer explicitly agrees to reserve it.

#### Input
- `sku` — exact product SKU
- `quantity` — quantity requested, normally 1

#### Tool behaviour
- Re-check the INVENTORY sheet for the SKU.
- Confirm that `available_count` is sufficient for the requested quantity.
- If available:
  - generate a unique reservation ID
  - create a row in the RESERVATIONS sheet
  - set `status` to `PAYMENT_PENDING`
  - store the expected amount
  - increase `reserved_count` in INVENTORY
- Do not create a reservation if sufficient stock is no longer available.

#### Expected output

Successful reservation:

```json
{
  "success": true,
  "reservation_id": "RES-001",
  "sku": "PHM-002",
  "quantity": 1,
  "expected_amount_ngn": 35000,
  "status": "PAYMENT_PENDING"
}
```

Item no longer available:

```json
{
  "success": false,
  "reason": "OUT_OF_STOCK"
}
```

Tool failure:

```json
{
  "success": false,
  "reason": "TOOL_ERROR",
  "error": "Unable to create reservation"
}
```

### 3. create_payment

#### Purpose
Create a Paystack test payment for an active reservation and store the payment reference against that reservation.

#### Input
- `reservation_id` — existing active reservation
- `customer_email` — test email used for the Paystack transaction

#### Tool behaviour
- Find the reservation in the RESERVATIONS sheet.
- Confirm the reservation is still active.
- Read `expected_amount_ngn` from the reservation.
- Create a Paystack test transaction using that amount.
- Include the reservation ID in the Paystack transaction metadata.
- Store the returned payment reference in `current_payment_reference`.
- Set `payment_status` to `PENDING`.
- Return the payment link and payment reference.
- Do not create a payment for an expired or cancelled reservation.

#### Expected output

Successful payment creation:

```json
{
  "success": true,
  "reservation_id": "RES-001",
  "payment_reference": "PAY-abc123",
  "payment_url": "https://checkout.paystack.com/example",
  "amount_ngn": 35000,
  "payment_status": "PENDING"
}
```

Inactive reservation:

```json
{
  "success": false,
  "reason": "RESERVATION_NOT_ACTIVE"
}
```

Tool failure:

```json
{
  "success": false,
  "reason": "TOOL_ERROR",
  "error": "Unable to create payment"
}
```

### 4. verify_payment

#### Purpose
Verify the latest payment attempt for a reservation using Paystack before marking the reservation as paid.

#### Input
- `reservation_id` — reservation whose payment should be verified

#### Tool behaviour
- Find the reservation in the RESERVATIONS sheet.
- Read its `current_payment_reference`.
- Read its `expected_amount_ngn`.
- Verify the stored payment reference with Paystack.
- Read the actual transaction status from Paystack.
- Confirm the Paystack transaction belongs to the reservation.
- Confirm the paid amount matches the expected reservation amount.
- Paystack returns NGN amounts in kobo, so compare the returned amount against `expected_amount_ngn * 100`.
- Only mark the reservation as PAID when all verification checks succeed.
- Prevent the same successful payment from updating inventory twice.

#### Expected output

Successful verification:

```json
{
  "success": true,
  "verified": true,
  "reservation_id": "RES-001",
  "payment_reference": "PAY-abc123",
  "payment_status": "SUCCESS",
  "amount_ngn": 35000
}
```

Payment still pending:

```json
{
  "success": true,
  "verified": false,
  "payment_status": "PENDING"
}
```

Payment failed:

```json
{
  "success": true,
  "verified": false,
  "payment_status": "FAILED"
}
```

Amount mismatch:

```json
{
  "success": true,
  "verified": false,
  "reason": "AMOUNT_MISMATCH"
}
```

Reservation mismatch:

```json
{
  "success": true,
  "verified": false,
  "reason": "RESERVATION_MISMATCH"
}
```

Tool failure:

```json
{
  "success": false,
  "reason": "TOOL_ERROR",
  "error": "Unable to verify payment"
}
```

### 5. update_fulfilment

#### Purpose
Save the customer's fulfilment preference after payment has been successfully verified.

#### Input
- `reservation_id` — paid reservation
- `fulfilment_method` — `PICKUP` or `DELIVERY`
- `delivery_address` — required only when fulfilment method is `DELIVERY`

#### Tool behaviour
- Find the reservation in the RESERVATIONS sheet.
- Confirm the reservation status is `PAID`.
- If fulfilment method is `PICKUP`:
  - save `PICKUP`
  - leave `delivery_address` blank
- If fulfilment method is `DELIVERY`:
  - require a delivery address
  - save `DELIVERY`
  - store the address exactly as provided
- Do not update fulfilment for an unpaid reservation.

#### Expected output

Pickup saved successfully:

```json
{
  "success": true,
  "reservation_id": "RES-001",
  "fulfilment_method": "PICKUP"
}
```

Delivery saved successfully:

```json
{
  "success": true,
  "reservation_id": "RES-001",
  "fulfilment_method": "DELIVERY",
  "delivery_address": "12 Test Street, Lagos"
}
```

Reservation not paid:

```json
{
  "success": false,
  "reason": "RESERVATION_NOT_PAID"
}
```

Missing delivery address:

```json
{
  "success": false,
  "reason": "DELIVERY_ADDRESS_REQUIRED"
}
```

Tool failure:

```json
{
  "success": false,
  "reason": "TOOL_ERROR",
  "error": "Unable to update fulfilment"
}
```