/**
 * Offline mocked hosted-checkout demo (no network).
 * Shows the tool order for John CEO Pay via prava-sdk.
 */
import { createPravaSdkMcpHandler } from "../src/handler.js";
import { MemorySessionStore } from "../src/store.js";

async function rpc(
  handler: ReturnType<typeof createPravaSdkMcpHandler>,
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

function parseToolText(rpcBody: unknown): unknown {
  const body = rpcBody as {
    result?: { content?: Array<{ text?: string }> };
  };
  const text = body.result?.content?.[0]?.text;
  if (!text) return rpcBody;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function main() {
  const store = new MemorySessionStore();
  const handler = createPravaSdkMcpHandler({
    store,
    config: {
      apiUrl: "https://sandbox.api.prava.space",
      secretKey: "",
      publicBaseUrl: "http://127.0.0.1:8792",
      mockMode: true,
    },
  });

  // eslint-disable-next-line no-console
  console.log("=== John CEO Pay offline mocked hosted checkout (not a real payment) ===\n");

  const listed = await rpc(handler, "demo", "tools/call", {
    name: "prava_sdk_list_demo_products",
    arguments: {},
  });
  // eslint-disable-next-line no-console
  console.log("Catalog:", JSON.stringify(parseToolText(listed), null, 2));

  const created = await rpc(handler, "demo", "tools/call", {
    name: "prava_sdk_create_checkout",
    arguments: { product_id: "1" },
  });
  const createdPayload = parseToolText(created) as {
    session_id: string;
    payment_url: string;
    order_id: string;
  };
  // eslint-disable-next-line no-console
  console.log("\nCreated:", JSON.stringify(createdPayload, null, 2));
  // eslint-disable-next-line no-console
  console.log("\nUser opens payment_url and approves with test card + Face ID...\n");

  const status = await rpc(handler, "demo", "tools/call", {
    name: "prava_sdk_get_checkout_status",
    arguments: { session_id: createdPayload.session_id },
  });
  // eslint-disable-next-line no-console
  console.log(
    "Tool order: prava_sdk_list_demo_products -> prava_sdk_create_checkout -> prava_sdk_get_checkout_status",
  );
  // eslint-disable-next-line no-console
  console.log("Status:", JSON.stringify(parseToolText(status), null, 2));
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
