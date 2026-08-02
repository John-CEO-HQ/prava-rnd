# Setup (prava-sdk hosted path)

## 1. Developer dashboard

1. Sign up at https://dashboard.prava.space
2. Create an API key (sandbox by default): `pk_test_*` + `sk_test_*`
3. Add your control-plane domain to allowed domains if the dashboard requires it
   for callbacks (staging HTTPS URL).

## 2. Env (control plane only)

```bash
PRAVA_SDK_ENABLED=true
PRAVA_SECRET_KEY=sk_test_...
PRAVA_API_URL=https://sandbox.api.prava.space
# Optional override; default is {CONTROL_PLANE_BASE_URL}/api/mcp/prava-sdk
# PRAVA_PUBLIC_BASE_URL=https://your-staging.example/api/mcp/prava-sdk
```

Keep `PRAVA_PAY_ENABLED` unset/false for the hackathon demo (live MCP off).

Never put `PRAVA_SECRET_KEY` on a user VM.

## 3. Test card (sandbox only)

| Field | Value |
|-------|-------|
| Number | `4622 9431 2313 7789` |
| CVV | `757` |
| Expiry | `12/27` |
| Test OTP | `456789` |

Docs: https://docs.prava.space/api-reference/test-cards

## 4. Telegram demo

1. Apply and Rebuild so cloud-init registers `mcp_servers.prava_sdk`.
2. Ask John: "What can I buy with John CEO Pay?" (demo catalog) or
   "Pay Acme Consulting 20 USD for July invoice" (typed bill).
3. Confirm merchant + total in chat.
4. Open `payment_url`, enter test card + OTP + passkey.
5. Return to Telegram; John reports order id after `prava_sdk_get_checkout_status`.

## Callback URL

Hosted checkout redirects to:

`{PRAVA_PUBLIC_BASE_URL}/callback?clientId=...&pending=...`

Prava requires `https` for `callback_url` in production-like hosts. Use staging
HTTPS for real sandbox E2E; local mock mode does not call Prava.
