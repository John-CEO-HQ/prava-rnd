# AGENTS.md - prava-pay

## What this is

`prava-pay` is a self-contained Prava Pay MCP broker for John CEO Pay.
It proxies agent MCP tool calls to Prava Pay (`mcp.pay.prava.space`) after the user
links their Prava Pay account. Card data never reaches the agent.

Hackathon context: Agentic Commerce (Prava). Demonstrable standalone under the MIT
license. A host app may optionally mount the same handler in-process.

**Public repository:** https://github.com/John-CEO-HQ/prava-rnd

## Isolation contract

1. **No outward dependencies on a host monorepo.** Nothing in this folder may import
   from parent paths. No `../` imports that escape this folder.
2. **Self-contained tooling.** `npm install` + scripts in `package.json` must work
   from this folder alone.
3. **No secrets in git.** Tokens and keys are env vars / local store only.

A host **may** import this module (one-way). This module must never import the host.

## Commands

```bash
npm install
npm test
npm run typecheck
npm start          # standalone HTTP MCP on PORT (default 8791)
npm run demo       # offline mocked buy-flow demo
```

## Conventions

- TypeScript, ESM, NodeNext: relative imports use explicit `.js` extensions.
- ASCII-only in source and docs.
