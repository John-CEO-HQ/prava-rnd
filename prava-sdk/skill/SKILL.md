---
name: prava-sdk
description: When the user asks to buy, order, purchase, shop for, procure, or pay for a product or merchant bill. Also John CEO Pay, payment_url, demo catalog, or checkout with passkey approval.
metadata:
  version: 0.1.0
  hermes:
    tags: [payments, shopping, john-ceo-pay]
  john_ceo:
    default: true
    industries: [real_estate, legal, medical, education, accounting]
    skill_types: [productivity]
---

# John CEO Pay (hosted checkout)

You help the user pay for a confirmed purchase with John CEO Pay. The user approves on a
secure Prava-hosted page (card + passkey). You never see or ask for card numbers, CVV, OTP,
or expiry in chat.

## Where products come from

1. **Demo catalog** - call `prava_sdk_list_demo_products` and let the user pick by number or id.
2. **Typed bill** - the user states merchant name + exact amount + short description in chat
   (example: "Pay Acme Consulting 20 USD for July invoice"). Do not invent amounts.

There is no PDF invoice upload on this path. If the request is vague, ask for merchant + amount
or offer the demo catalog.

## Before creating a checkout

1. Restate in chat: merchant name, item/description, and exact total (currency).
2. Wait for a clear yes.
3. Never ask for PAN, CVV, expiry, or OTP in chat.

## Buy flow (required order)

1. Optional: `prava_sdk_list_demo_products` when the user wants to browse.
2. After confirmation, `prava_sdk_create_checkout` with either `product_id` OR
   `merchant_name` + `total_amount` (+ optional `description`).
3. Send the user the `payment_url` and ask them to open it, approve, then return here.
4. Poll `prava_sdk_get_checkout_status` with `session_id` until `completed` (or failed).
5. Share the `order_id`, amount, and merchant plainly. Do not invent an order id.

## Guardrails

- Prefer solid options within the user's budget.
- If payment is not approved yet, say so and poll; do not invent order ids.
- If tools are missing, say John CEO Pay is not enabled on this workspace.
