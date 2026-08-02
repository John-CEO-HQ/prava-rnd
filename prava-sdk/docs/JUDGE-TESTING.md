# Judge / operator testing (prava-sdk)

## Offline (mocked)

```bash
cd prava-sdk
npm install
npm test
npm run demo
```

## Sandbox API smoke (needs sk_test_*)

1. Create keys at https://dashboard.prava.space
2. Run:

```bash
cd prava-sdk
export PRAVA_SECRET_KEY=sk_test_...
# callback_url must be https for Prava; use staging public URL when doing full redirect
export PRAVA_PUBLIC_BASE_URL=https://YOUR_STAGING/api/mcp/prava-sdk
npm run smoke
```

3. Open printed `payment_url`, enter test Visa `4622 9431 2313 7789`, CVV `757`,
   exp `12/27`, OTP `456789`, passkey.
4. Press Enter in the smoke CLI to poll; expect `status: completed` and `order_id`.

## Telegram E2E (staging)

1. Set on staging Heroku (or local `.env`):
   - `PRAVA_SDK_ENABLED=true`
   - `PRAVA_SECRET_KEY=sk_test_...`
   - `PRAVA_PAY_ENABLED` unset/false
2. Apply and Rebuild the e2e/demo user workspace.
3. Telegram Conversation A or B from `docs/agentic-commerce/README.md`.
4. Capture video: confirm -> open link -> test card -> order id in chat.
