import type { FetchFn } from "./types.js";

export interface UpstreamRpcRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

export interface UpstreamCallOptions {
  upstreamUrl: string;
  accessToken: string;
  method: string;
  params?: Record<string, unknown>;
  fetchFn: FetchFn;
  id?: number | string;
}

/**
 * Call the upstream Prava MCP over Streamable HTTP JSON-RPC.
 * Returns the parsed JSON-RPC response body.
 */
export async function callUpstreamMcp(opts: UpstreamCallOptions): Promise<unknown> {
  const body: UpstreamRpcRequest = {
    jsonrpc: "2.0",
    id: opts.id ?? 1,
    method: opts.method,
    params: opts.params,
  };
  const res = await opts.fetchFn(opts.upstreamUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      authorization: `Bearer ${opts.accessToken}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`upstream_http_${res.status}: ${text.slice(0, 500)}`);
  }
  // Some MCP servers return SSE; try JSON first.
  try {
    return JSON.parse(text) as unknown;
  } catch {
    const dataLine = text
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.startsWith("data:"));
    if (dataLine) {
      return JSON.parse(dataLine.replace(/^data:\s?/, "")) as unknown;
    }
    throw new Error(`upstream_non_json: ${text.slice(0, 200)}`);
  }
}

export async function forwardToolCall(
  opts: Omit<UpstreamCallOptions, "method" | "params"> & {
    name: string;
    arguments: Record<string, unknown>;
  },
): Promise<unknown> {
  return callUpstreamMcp({
    ...opts,
    method: "tools/call",
    params: { name: opts.name, arguments: opts.arguments },
  });
}
