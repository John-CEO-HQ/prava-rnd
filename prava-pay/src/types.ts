/** Default Prava Pay MCP upstream (live). Override with PRAVA_MCP_UPSTREAM_URL for sandbox if/when available. */
export const DEFAULT_PRAVA_MCP_UPSTREAM_URL = "https://mcp.pay.prava.space/mcp";

export const MCP_PROTOCOL_VERSION = "2025-03-26";

export interface PravaPayConfig {
  /** Upstream Prava MCP URL. */
  upstreamUrl: string;
  /** Optional shared demo access token (all clientIds) for local smoke. */
  demoAccessToken?: string;
  /** Directory for per-client token JSON files. */
  tokenStoreDir: string;
  /** Public base URL for OAuth link helpers (standalone or John). */
  publicBaseUrl: string;
  /** Fetch implementation (injectable for tests). */
  fetchFn?: typeof fetch;
}

export interface TokenRecord {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  linkedAt: string;
}

export type FetchFn = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;
