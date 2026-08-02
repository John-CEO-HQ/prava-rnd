# Judge / operator testing (prava-sdk)

## Offline (mocked)

```bash
cd prava-sdk
npm install
npm test
npm run demo
```

Expected: unit tests pass; demo prints tool order
`prava_sdk_list_demo_products -> prava_sdk_create_checkout -> prava_sdk_get_checkout_status`
with a mocked `order_id`. Label this as offline/unit only in any write-up.

## Sandbox API smoke (submission-grade)

This is the recommended real checkout path for judges testing this repo standalone.
Dashboard keys and callback URL notes: [SETUP.md](SETUP.md).

1. Create keys at https://dashboard.prava.space
2. Run:

```bash
cd prava-sdk
export PRAVA_SECRET_KEY=sk_test_...
export PRAVA_API_URL=https://sandbox.api.prava.space
# callback_url must be https for Prava; use any public HTTPS base you control
export PRAVA_PUBLIC_BASE_URL=https://YOUR_PUBLIC_HOST/api/mcp/prava-sdk
npm run smoke
```

3. Open printed `payment_url`, enter test Visa `4622 9431 2313 7789`, CVV `757`,
   exp `12/27`, OTP `456789`, passkey.
4. Press Enter in the smoke CLI to poll; expect `status: completed` and `order_id`.

**Known upstream risk:** some sandbox sessions freeze after OTP and never return an
order id. Do not invent an order id if poll stays pending. Session creation through
card + OTP still demonstrates the integration.
