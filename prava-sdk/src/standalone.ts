import { createServer } from "node:http";
import { createPravaSdkMcpHandler } from "./handler.js";
import { FileSessionStore } from "./store.js";
import { configFromEnv } from "./config.js";

const config = configFromEnv();
const store = new FileSessionStore(
  process.env.PRAVA_SDK_SESSION_DIR || ".prava-sdk-sessions",
);
const handler = createPravaSdkMcpHandler({ store, config });

const port = Number(process.env.PORT ?? "8792");

const server = createServer(async (req, res) => {
  try {
    const host = req.headers.host ?? `127.0.0.1:${port}`;
    const url = new URL(req.url ?? "/", `http://${host}`);
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const bodyBuf = Buffer.concat(chunks);
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (v == null) continue;
      if (Array.isArray(v)) v.forEach((x) => headers.append(k, x));
      else headers.set(k, v);
    }
    const request = new Request(url, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method ?? "GET") ? undefined : bodyBuf,
    });

    const clientId =
      headers.get("x-prava-client-id") ??
      url.searchParams.get("clientId") ??
      "standalone";

    const isCallback = url.pathname.endsWith("/callback");
    if (!isCallback) {
      const auth = headers.get("authorization") ?? "";
      const bearer = auth.match(/^Bearer\s+(\S+)$/i)?.[1];
      if (!bearer) {
        res.writeHead(401, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "unauthorized" }));
        return;
      }
    }

    const response = await handler(request, clientId);
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    const ab = await response.arrayBuffer();
    res.end(Buffer.from(ab));
  } catch (e) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        error: "internal",
        message: e instanceof Error ? e.message : String(e),
      }),
    );
  }
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`prava-sdk listening on http://127.0.0.1:${port}`);
  // eslint-disable-next-line no-console
  console.log(`  MCP:      POST /mcp  (Authorization: Bearer <token>, X-Prava-Client-Id: <id>)`);
  // eslint-disable-next-line no-console
  console.log(`  Callback: GET  /callback?pending=...&clientId=...`);
  // eslint-disable-next-line no-console
  console.log(`  Mode:     ${config.mockMode ? "mock (no PRAVA_SECRET_KEY)" : "live API"}`);
});
