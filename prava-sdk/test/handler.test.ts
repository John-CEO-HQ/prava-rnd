import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createPravaSdkMcpHandler } from "../src/handler.js";
import { MemorySessionStore } from "../src/store.js";
import { findDemoProduct, DEMO_CATALOG } from "../src/demo-catalog.js";
import { redactCredentials } from "../src/prava-api.js";

function makeHandler(opts?: { fetchFn?: typeof fetch; mockMode?: boolean }) {
  const store = new MemorySessionStore();
  const handler = createPravaSdkMcpHandler({
    store,
    config: {
      apiUrl: "https://sandbox.api.prava.space",
      secretKey: opts?.mockMode === false ? "sk_test_x" : "",
      publicBaseUrl: "http://127.0.0.1:8792",
      fetchFn: opts?.fetchFn,
      mockMode: opts?.mockMode ?? true,
    },
  });
  return { store, handler };
}

async function callTool(
  handler: ReturnType<typeof createPravaSdkMcpHandler>,
  name: string,
  args: Record<string, unknown> = {},
  clientId = "user-1",
) {
  const res = await handler(
    new Request("http://127.0.0.1/mcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name, arguments: args },
      }),
    }),
    clientId,
  );
  const body = (await res.json()) as {
    result: { isError?: boolean; content: Array<{ text: string }> };
  };
  const payload = JSON.parse(body.result.content[0]!.text) as Record<string, unknown>;
  return { status: res.status, isError: body.result.isError === true, payload };
}

describe("demo catalog", () => {
  it("resolves by index and id", () => {
    assert.equal(findDemoProduct("1")?.id, DEMO_CATALOG[0]!.id);
    assert.equal(findDemoProduct("demo_lamp")?.title, "Desk Lamp");
  });
});

describe("redactCredentials", () => {
  it("masks token fields", () => {
    const out = redactCredentials({
      token: "4323",
      dynamic_cvv: "957",
      ok: true,
    });
    assert.equal(out.token, "[redacted]");
    assert.equal(out.dynamic_cvv, "[redacted]");
    assert.equal(out.ok, true);
  });
});

describe("createPravaSdkMcpHandler", () => {
  it("lists sdk tools", async () => {
    const { handler } = makeHandler();
    const res = await handler(
      new Request("http://127.0.0.1/mcp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
      }),
      "user-1",
    );
    const body = (await res.json()) as {
      result: { tools: Array<{ name: string }> };
    };
    const names = body.result.tools.map((t) => t.name);
    assert.ok(names.includes("prava_sdk_list_demo_products"));
    assert.ok(names.includes("prava_sdk_create_checkout"));
    assert.ok(names.includes("prava_sdk_get_checkout_status"));
  });

  it("lists demo products", async () => {
    const { handler } = makeHandler();
    const { payload, isError } = await callTool(
      handler,
      "prava_sdk_list_demo_products",
    );
    assert.equal(isError, false);
    const products = payload.products as unknown[];
    assert.equal(products.length, 3);
  });

  it("creates mock checkout from catalog and completes status", async () => {
    const { handler } = makeHandler({ mockMode: true });
    const created = await callTool(handler, "prava_sdk_create_checkout", {
      product_id: "1",
    });
    assert.equal(created.isError, false);
    assert.ok(String(created.payload.payment_url).includes("http"));
    assert.ok(created.payload.session_id);
    assert.ok(created.payload.order_id);

    const status = await callTool(handler, "prava_sdk_get_checkout_status", {
      session_id: created.payload.session_id,
    });
    assert.equal(status.isError, false);
    assert.equal(status.payload.status, "completed");
    assert.ok(status.payload.order_id);
  });

  it("creates typed bill checkout", async () => {
    const { handler } = makeHandler({ mockMode: true });
    const created = await callTool(handler, "prava_sdk_create_checkout", {
      merchant_name: "Acme Consulting",
      total_amount: "20.00",
      description: "July retainer",
    });
    assert.equal(created.isError, false);
    assert.equal(created.payload.merchant_name, "Acme Consulting");
    assert.equal(created.payload.total_amount, "20.00");
  });

  it("forwards create session to mocked API", async () => {
    let sawPath = "";
    const fetchFn: typeof fetch = async (url, init) => {
      sawPath = String(url);
      const body = JSON.parse(String(init?.body ?? "{}")) as {
        integration_type?: string;
        callback_url?: string;
      };
      assert.equal(body.integration_type, "full_checkout");
      assert.ok(body.callback_url?.includes("/callback"));
      return new Response(
        JSON.stringify({
          session_id: "ses_live_1",
          session_token: "tok",
          iframe_url: "https://sandbox.collect.prava.space/?s=1",
          order_id: "ord_live_1",
          expires_at: new Date(Date.now() + 900_000).toISOString(),
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };
    const { handler } = makeHandler({ fetchFn, mockMode: false });
    const created = await callTool(handler, "prava_sdk_create_checkout", {
      product_id: "demo_headphones",
    });
    assert.equal(created.isError, false);
    assert.equal(created.payload.session_id, "ses_live_1");
    assert.ok(sawPath.includes("/v1/sessions"));
  });

  it("serves callback HTML", async () => {
    const { handler } = makeHandler({ mockMode: true });
    const created = await callTool(handler, "prava_sdk_create_checkout", {
      product_id: "2",
    });
    const sessionId = String(created.payload.session_id);
    const res = await handler(
      new Request(
        `http://127.0.0.1/callback?session_id=${encodeURIComponent(sessionId)}&clientId=user-1`,
        { method: "GET" },
      ),
      "user-1",
    );
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes("Payment"));
    assert.ok(html.includes("Telegram"));
  });
});
