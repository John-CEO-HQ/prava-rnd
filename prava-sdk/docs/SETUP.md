# Setup (prava-sdk hosted path)

## 1. Developer dashboard

1. Sign up at https://dashboard.prava.space
2. Create an API key (sandbox by default): `pk_test_*` + `sk_test_*`
3. Add your public HTTPS domain to allowed domains if the dashboard requires it
   for callbacks.

## 2. Env (standalone)

```bash
PRAVA_SECRET_KEY=sk_test_...
PRAVA_API_URL=https://sandbox.api.prava.space
# Required for npm run smoke when Prava needs an https callback_url
PRAVA_PUBLIC_BASE_URL=https://your-public-host.example/api/mcp/prava-sdk
# Optional listen port (default 8792)
PORT=8792
```

Without `PRAVA_SECRET_KEY`, `npm start` runs in mock mode (offline only).

Never commit secret keys. Keep `sk_test_*` in env vars or a local `.env` file only.

## 3. Test card (sandbox only)

| Field | Value |
|-------|-------|
| Number | `4622 9431 2313 7789` |
| CVV | `757` |
| Expiry | `12/27` |
| Test OTP | `456789` |

Docs: https://docs.prava.space/api-reference/test-cards

## Callback URL

Hosted checkout redirects to:

`{PRAVA_PUBLIC_BASE_URL}/callback?clientId=...&pending=...`

Prava requires `https` for `callback_url` in production-like hosts. Use a public
HTTPS base for real sandbox E2E (`npm run smoke`); local mock mode does not call Prava.
