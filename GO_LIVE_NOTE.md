# Go-Live Note

The Papahandmadeit Limited Drop Assistant is designed to help manage limited-product sales through WhatsApp without the business owner having to respond manually to every enquiry.

For a customer, the experience is simple. They message Papahandmadeit on WhatsApp about an item they have seen, and the assistant checks the current stock before responding. If the customer wants the item, it can reserve it, send them a payment link, confirm the payment and then ask whether they want pickup or delivery.

For Papahandmadeit, this means fewer repetitive stock enquiries, quicker responses during a product drop, and a clearer record of which items have been reserved, paid for and are waiting for fulfilment.

## What it does not do yet

The current version is still a test setup. It is not connected to Papahandmadeit's real WhatsApp Business number, and payments are running through Paystack test mode.

It also does not arrange delivery itself, automatically release unpaid reservations after a set period, or notify a member of the team when something needs human attention.

The current Google Sheet works well for the exercise, but I would not rely on it as the long-term order system for a busy product drop where several customers may try to reserve the last item at the same time.

## Before going live

Before real customers use the assistant, I would:

- connect Papahandmadeit's WhatsApp Business number;
- switch from Paystack test mode to secured live payment credentials;
- introduce stronger inventory and reservation controls;
- automatically release reservations that are not paid for within a set time;
- add automatic payment confirmation through Paystack;
- notify the Papahandmadeit team when an order is paid or when the assistant needs help;
- provide a clear way for a customer to be handed over to a person when necessary.

I would first launch it with a small limited drop while a member of the Papahandmadeit team monitors the conversations. Once the stock, payment and handoff process is working reliably with real customers, it can then be used more widely.