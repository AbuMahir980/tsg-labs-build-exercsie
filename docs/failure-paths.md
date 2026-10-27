# Failure Paths

## Context
This document describes how the teammate should respond when the normal limited-drop purchase flow cannot continue successfully.

### 1. Unclear Item Request
**Customer:** Hi, is that shirt still available?

**Teammate:** Which item are you referring to? Please tell me the item name or describe the item you saw on our status.

**Rule:**
- Do not guess which product the customer means.
- Do not call the inventory tool until the item is clear enough to identify.

### 2. Product Not Found

**Customer:** Hi, is the Indigo Heritage Shirt still available?

**Tool Call:** Inventory Tool
- Input: Indigo Heritage Shirt
- Expected result: no matching product found

**Teammate:** I couldn't find the Indigo Heritage Shirt in our current listed inventory, so it is not available at the moment.

**Rule:**
- If the customer's request clearly identifies the item, do not ask them to clarify again.
- Do not invent a matching product or stock status.
- Do not create a reservation or payment request.

### 3. Item Sold Out

**Customer:** Hi, is the Indigo Heritage Shirt still available?

**Tool Call:** Inventory Tool
- Input: Indigo Heritage Shirt
- Expected result: product found, but available quantity is 0

**Teammate:** The Indigo Heritage Shirt is currently sold out.

**Rule:**
- Do not offer or create a reservation.
- Do not create a payment request.
- Do not invent a restock date.
- If no restock information exists, simply explain that the item is currently unavailable.

### 4. Inventory Tool Failure

**Customer:** Hi, is the Indigo Heritage Shirt still available?

**Tool Call:** Inventory Tool
- Expected result: tool fails, times out, or returns an unusable response

**Teammate:** I’m unable to confirm the item’s availability right now. Please try again shortly, or I can hand this over for manual assistance.

**Rule:**
- Do not confirm that the item is available or unavailable.
- Do not guess the stock status.
- Do not create a reservation or payment request.
- If the tool continues to fail, hand the conversation over for human assistance.

### 5. Reservation Tool Failure

**Customer:** Yes, please reserve it for me.

**Tool Call:** Inventory Tool
- Re-check availability immediately before reservation
- Expected result: item is still available

**Tool Call:** Reservation Tool
- Expected result: reservation creation fails or returns an unusable response

**Teammate:** I’m sorry, I couldn’t complete the reservation right now. The item has not been reserved yet.

**Rule:**
- Do not tell the customer the item is reserved unless the reservation tool succeeds.
- Do not invent a reservation ID.
- Do not create a payment request without a valid reservation.
- If the reservation tool continues to fail, hand the conversation over for human assistance.

### 6. Payment Creation Failure

**Teammate:** Your item has been reserved successfully. I’ll create your payment link now.

**Tool Call:** Payment Creation Tool
- Input: reservation ID, amount, customer/test details
- Expected result: payment creation fails, times out, or returns an unusable response

**Teammate:** I’m sorry, I couldn’t create the payment link right now. Your reservation is still active, but no payment link has been created yet.

**Rule:**
- Do not provide or invent a payment link.
- Do not invent a payment reference.
- Do not mark the reservation as paid.
- Keep the reservation active if its status is still valid.
- Allow another payment creation attempt later while the reservation remains active.
- If payment creation repeatedly fails, hand the conversation over for human assistance.

### 7. Payment Pending

**Customer:** I’ve paid.

**Tool Call:** Payment Verification Tool
- Use the stored payment reference
- Expected result: payment status is PENDING

**Teammate:** Your payment is still showing as pending, so I can’t confirm it as successful yet. I can check it again shortly.

**Rule:**
- Do not mark the reservation as paid.
- Do not proceed to fulfillment.
- Keep the reservation unchanged while it is still active.
- Allow the payment status to be checked again later.
- Do not treat a pending payment as failed.

### 8. Payment Failed

**Customer:** I’ve paid.

**Tool Call:** Payment Verification Tool
- Use the stored payment reference
- Expected result: payment status is FAILED

**Teammate:** The payment was not successful, so I can’t mark your reservation as paid yet. If your reservation is still active, I can create a new payment attempt for you.

**Rule:**
- Do not mark the reservation as paid.
- Do not proceed to fulfillment.
- Do not keep re-verifying the same failed payment reference.
- If the reservation is still active, allow a new payment attempt with a new payment reference.
- If the reservation is no longer active, re-check inventory before creating a new reservation and payment attempt.

### 9. Payment Expired or Cancelled

**Customer:** I couldn’t complete the payment.

**Tool Call:** Payment Verification Tool
- Use the stored payment reference
- Expected result: payment status is EXPIRED or CANCELLED

**Teammate:** That payment attempt is no longer active. If your reservation is still active, I can create a new payment attempt for you.

**Rule:**
- Do not mark the reservation as paid.
- Do not proceed to fulfillment.
- Do not reuse the expired or cancelled payment reference.
- If the reservation is still active, create a new payment attempt with a new payment reference.
- If the reservation is expired or cancelled, re-check inventory before creating a new reservation and payment attempt.

### 10. Reservation Expired or Cancelled

**Customer:** I still want to complete the purchase.

**Tool Call:** Reservation Tool
- Check the reservation status
- Expected result: reservation status is EXPIRED or CANCELLED

**Teammate:** Your previous reservation is no longer active. I’ll need to check whether the item is still available before creating a new reservation.

**Tool Call:** Inventory Tool
- Re-check current availability

**Rule:**
- Do not reuse an expired or cancelled reservation.
- Do not create a new payment attempt against an inactive reservation.
- Re-check inventory first.
- If the item is still available, create a new reservation and then a new payment attempt.
- If the item is no longer available, tell the customer and stop the purchase flow.

### 11. Customer Debited but Payment Unconfirmed

**Customer:** I was debited, but the payment is not showing as successful.

**Tool Call:** Payment Verification Tool
- Use the stored payment reference
- Expected result: payment is not confirmed as successful

**Teammate:** I can see that the payment has not been confirmed as successful yet, so I can’t mark the order as paid. I’ll hand this over for manual review.

**Rule:**
- Do not rely on the customer’s debit alert as proof of successful payment.
- Do not mark the reservation as paid unless Paystack verification confirms success.
- Do not proceed to fulfillment.
- Keep the reservation unchanged while its status remains valid.
- Hand the case over for human review if the customer reports a debit but verification remains unconfirmed.

### 12. Payment Amount or Reference Mismatch

**Customer:** I’ve paid.

**Tool Call:** Payment Verification Tool
- Use the stored payment reference
- Expected result: payment may show SUCCESS, but the amount or reservation linkage does not match the expected transaction

**Teammate:** The payment details do not match your reservation, so I can’t confirm this order as paid. I’ll hand this over for manual review.

**Rule:**
- Do not mark the reservation as paid if the paid amount does not match the expected amount.
- Do not mark the reservation as paid if the payment reference does not belong to that reservation.
- Do not proceed to fulfillment.
- Do not guess or manually correct the mismatch.
- Hand the case over for human review.

### 13. Unexpected or Empty Tool Response

**Tool Call:** Any required tool
- Expected result: tool returns an empty, incomplete, malformed, or unexpected response

**Teammate:** I couldn’t confirm that action successfully, so I won’t continue with the next step yet. I’ll hand this over for manual assistance.

**Rule:**
- Do not guess what the tool intended to return.
- Do not treat an empty or malformed response as success.
- Do not continue to the next transaction step without a confirmed result.
- Retry only where it is safe and appropriate.
- If the result still cannot be confirmed, stop the automated flow and hand over for human assistance.