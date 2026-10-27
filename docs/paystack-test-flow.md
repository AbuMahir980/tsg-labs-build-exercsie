# Paystack Test Flow

## 1. Test Environment

This project uses Paystack Test Mode only.

Test transactions do not move real money.

The backend uses a Paystack test secret key:

```text
sk_test_...
```

The secret key must never be committed to GitHub.

## 2. Payment Flow

The assessment payment flow is:

```text
Reservation created
        ↓
create_payment
        ↓
Paystack Initialize Transaction API
        ↓
Paystack returns payment URL + reference
        ↓
Reference saved against reservation
        ↓
Customer opens payment URL
        ↓
Customer completes test payment
        ↓
Customer tells teammate payment is complete
        ↓
verify_payment
        ↓
Paystack Verify Transaction API
        ↓
Validate status + amount + reservation
        ↓
Mark reservation PAID only if valid
```

## 3. Creating a Payment

The tool sends Paystack:

- test customer email
- reservation amount in kobo
- reservation information in metadata

Example:

```json
{
  "email": "test@example.com",
  "amount": 3500000,
  "metadata": {
    "reservation_id": "RES-001"
  }
}
```

Paystack returns:

```json
{
  "status": true,
  "data": {
    "authorization_url": "https://checkout.paystack.com/example",
    "reference": "example-reference"
  }
}
```

The tool stores the returned reference in the reservation.

## 4. Verifying a Payment

The verification tool retrieves the stored payment reference and calls Paystack's Verify Transaction API.

A reservation is marked PAID only when:

- Paystack transaction status is `success`
- the payment reference matches the stored reference
- the amount matches `expected_amount_ngn * 100`
- the transaction belongs to the correct reservation

A customer's message saying "I've paid" is never treated as payment confirmation.

## 5. Test Payment

Use Paystack's test payment details only.

One successful test card is:

```text
Card: 4084 0840 8408 4081
CVV: 408
Expiry: any future date
```

No real card or customer payment data should be used.

## 6. Webhook Decision

For this assessment MVP, payment verification is triggered when the customer tells the WhatsApp teammate that payment has been completed.

A production implementation should use Paystack webhooks for automatic payment confirmation.