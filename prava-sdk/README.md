# prava-sdk

Prava hosted REST/API broker for John CEO Pay (MIT). Primary hackathon demo path.

- **Standalone:** `npm start` exposes an HTTP MCP server (port 8792).
- **Optional host integration:** the same handler can mount in-process behind a feature
  flag in a host app (not required to run or demo this package).

This is **not** the Prava Pay MCP shopping path. That lives in [`../prava-pay/`](../prava-pay/)
for future live MCP rails (EU cards).

**Public repository:** https://github.com/John-CEO-HQ/prava-rnd

## Quick start (standalone)

```bash
cd prava-sdk
npm install
npm test
npm run demo
```

With a real sandbox key:

```bash
export PRAVA_SECRET_KEY=sk_test_...
export PRAVA_API_URL=https://sandbox.api.prava.space
npm start
```

Then POST JSON-RPC to `http://127.0.0.1:8792/mcp` with
`Authorization: Bearer demo` and `X-Prava-Client-Id: demo-user`.

## Docs

- [docs/SETUP.md](docs/SETUP.md) - dashboard keys, test cards, hosted demo
- [docs/SANDBOX.md](docs/SANDBOX.md) - sandbox hosts vs MCP live rails
- [docs/JUDGE-TESTING.md](docs/JUDGE-TESTING.md) - judge offline vs real checkout

`npm run demo` is offline/mocked only. Submission-grade demos need a real
hosted checkout with `sk_test_*` and a visible order id (`npm run smoke`).
