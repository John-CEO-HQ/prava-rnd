# Credentials and setup

## Product name

User-facing: **John CEO Pay**. Technical module folder: `prava-pay/`.

## MCP access (confirmed open)

Prava Pay **MCP is free to integrate** for anyone. Each John user enables it with a simple
**OAuth** link to Prava (our `/link/start` / `prava_link_status` flow). No special hackathon
gate or temporary "MCP production access" request is required for the MCP path.

Confirmed with Prava support (Jul 2026): MCP connector + per-user OAuth is the intended
coworker integration. The **SDK** path (embedded experience without a separate Prava
sign-in) is different and would need Prava production access and approval - **out of scope**
for John CEO Pay.

## Live rails (no MCP sandbox host)

Per Prava Builder Handbook: **MCP / CLI have no separate sandbox host**. Agent-linked MCP
payments use live payment rails. SDK/API sandbox (`sk_test_*`, test cards) is a different
path - see SANDBOX.md. Use tiny amounts and dashboard spend limits for demos.

Unit tests and `npm run demo` use **mocked** upstream only (not a real transaction).

## Required for live upstream

1. Prava Pay account at https://pay.prava.space (user OAuth-links from John)
2. Access token from MCP OAuth / linking an agent (stored per `clientId`)
3. Optional: card enrolled on the Prava Pay dashboard
4. Passkey approval on Prava's page for each charge

## Env vars

| Variable | Purpose |
|----------|---------|
| `PRAVA_MCP_UPSTREAM_URL` | Upstream MCP (default `https://mcp.pay.prava.space/mcp`) |
| `PRAVA_DEMO_ACCESS_TOKEN` | Shared access token for all clientIds (local smoke only) |
| `PRAVA_TOKEN_STORE_DIR` | Per-client token JSON directory |
| `PRAVA_PUBLIC_BASE_URL` | Base URL for `/link/start` links |
| `PORT` | Standalone listen port (default `8791`) |

## John CEO (in-process)

| Variable | Purpose |
|----------|---------|
| `PRAVA_PAY_ENABLED` | `true` to register MCP on VMs and mount route (default off) |
| `PRAVA_MCP_UPSTREAM_URL` | Same as above |
| `PRAVA_TOKEN_STORE_DIR` | Persist tokens on the dyno filesystem (or local `.prava-tokens`) |
| `PRAVA_PUBLIC_BASE_URL` | Usually `CONTROL_PLANE_BASE_URL` / public app URL |

Never commit access tokens. Add `.prava-tokens/` to gitignore.
