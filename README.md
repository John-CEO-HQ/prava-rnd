# prava-rnd

MIT packages for **John CEO Pay** (Agentic Commerce / Prava hackathon).

Confirm a purchase, approve on a Prava-hosted page with passkey / Face ID, get an
order id back. Card data never reaches the agent.

## Dual path

| Package | Prava surface | Demo today |
|---------|---------------|------------|
| [`prava-sdk/`](prava-sdk/) | Hosted REST sandbox (`sk_test_*`) | Yes - offline demo + `npm run smoke` |
| [`prava-pay/`](prava-pay/) | MCP live rails | Blocked for EU cards without US/SG/HK card |

`prava-sdk` is the submission-grade demo path. `prava-pay` is kept for future
live MCP shopping when European cards are accepted.

## Quick start (SDK demo)

```bash
cd prava-sdk
npm install
npm test
npm run demo          # offline / mocked
# With a real sandbox key:
# export PRAVA_SECRET_KEY=sk_test_...
# export PRAVA_API_URL=https://sandbox.api.prava.space
# npm run smoke
```

Judge docs: [`prava-sdk/docs/JUDGE-TESTING.md`](prava-sdk/docs/JUDGE-TESTING.md),
[`prava-sdk/docs/SETUP.md`](prava-sdk/docs/SETUP.md).

## MCP path (optional)

```bash
cd prava-pay
npm install
npm test
npm run demo
```

Judge docs: [`prava-pay/docs/JUDGE-TESTING.md`](prava-pay/docs/JUDGE-TESTING.md).

## License

MIT - Copyright (c) 2026 JHELY GLOBAL SL. See [LICENSE](LICENSE) and each
package `LICENSE`.
