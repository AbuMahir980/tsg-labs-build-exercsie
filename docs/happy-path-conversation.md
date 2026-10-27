# Happy Path Conversation

## Scenario
A customer sees a Papahandmadeit limited-drop item on WhatsApp Status and wants to know whether it is still available.

## Conversation

**Customer:** Hi, is the [item name] you posted still available?

**Teammate:** [Checks current availability before answering.]

**Tool Call:** Inventory Tool
- Input: item / SKU
- Expected result: item found and available

**Teammate:** Yes, it is currently available. Would you like me to reserve it for you?

**Customer:** Yes, please.

**Teammate:** [Proceeds to recheck the item if still available.]

**Tool Call:** Inventory Tool
- Re-check availability immediately before reservation.
- Expected result: still available.

**Teammate:** [Proceeds to reserve the item after re-confirming its availability.]

**Tool Call:** Reservation Tool
- Create reservation.
- Expected result: reservation succeeds and returns a reservation ID.

**Teammate:** Your item has been reserved successfully, I'll proceed to create your payment link now.

**Teammate:** [Proceeds to create payment link.]

**Tool Call:** Payment Creation Tool
- Input: reservation ID, amount, customer/test details
- Expected result: payment link and payment reference returned.
- Stores the payment reference against the reservation.

**Teammate:** Your payment link is ready: [Payment link]; Please complete the payment and let me know once you've paid.

**Customer:** I've paid.

**Teammate:** [Proceeds to verify the payment using stored payment reference.]

**Tool Call:** Payment Verification Tool
- Use the stored payment reference
- Expected result: payment is successful
- Confirm the paid amount matches the expected amount
- Confirm the payment reference belongs to the reservation

**Teammate:** Your payment has been confirmed successfully. Would you prefer pickup or delivery?

**Customer:** Delivery

**Teammate:** Please provide the delivery address.

**Customer:** [Test delivery address]

**Teammate:** [Proceeds to save fulfillment details]

**Tool Call:** Fulfillment Update Tool
- Input: reservation ID
- Fulfillment method: DELIVERY
- Delivery address: exactly as provided by the customer
- Expected result: fulfillment details saved successfully

**Teammate:** [Proceeds to hand over after successfully saving customer's fulfillment details.]
- Thank you. Your order details and fulfillment preference have been recorded successfully. The Papahandmadeit team will take over from here.

### Pickup Alternative
**Teammate:** [If the customer chooses PICKUP]

**Tool Call:** Fulfillment Update Tool
- Input: reservation ID
- Fulfillment method: PICKUP
- Do not request delivery address.
- Confirm that the order details were successfully recorded
- Expected result: fulfillment details saved successfully

**Teammate:** [Proceeds to hand over after successfully saving customer's fulfillment details.]
- Thank you. Your order details and fulfillment preference have been recorded successfully. The Papahandmadeit team will take over from here.