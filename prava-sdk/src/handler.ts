import { PRAVA_SDK_TOOLS } from "./tools.js";
import { DEMO_CATALOG } from "./demo-catalog.js";
import {
  createHostedCheckout,
  getCheckoutStatus,
  completeCheckoutFromCallback,
  callbackHtml,
} from "./checkout.js";
import type { SessionStore } from "./store.js";
import { MCP_PROTOCOL_VERSION, type PravaSdkConfig } from "./types.js";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: number | string | null;
  method: string;
  params?: Record<string, unknown>;
}

export interface PravaSdkMcpHandlerDeps {
  store: SessionStore;
  config: PravaSdkConfig;
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
 * Create a fetch-compatible MCP + callback handler.
 * - POST JSON-RPC on any path (except /callback)
 * - GET/POST /callback?session_id=&pending=&clientId=
 */
export function createPravaSdkMcpHandler(deps: PravaSdkMcpHandlerDeps) {
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
            serverInfo: { name: "prava-sdk", version: "0.1.0" },
          }),
        );
      }
      case "notifications/initialized":
        return new Response(null, { status: 202 });
      case "ping":
        return jsonResponse(rpcResult(id, {}));
      case "tools/list":
        return jsonResponse(rpcResult(id, { tools: PRAVA_SDK_TOOLS }));
      case "tools/call": {
        const name = String(params?.name ?? "");
        const args = (params?.arguments ?? {}) as Record<string, unknown>;
        const tool = PRAVA_SDK_TOOLS.find((t) => t.name === name);
        if (!tool) {
          return jsonResponse(rpcError(id, -32602, `unknown tool: ${name}`));
        }

        try {
          if (name === "prava_sdk_list_demo_products") {
            const products = DEMO_CATALOG.map((p, i) => ({
              index: i + 1,
              id: p.id,
              title: p.title,
              merchant: p.merchantName,
              price: p.unitPrice,
              currency: p.currency,
            }));
            return jsonResponse(rpcResult(id, textContent({ products })));
          }

          if (name === "prava_sdk_create_checkout") {
            const result = await createHostedCheckout(
              { store: deps.store, config: deps.config },
              {
                clientId,
                productId:
                  typeof args.product_id === "string" ? args.product_id : undefined,
                merchantName:
                  typeof args.merchant_name === "string"
                    ? args.merchant_name
                    : undefined,
                merchantUrl:
                  typeof args.merchant_url === "string"
                    ? args.merchant_url
                    : undefined,
                merchantCountry:
                  typeof args.merchant_country === "string"
                    ? args.merchant_country
                    : undefined,
                totalAmount:
                  typeof args.total_amount === "string"
                    ? args.total_amount
                    : undefined,
                currency:
                  typeof args.currency === "string" ? args.currency : undefined,
                description:
                  typeof args.description === "string"
                    ? args.description
                    : undefined,
                userEmail:
                  typeof args.user_email === "string" ? args.user_email : undefined,
              },
            );
            return jsonResponse(rpcResult(id, textContent(result)));
          }

          if (name === "prava_sdk_get_checkout_status") {
            const sessionId = String(args.session_id ?? "");
            if (!sessionId) {
              return jsonResponse(
                rpcResult(
                  id,
                  textContent({ error: "missing_session_id" }, true),
                ),
              );
            }
            const result = await getCheckoutStatus(
              { store: deps.store, config: deps.config },
              sessionId,
            );
            return jsonResponse(rpcResult(id, textContent(result)));
          }

          return jsonResponse(rpcError(id, -32602, `unhandled tool: ${name}`));
        } catch (e) {
          return jsonResponse(
            rpcResult(
              id,
              textContent(
                {
                  error: "tool_failed",
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

  return async function pravaSdkHandler(
    req: Request,
    clientId: string,
  ): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path.endsWith("/callback") && (req.method === "GET" || req.method === "POST")) {
      const sessionId = url.searchParams.get("session_id") ?? undefined;
      const pendingId = url.searchParams.get("pending") ?? undefined;
      const cid = url.searchParams.get("clientId") || clientId;
      try {
        const result = await completeCheckoutFromCallback(
          { store: deps.store, config: deps.config },
          { sessionId, pendingId, clientId: cid },
        );
        return new Response(callbackHtml(result), {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return new Response(callbackHtml({
          session_id: sessionId ?? "",
          order_id: "",
          status: "unknown",
          message: msg,
        }), {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
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

export type PravaSdkMcpHandler = ReturnType<typeof createPravaSdkMcpHandler>;
