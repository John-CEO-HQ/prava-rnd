# AGENTS.md - prava-sdk

## What this is

`prava-sdk` is a self-contained Prava REST/API broker for John CEO Pay (hosted
checkout path). It creates sandbox (or later live) payment sessions via
`sandbox.api.prava.space`, returns a hosted `iframe_url` for passkey + card
approval, then polls and reports status. Card data never reaches the agent.

Hackathon context: Agentic Commerce (Prava). Demonstrable standalone under the MIT
license. A host app may optionally mount the same handler in-process.

This is **not** the Prava Pay MCP shopping path (`prava-pay/`). Keep that module
for future live MCP rails.

**Public repository:** https://github.com/John-CEO-HQ/prava-rnd

## Isolation contract

1. **No outward dependencies on a host monorepo.** Nothing in this folder may import
   from parent paths. No `../` imports that escape this folder.
2. **Self-contained tooling.** `npm install` + scripts in `package.json` must work
   from this folder alone.
3. **No secrets in git.** Secret keys (`sk_test_*` / `sk_live_*`) are env vars only.

A host **may** import this module (one-way). This module must never import the host.

## Commands

```bash
npm install
npm test
npm run typecheck
npm start          # standalone HTTP MCP on PORT (default 8792)
npm run demo       # offline mocked hosted-checkout demo
npm run smoke      # real sandbox checkout (needs PRAVA_SECRET_KEY)
```

## Conventions

- TypeScript, ESM, NodeNext: relative imports use explicit `.js` extensions.
- ASCII-only in source and docs.
