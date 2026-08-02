# prava-pay

Prava Pay MCP broker for John CEO Pay (MIT).

- **Standalone:** `npm start` exposes an HTTP MCP server judges can point an agent at.
- **Optional host integration:** the same handler can mount in-process behind a feature
  flag in a host app (not required to run or demo this package).

**Public repository:** https://github.com/John-CEO-HQ/prava-rnd

## Quick start (standalone)

```bash
cd prava-pay
npm install
npm test
npm start
```

Set a demo user token (skips live OAuth for local smoke):

```bash
export PRAVA_DEMO_ACCESS_TOKEN=your_prava_oauth_access_token
export PRAVA_MCP_UPSTREAM_URL=https://mcp.pay.prava.space/mcp
```

Then POST JSON-RPC to `http://127.0.0.1:8791/mcp` with header
`Authorization: Bearer demo` and `X-Prava-Client-Id: demo-user`.

## Docs

- [docs/CREDENTIALS.md](docs/CREDENTIALS.md) - env vars; MCP is production-only (hackathon access window)
- [docs/SANDBOX.md](docs/SANDBOX.md) - SDK sandbox vs MCP prod; offline mock demo
- [docs/JUDGE-TESTING.md](docs/JUDGE-TESTING.md) - offline mock vs real checkout for judges

`npm run demo` is offline/mocked only. Submission-grade demos need a real `shop_checkout`
`order_id` (see [docs/JUDGE-TESTING.md](docs/JUDGE-TESTING.md)).

## Skill

See [skill/SKILL.md](skill/SKILL.md) for the John CEO Pay playbook.
