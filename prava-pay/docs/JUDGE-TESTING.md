# Judge testing (standalone)

Product: **John CEO Pay**. Module: `prava-pay/`.

## Offline (mocked — not a submission transaction)

```bash
cd prava-pay
npm install
npm test
npm run demo
```

Expected: unit tests pass; demo prints tool order
`shop_search -> shop_quote -> create_payment_session -> get_payment_status -> shop_checkout`
and a mocked `order_id`. Label this as offline/unit only in any write-up.

## Submission-grade (real MCP)

Per Builder Handbook: demo must complete a **real** checkout (`shop_checkout` + `order_id`),
not a mocked payment. MCP is free to integrate; complete per-user OAuth (CREDENTIALS.md).

1. Obtain a Prava Pay access token via OAuth / link flow.
2. Prefer the full John CEO Pay path on Telegram (see `docs/agentic-commerce/README.md`).
3. Optional live broker smoke:

```bash
export PRAVA_DEMO_ACCESS_TOKEN=...
npm start
```

Call `tools/list` and `ping` via JSON-RPC against `http://127.0.0.1:8791/mcp`
with `Authorization: Bearer demo` and `X-Prava-Client-Id: judge`.

## Inside John CEO

See monorepo `docs/plans/prava-pay-john-ceo-integration.md` and
`docs/agentic-commerce/`. Requires `PRAVA_PAY_ENABLED=true`, Apply and Rebuild,
Telegram, and a linked Prava token via `/link/start`.
