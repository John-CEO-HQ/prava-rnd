# Sandbox vs MCP

## Official sandbox (this module)

- API: `https://sandbox.api.prava.space`
- Collect: `sandbox.collect.prava.space`
- Keys: `sk_test_*` / `pk_test_*`
- Flow: create session (hosted) -> user opens iframe_url -> poll payment-result -> report status

## Prava Pay MCP (`prava-pay/`)

MCP (`mcp.pay.prava.space`) has **no separate sandbox host**. Agent-linked MCP
payments use live rails and need a US/SG/HK issued card today. Keep that module
for when Europe is supported; do not point it at the SDK sandbox.

| Path | Host | Hackathon demo |
|------|------|----------------|
| `prava-sdk/` | sandbox REST | Yes (test cards) |
| `prava-pay/` | live MCP | Blocked without regional card |
