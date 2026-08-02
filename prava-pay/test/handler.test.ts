import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createPravaPayMcpHandler } from "../src/handler.js";
import { MemoryTokenStore } from "../src/store.js";
import { DEFAULT_PRAVA_MCP_UPSTREAM_URL } from "../src/types.js";
import { saveAccessToken } from "../src/oauth.js";

function makeHandler(fetchFn?: typeof fetch) {
  const store = new MemoryTokenStore();
  const handler = createPravaPayMcpHandler({
    store,
    config: {
      upstreamUrl: DEFAULT_PRAVA_MCP_UPSTREAM_URL,
      tokenStoreDir: "/tmp/prava-test",
      publicBaseUrl: "http://127.0.0.1:8791",
      fetchFn,
    },
  });
  return { store, handler };
}

describe("createPravaPayMcpHandler", () => {
  it("lists tools including buy-flow and link status", async () => {
    const { handler } = makeHandler();
    const res = await handler(
      new Request("http://127.0.0.1/mcp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/list",
        }),
      }),
      "user-1",
    );
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      result: { tools: Array<{ name: string }> };
    };
    const names = body.result.tools.map((t) => t.name);
    assert.ok(names.includes("shop_search"));
    assert.ok(names.includes("create_payment_session"));
    assert.ok(names.includes("shop_checkout"));
    assert.ok(names.includes("prava_link_status"));
  });

  it("returns not_linked for shop tools without token", async () => {
    const { handler } = makeHandler();
    const res = await handler(
      new Request("http://127.0.0.1/mcp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: { name: "shop_search", arguments: { query: "mouse" } },
        }),
      }),
      "user-1",
    );
    const body = (await res.json()) as {
      result: { isError?: boolean; content: Array<{ text: string }> };
    };
    assert.equal(body.result.isError, true);
    const payload = JSON.parse(body.result.content[0]!.text) as {
      error: string;
      linkUrl: string;
    };
    assert.equal(payload.error, "prava_not_linked");
    assert.ok(payload.linkUrl.includes("/link/start"));
  });

  it("forwards tools/call to mocked upstream when linked", async () => {
    let sawAuth = "";
    const fetchFn: typeof fetch = async (_url, init) => {
      const headers = init?.headers as Record<string, string> | undefined;
      sawAuth = String(headers?.authorization ?? "");
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 3,
          result: {
            content: [{ type: "text", text: '{"products":[{"id":"p1"}]}' }],
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };
    const { store, handler } = makeHandler(fetchFn);
    saveAccessToken(store, "user-1", "tok_test");

    const res = await handler(
      new Request("http://127.0.0.1/mcp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 3,
          method: "tools/call",
          params: { name: "shop_search", arguments: { query: "mouse" } },
        }),
      }),
      "user-1",
    );
    assert.equal(res.status, 200);
    assert.ok(sawAuth.includes("tok_test"));
    const body = (await res.json()) as {
      result: { content: Array<{ text: string }> };
    };
    assert.ok(body.result.content[0]!.text.includes("products"));
  });

  it("prava_link_status reports linked after save", async () => {
    const { store, handler } = makeHandler();
    saveAccessToken(store, "user-1", "tok");
    const res = await handler(
      new Request("http://127.0.0.1/mcp", {
        method: "POST",
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 4,
          method: "tools/call",
          params: { name: "prava_link_status", arguments: {} },
        }),
      }),
      "user-1",
    );
    const body = (await res.json()) as {
      result: { content: Array<{ text: string }> };
    };
    const payload = JSON.parse(body.result.content[0]!.text) as { linked: boolean };
    assert.equal(payload.linked, true);
  });
});
