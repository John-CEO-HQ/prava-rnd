import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_PRAVA_MCP_UPSTREAM_URL, type PravaPayConfig } from "./types.js";

export function configFromEnv(
  env: NodeJS.ProcessEnv = process.env,
  overrides: Partial<PravaPayConfig> = {},
): PravaPayConfig {
  const tokenStoreDir =
    overrides.tokenStoreDir ??
    env.PRAVA_TOKEN_STORE_DIR ??
    join(process.cwd(), ".prava-tokens");
  mkdirSync(tokenStoreDir, { recursive: true });
  return {
    upstreamUrl:
      overrides.upstreamUrl ??
      env.PRAVA_MCP_UPSTREAM_URL ??
      DEFAULT_PRAVA_MCP_UPSTREAM_URL,
    demoAccessToken: overrides.demoAccessToken ?? env.PRAVA_DEMO_ACCESS_TOKEN,
    tokenStoreDir,
    publicBaseUrl:
      overrides.publicBaseUrl ??
      env.PRAVA_PUBLIC_BASE_URL ??
      `http://127.0.0.1:${env.PORT ?? "8791"}`,
    fetchFn: overrides.fetchFn,
  };
}
