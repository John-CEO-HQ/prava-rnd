import type { TokenStore } from "./store.js";
import type { TokenRecord } from "./types.js";

export interface LinkStatus {
  linked: boolean;
  linkUrl: string;
  linkedAt?: string;
}

/**
 * OAuth for Prava Pay MCP normally uses dynamic client registration in the MCP client.
 * For our broker, operators can:
 * 1. Set PRAVA_DEMO_ACCESS_TOKEN (shared) for local smoke, or
 * 2. POST /link/token with { clientId, accessToken } after completing Prava Pay connect
 *    in a browser (manual paste for hackathon), or
 * 3. Hit /link/start which returns instructions + a one-time paste endpoint.
 *
 * Full browser OAuth redirect against mcp.pay.prava.space can be added when Prava
 * documents a stable authorize URL for brokers; until then manual token paste works.
 */
export function buildLinkStatus(
  store: TokenStore,
  clientId: string,
  publicBaseUrl: string,
  demoAccessToken?: string,
): LinkStatus {
  const existing = store.get(clientId);
  if (existing?.accessToken) {
    return { linked: true, linkUrl: "", linkedAt: existing.linkedAt };
  }
  if (demoAccessToken) {
    return {
      linked: true,
      linkUrl: "",
      linkedAt: "demo-env",
    };
  }
  const base = publicBaseUrl.replace(/\/$/, "");
  // John mounts at /api/mcp/prava/:clientId/link/start; standalone uses ?clientId=.
  const linkUrl = base.includes("/mcp/prava")
    ? `${base}/${encodeURIComponent(clientId)}/link/start`
    : `${base}/link/start?clientId=${encodeURIComponent(clientId)}`;
  return {
    linked: false,
    linkUrl,
  };
}

export function resolveAccessToken(
  store: TokenStore,
  clientId: string,
  demoAccessToken?: string,
): string | null {
  const existing = store.get(clientId);
  if (existing?.accessToken) return existing.accessToken;
  if (demoAccessToken) return demoAccessToken;
  return null;
}

export function saveAccessToken(
  store: TokenStore,
  clientId: string,
  accessToken: string,
  refreshToken?: string,
): TokenRecord {
  const record: TokenRecord = {
    accessToken,
    refreshToken,
    linkedAt: new Date().toISOString(),
  };
  store.set(clientId, record);
  return record;
}

export function linkStartHtml(clientId: string, publicBaseUrl: string): string {
  const base = publicBaseUrl.replace(/\/$/, "");
  const pasteUrl = base.includes("/mcp/prava")
    ? `${base}/${encodeURIComponent(clientId)}/link/token`
    : `${base}/link/token`;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><title>Link Prava Pay</title></head>
<body style="font-family:system-ui;max-width:40rem;margin:2rem auto;padding:0 1rem">
  <h1>Link Prava Pay</h1>
  <p>Client: <code>${escapeHtml(clientId)}</code></p>
  <ol>
    <li>Open <a href="https://pay.prava.space" target="_blank" rel="noopener">pay.prava.space</a> and sign in.</li>
    <li>Connect an agent (platform <code>hermes</code>, name John CEO) or complete MCP OAuth in a client that can show you the access token.</li>
    <li>Paste the access token below. It stays on this server only; the agent never sees it.</li>
  </ol>
  <form method="POST" action="${escapeHtml(pasteUrl)}">
    <input type="hidden" name="clientId" value="${escapeHtml(clientId)}" />
    <label>Access token<br/><textarea name="accessToken" rows="4" cols="60" required></textarea></label>
    <p><button type="submit">Save link</button></p>
  </form>
  <p>Sandbox test cards (SDK/API path): see module docs/SANDBOX.md. Prava Pay MCP may require live cards.</p>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
