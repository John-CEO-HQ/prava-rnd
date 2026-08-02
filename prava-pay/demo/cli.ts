/**
 * Offline mocked buy-flow demo (no network).
 * Shows the tool order judges should expect.
 */
import { createPravaPayMcpHandler } from "../src/handler.js";
import { MemoryTokenStore } from "../src/store.js";
import { saveAccessToken } from "../src/oauth.js";

async function rpc(
  handler: ReturnType<typeof createPravaPayMcpHandler>,
  clientId: string,
  method: string,
  params?: Record<string, unknown>,
  id = 1,
) {
  const res = await handler(
    new Request("http://127.0.0.1/mcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
    }),
    clientId,
  );
  return res.json();
}

async function main() {
  const store = new MemoryTokenStore();
  const calls: string[] = [];
  const fetchFn = async (_url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? "{}")) as {
      method: string;
      params?: { name?: string };
    };
    const tool = body.params?.name ?? body.method;
    calls.push(tool);
    if (tool === "shop_search") {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  products: [
                    {
                      product_id: "prod_1",
                      title: "Wireless mouse",
                      price_estimate: "29.99",
                      merchant: "example.com",
                    },
                  ],
                }),
              },
            ],
          },
        }),
      );
    }
    if (tool === "shop_quote") {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  checkout_session_id: "chk_1",
                  total: "32.10",
                  currency: "USD",
                }),
              },
            ],
          },
        }),
      );
    }
    if (tool === "create_payment_session") {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  session_id: "pay_1",
                  payment_url: "https://pay.prava.space/approve/demo",
                  expires_at: new Date(Date.now() + 900_000).toISOString(),
                }),
              },
            ],
          },
        }),
      );
    }
    if (tool === "get_payment_status") {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: {
            content: [{ type: "text", text: JSON.stringify({ status: "completed" }) }],
          },
        }),
      );
    }
    if (tool === "shop_checkout") {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  status: "paid",
                  order_id: "ord_demo_1",
                  amount: "32.10",
                }),
              },
            ],
          },
        }),
      );
    }
    return new Response(
      JSON.stringify({ jsonrpc: "2.0", id: 1, result: { content: [{ type: "text", text: "{}" }] } }),
    );
  };

  const handler = createPravaPayMcpHandler({
    store,
    config: {
      upstreamUrl: "https://mcp.pay.prava.space/mcp",
      tokenStoreDir: "/tmp/prava-demo",
      publicBaseUrl: "http://127.0.0.1:8791",
      fetchFn: fetchFn as unknown as typeof fetch,
    },
  });

  saveAccessToken(store, "demo", "fake_token");

  // eslint-disable-next-line no-console
  console.log("=== John CEO Pay offline mocked buy-flow (not a real payment) ===\n");

  await rpc(handler, "demo", "tools/call", {
    name: "shop_search",
    arguments: { query: "wireless mouse under 40" },
  });
  await rpc(handler, "demo", "tools/call", {
    name: "shop_quote",
    arguments: { variant_id: "var_1", merchant: "example.com" },
  });
  await rpc(handler, "demo", "tools/call", {
    name: "create_payment_session",
    arguments: {
      total_amount: "32.10",
      currency: "USD",
      merchant_name: "Example",
      merchant_url: "https://example.com",
      merchant_country: "US",
      products: [{ description: "Wireless mouse", unit_price: "32.10", quantity: 1 }],
    },
  });
  // eslint-disable-next-line no-console
  console.log("User opens payment_url and approves with Face ID / Touch ID...\n");
  await rpc(handler, "demo", "tools/call", {
    name: "get_payment_status",
    arguments: { session_id: "pay_1" },
  });
  const checkout = await rpc(handler, "demo", "tools/call", {
    name: "shop_checkout",
    arguments: { checkout_session_id: "chk_1", payment_session_id: "pay_1" },
  });

  // eslint-disable-next-line no-console
  console.log("Upstream tool order:", calls.join(" -> "));
  // eslint-disable-next-line no-console
  console.log("Checkout result:", JSON.stringify(checkout, null, 2));
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
