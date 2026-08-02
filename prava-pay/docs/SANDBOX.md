# Sandbox and test cards

## Official sandbox (SDK / REST API)

Prava publishes sandbox hosts and test Visa cards for the **SDK/API** path
(recommended in the Builder Handbook when you are not using MCP):

- API: `https://sandbox.api.prava.space`
- Collect: `sandbox.collect.prava.space`
- Keys: `sk_test_*` / `pk_test_*`
- Docs: https://docs.prava.space/api-reference/test-cards

### Example Visa test card (sandbox only)

| Field | Value |
|-------|-------|
| Number | `4622 9431 2313 7789` |
| CVV | `757` |
| Expiry | `12/27` |
| Test OTP | `456789` |

More cards are listed on the Prava Test Cards page. They never move real money on sandbox hosts.

Passkeys (Touch ID / Face ID) are still real WebAuthn prompts in sandbox.

## Prava Pay MCP (John CEO Pay path)

MCP is **free to integrate** with per-user OAuth (see CREDENTIALS.md). There is **no separate
sandbox MCP host** - agent-linked payments use live payment rails. SDK sandbox (above) is a
different path and is not a substitute for the MCP demo.

John CEO Pay stays on MCP for Telegram. SDK/embedded without a separate Prava login would need
Prava production approval - out of scope.

| Env | Recommendation |
|-----|----------------|
| Unit tests / `npm test` / `npm run demo` | Mocked upstream only (offline; not a real payment) |
| Localhost / staging with MCP | Per-user OAuth link + tiny amounts / spend limits |
| Production John CEO | Keep `PRAVA_PAY_ENABLED=false` |

## Env for this module

```bash
PRAVA_MCP_UPSTREAM_URL=https://mcp.pay.prava.space/mcp
PRAVA_DEMO_ACCESS_TOKEN=   # optional shared token for smoke
PRAVA_TOKEN_STORE_DIR=./.prava-tokens
PRAVA_PUBLIC_BASE_URL=http://127.0.0.1:8791
```
