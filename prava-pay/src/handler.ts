import { PRAVA_TOOLS } from "./tools.js";
import { forwardToolCall } from "./prava-upstream.js";
import {
  buildLinkStatus,
  linkStartHtml,
  resolveAccessToken,
  saveAccessToken,
} from "./oauth.js";
import type { TokenStore } from "./store.js";
import { MCP_PROTOCOL_VERSION, type FetchFn, type PravaPayConfig } from "./types.js";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: number | string | null;
  method: string;
  params?: Record<string, unknown>;
}

export interface PravaPayMcpHandlerDeps {
  store: TokenStore;
  config: PravaPayConfig;
}

function rpcResult(id: number | string | null | undefined, result: unknown) {
  return { jsonrpc: "2.0" as const, id: id ?? null, result };
}

function rpcError(id: number | string | null | undefined, code: number, message: string) {
  return { jsonrpc: "2.0" as const, id: id ?? null, error: { code, message } };
}

function textContent(payload: unknown, isError = false) {
  return { content: [{ type: "text", text: JSON.stringify(payload) }], isError };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * Create a fetch-compatible MCP + link handler.
 * - POST /mcp (or any path ending in /mcp) with JSON-RPC — requires clientId
 * - GET /link/start?clientId=
 * - POST /link/token (JSON or form)
 */
export function createPravaPayMcpHandler(deps: PravaPayMcpHandlerDeps) {
  const fetchFn: FetchFn = deps.config.fetchFn ?? fetch;

  async function handleMcpRpc(clientId: string, body: JsonRpcRequest): Promise<Response> {
    const { id, method, params } = body;
    const isNotification = id === undefined || id === null;

    switch (method) {
      case "initialize": {
        const requested =
          typeof params?.protocolVersion === "string"
            ? params.protocolVersion
            : MCP_PROTOCOL_VERSION;
        return jsonResponse(
          rpcResult(id, {
            protocolVersion: requested,
            capabilities: { tools: {} },
            serverInfo: { name: "prava-pay", version: "0.1.0" },
          }),
        );
      }
      case "notifications/initialized":
        return new Response(null, { status: 202 });
      case "ping":
        return jsonResponse(rpcResult(id, {}));
      case "tools/list":
        return jsonResponse(rpcResult(id, { tools: PRAVA_TOOLS }));
      case "tools/call": {
        const name = String(params?.name ?? "");
        const args = (params?.arguments ?? {}) as Record<string, unknown>;
        const tool = PRAVA_TOOLS.find((t) => t.name === name);
        if (!tool) {
          return jsonResponse(rpcError(id, -32602, `unknown tool: ${name}`));
        }

        if (name === "prava_link_status") {
          const status = buildLinkStatus(
            deps.store,
            clientId,
            deps.config.publicBaseUrl,
            deps.config.demoAccessToken,
          );
          return jsonResponse(rpcResult(id, textContent(status)));
        }

        const accessToken = resolveAccessToken(
          deps.store,
          clientId,
          deps.config.demoAccessToken,
        );
        if (!accessToken) {
          const status = buildLinkStatus(
            deps.store,
            clientId,
            deps.config.publicBaseUrl,
            deps.config.demoAccessToken,
          );
          return jsonResponse(
            rpcResult(
              id,
              textContent(
                {
                  error: "prava_not_linked",
                  message:
                    "Prava Pay is not linked for this workspace. Ask the user to open the link URL and complete linking.",
                  linkUrl: status.linkUrl,
                },
                true,
              ),
            ),
          );
        }

        if (name === "ping") {
          try {
            const upstream = await forwardToolCall({
              upstreamUrl: deps.config.upstreamUrl,
              accessToken,
              name: "ping",
              arguments: {},
              fetchFn,
              id: id ?? 1,
            });
            return jsonResponse(rpcResult(id, extractToolResult(upstream)));
          } catch (e) {
            return jsonResponse(
              rpcResult(
                id,
                textContent(
                  {
                    pong: true,
                    broker: true,
                    upstream_error: e instanceof Error ? e.message : String(e),
                  },
                  false,
                ),
              ),
            );
          }
        }

        try {
          const upstream = await forwardToolCall({
            upstreamUrl: deps.config.upstreamUrl,
            accessToken,
            name,
            arguments: args,
            fetchFn,
            id: typeof id === "number" || typeof id === "string" ? id : 1,
          });
          return jsonResponse(rpcResult(id, extractToolResult(upstream)));
        } catch (e) {
          return jsonResponse(
            rpcResult(
              id,
              textContent(
                {
                  error: "upstream_failed",
                  message: e instanceof Error ? e.message : String(e),
                },
                true,
              ),
            ),
          );
        }
      }
      default:
        if (isNotification) return new Response(null, { status: 202 });
        return jsonResponse(rpcError(id, -32601, `method not found: ${method}`));
    }
  }

  return async function pravaPayHandler(
    req: Request,
    clientId: string,
  ): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path.endsWith("/link/start") && req.method === "GET") {
      const cid = url.searchParams.get("clientId") || clientId;
      return new Response(linkStartHtml(cid, deps.config.publicBaseUrl), {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (path.endsWith("/link/token") && req.method === "POST") {
      const ct = req.headers.get("content-type") ?? "";
      let cid = clientId;
      let accessToken = "";
      if (ct.includes("application/json")) {
        const body = (await req.json()) as { clientId?: string; accessToken?: string };
        cid = body.clientId || cid;
        accessToken = String(body.accessToken ?? "");
      } else {
        const form = await req.formData();
        cid = String(form.get("clientId") ?? cid);
        accessToken = String(form.get("accessToken") ?? "");
      }
      if (!cid || !accessToken) {
        return jsonResponse({ ok: false, error: "missing_client_or_token" }, 400);
      }
      saveAccessToken(deps.store, cid, accessToken);
      return new Response(
        `<!DOCTYPE html><html><body><p>Linked client <code>${cid}</code>. You can close this tab and return to Telegram.</p></body></html>`,
        { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
      );
    }

    if (req.method === "GET") {
      return jsonResponse({ ok: false, error: "sse_stream_not_supported" }, 405);
    }
    if (req.method === "DELETE") {
      return new Response(null, { status: 202 });
    }
    if (req.method !== "POST") {
      return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
    }

    let body: JsonRpcRequest;
    try {
      body = (await req.json()) as JsonRpcRequest;
    } catch {
      return jsonResponse(rpcError(null, -32700, "parse error"), 400);
    }
    return handleMcpRpc(clientId, body);
  };
}

function extractToolResult(upstream: unknown): unknown {
  if (!upstream || typeof upstream !== "object") {
    return textContent({ upstream }, true);
  }
  const u = upstream as {
    result?: unknown;
    error?: { message?: string; code?: number };
  };
  if (u.error) {
    return textContent(
      { error: "upstream_rpc_error", message: u.error.message ?? "error", code: u.error.code },
      true,
    );
  }
  if (u.result !== undefined) return u.result;
  return textContent({ upstream });
}

export type PravaPayMcpHandler = ReturnType<typeof createPravaPayMcpHandler>;
