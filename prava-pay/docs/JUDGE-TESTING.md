# Judge testing (standalone)

Product: **John CEO Pay**. Module: `prava-pay/`.

## Offline (mocked - not a submission transaction)

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
not a mocked payment. MCP is free to integrate; complete per-user OAuth (see
[CREDENTIALS.md](CREDENTIALS.md)).

1. Obtain a Prava Pay access token via OAuth / link flow. With the standalone server
   running, open `GET http://127.0.0.1:8791/link/start?clientId=judge` and follow the
   Prava link instructions.
2. Optional live broker smoke:

```bash
export PRAVA_DEMO_ACCESS_TOKEN=...
cd prava-pay && npm start
```

In another terminal:

```bash
curl -s http://127.0.0.1:8791/mcp \
  -H 'Authorization: Bearer demo' \
  -H 'X-Prava-Client-Id: judge' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
curl -s http://127.0.0.1:8791/mcp \
  -H 'Authorization: Bearer demo' \
  -H 'X-Prava-Client-Id: judge' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"ping"}'
```

3. MCP has no separate sandbox host; live checkout needs a US/SG/HK issued card today.
   See [SANDBOX.md](SANDBOX.md). Use tiny amounts and dashboard spend limits for demos.
