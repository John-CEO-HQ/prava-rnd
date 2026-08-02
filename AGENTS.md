# AGENTS.md - prava-rnd

## What this is

Public MIT mirror of the Prava Agentic Commerce hackathon modules for John CEO Pay:

- [`prava-sdk/`](prava-sdk/) - hosted REST/API sandbox broker (primary demo path)
- [`prava-pay/`](prava-pay/) - Prava Pay MCP broker (live rails; EU cards blocked today)

**Public repository:** https://github.com/John-CEO-HQ/prava-rnd

Developed in a private monorepo and re-copied here (rsync). Each package is
self-contained: `cd` into it and run `npm install` + package scripts.

## Isolation contract

1. **No outward dependencies** on any private monorepo.
2. **Self-contained tooling** per package (`package.json` + scripts).
3. **No secrets in git.** Keys and tokens are env vars / local store only.

## Commands

```bash
cd prava-sdk && npm install && npm test && npm run demo
cd prava-pay && npm install && npm test && npm run demo
```

See each package README and `docs/JUDGE-TESTING.md`.
