import {
  createSession,
  getPaymentResult,
  reportStatus,
  redactCredentials,
  PravaApiError,
} from "./prava-api.js";
import type { SessionStore } from "./store.js";
import type { PravaSdkConfig, SessionRecord } from "./types.js";
import { findDemoProduct } from "./demo-catalog.js";

export interface CreateCheckoutArgs {
  clientId: string;
  /** Demo catalog id or 1-based index. Mutually exclusive with typed bill fields. */
  productId?: string;
  merchantName?: string;
  merchantUrl?: string;
  merchantCountry?: string;
  totalAmount?: string;
  currency?: string;
  description?: string;
  userEmail?: string;
}

export interface CreateCheckoutResult {
  session_id: string;
  order_id: string;
  payment_url: string;
  expires_at: string;
  merchant_name: string;
  total_amount: string;
  currency: string;
  description: string;
  message: string;
}

function ensureHttpsUrl(url: string, field: string): string {
  if (!/^https:\/\//i.test(url)) {
    throw new Error(`${field} must be an https URL`);
  }
  return url;
}

function defaultMerchantUrl(merchantName: string): string {
  const slug = merchantName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `https://${slug || "merchant"}.example.com`;
}

/**
 * Create a hosted checkout session.
 * callback_url uses a pre-allocated pending id so the browser return can resolve
 * the session before Prava echoes session_id.
 */
export async function createHostedCheckout(
  deps: { store: SessionStore; config: PravaSdkConfig },
  args: CreateCheckoutArgs,
): Promise<CreateCheckoutResult> {
  const { store, config } = deps;
  const fetchFn = config.fetchFn ?? fetch;

  let merchantName: string;
  let merchantUrl: string;
  let merchantCountry: string;
  let totalAmount: string;
  let currency: string;
  let description: string;

  if (args.productId) {
    const product = findDemoProduct(args.productId);
    if (!product) {
      throw new Error(`unknown demo product: ${args.productId}`);
    }
    merchantName = product.merchantName;
    merchantUrl = product.merchantUrl;
    merchantCountry = product.merchantCountry;
    totalAmount = product.unitPrice;
    currency = product.currency;
    description = product.description;
  } else {
    if (!args.merchantName || !args.totalAmount) {
      throw new Error(
        "Provide productId (demo catalog) or merchantName + totalAmount (typed bill)",
      );
    }
    merchantName = args.merchantName;
    totalAmount = args.totalAmount;
    currency = (args.currency || "USD").toUpperCase();
    description = args.description || "Payment";
    merchantCountry = (args.merchantCountry || "US").toUpperCase();
    merchantUrl = args.merchantUrl
      ? ensureHttpsUrl(args.merchantUrl, "merchantUrl")
      : defaultMerchantUrl(merchantName);
  }

  const userId = args.clientId;
  const userEmail =
    args.userEmail ||
    `${args.clientId.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 40) || "user"}@johnceo.local`;

  const pendingId = `pend_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const callbackBase = config.publicBaseUrl.replace(/\/$/, "");
  const callbackUrl = `${callbackBase}/callback?clientId=${encodeURIComponent(args.clientId)}&pending=${encodeURIComponent(pendingId)}`;

  if (!config.mockMode && !config.secretKey) {
    throw new Error("PRAVA_SECRET_KEY is required");
  }

  let session: Awaited<ReturnType<typeof createSession>>;
  if (config.mockMode) {
    session = {
      session_id: `ses_mock_${pendingId}`,
      session_token: "mock_token",
      iframe_url: `https://sandbox.collect.prava.space/?session=mock&pending=${pendingId}`,
      order_id: `ord_mock_${pendingId}`,
      expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
    };
  } else {
    session = await createSession(
      config.apiUrl,
      config.secretKey,
      {
        userId,
        userEmail,
        totalAmount,
        currency,
        merchantName,
        merchantUrl,
        merchantCountry,
        products: [
          {
            description,
            unit_price: totalAmount,
            quantity: 1,
          },
        ],
        callbackUrl,
        description,
      },
      fetchFn,
    );
  }

  if (!session.session_id || !session.iframe_url) {
    throw new Error("Prava create session returned incomplete payload");
  }

  const record: SessionRecord = {
    sessionId: session.session_id,
    orderId: session.order_id,
    clientId: args.clientId,
    merchantName,
    totalAmount,
    currency,
    description,
    status: "pending",
    createdAt: Date.now(),
  };
  store.set(record);
  // Alias pending id -> same record for callback lookup
  store.set({ ...record, sessionId: pendingId });

  return {
    session_id: session.session_id,
    order_id: session.order_id,
    payment_url: session.iframe_url,
    expires_at: session.expires_at,
    merchant_name: merchantName,
    total_amount: totalAmount,
    currency,
    description,
    message:
      "Send payment_url to the user. They approve on Prava hosted page (card + passkey). Then call prava_sdk_get_checkout_status.",
  };
}

export interface CheckoutStatusResult {
  session_id: string;
  order_id: string;
  status: string;
  merchant_name?: string;
  total_amount?: string;
  currency?: string;
  description?: string;
  message: string;
}

export async function getCheckoutStatus(
  deps: { store: SessionStore; config: PravaSdkConfig },
  sessionId: string,
): Promise<CheckoutStatusResult> {
  const { store, config } = deps;
  const fetchFn = config.fetchFn ?? fetch;
  const local = store.get(sessionId);

  if (local?.status === "completed") {
    return {
      session_id: local.sessionId.startsWith("pend_")
        ? sessionId
        : local.sessionId,
      order_id: local.orderId,
      status: "completed",
      merchant_name: local.merchantName,
      total_amount: local.totalAmount,
      currency: local.currency,
      description: local.description,
      message: "Payment completed.",
    };
  }

  // Resolve pending alias to real session id if needed
  let realSessionId = sessionId;
  if (local && local.sessionId === sessionId && sessionId.startsWith("pend_")) {
    // Find sibling real session for same order
    const siblings = store.listByClient(local.clientId);
    const real = siblings.find(
      (s) => s.orderId === local.orderId && !s.sessionId.startsWith("pend_"),
    );
    if (real) realSessionId = real.sessionId;
  } else if (local) {
    realSessionId = local.sessionId.startsWith("pend_")
      ? sessionId
      : local.sessionId;
  }

  if (config.mockMode) {
    const rec = local ?? {
      sessionId: realSessionId,
      orderId: `ord_${realSessionId}`,
      clientId: "unknown",
      merchantName: "Demo",
      totalAmount: "0",
      currency: "USD",
      description: "Demo",
      status: "completed" as const,
      createdAt: Date.now(),
      completedAt: Date.now(),
    };
    const completed: SessionRecord = {
      ...rec,
      sessionId: realSessionId,
      status: "completed",
      completedAt: Date.now(),
    };
    store.set(completed);
    return {
      session_id: realSessionId,
      order_id: completed.orderId,
      status: "completed",
      merchant_name: completed.merchantName,
      total_amount: completed.totalAmount,
      currency: completed.currency,
      description: completed.description,
      message: "Payment completed (mock).",
    };
  }

  const result = await getPaymentResult(
    config.apiUrl,
    config.secretKey,
    realSessionId,
    fetchFn,
  );

  if (result.status === "pending") {
    return {
      session_id: realSessionId,
      order_id: result.order_id || local?.orderId || "",
      status: "pending",
      merchant_name: local?.merchantName,
      total_amount: local?.totalAmount,
      currency: local?.currency,
      description: local?.description,
      message: "Waiting for the user to complete payment on the hosted page.",
    };
  }

  if (result.status === "awaiting_result") {
    const line =
      result.transactions?.[0]?.line_items?.find((li) => li.txn_ref_id) ??
      result.transactions?.[0]?.line_items?.[0];
    const txnRefId = line?.txn_ref_id;
    if (!txnRefId) {
      return {
        session_id: realSessionId,
        order_id: result.order_id || local?.orderId || "",
        status: "awaiting_result",
        message:
          "Credentials ready but txn_ref_id missing; retry get_checkout_status shortly.",
      };
    }
    // Simulated merchant capture (hackathon): never return token/cvv to the agent.
    void redactCredentials(result);
    await reportStatus(
      config.apiUrl,
      config.secretKey,
      realSessionId,
      txnRefId,
      "APPROVED",
      fetchFn,
    );
    const after = await getPaymentResult(
      config.apiUrl,
      config.secretKey,
      realSessionId,
      fetchFn,
    );
    const finalStatus = after.status === "completed" ? "completed" : after.status;
    if (local) {
      store.set({
        ...local,
        sessionId: realSessionId,
        orderId: after.order_id || local.orderId,
        status: finalStatus === "completed" ? "completed" : local.status,
        completedAt: finalStatus === "completed" ? Date.now() : undefined,
      });
    }
    return {
      session_id: realSessionId,
      order_id: after.order_id || local?.orderId || "",
      status: finalStatus,
      merchant_name: local?.merchantName,
      total_amount: local?.totalAmount,
      currency: local?.currency,
      description: local?.description,
      message:
        finalStatus === "completed"
          ? "Payment completed."
          : `Payment status: ${finalStatus}`,
    };
  }

  if (result.status === "completed" || result.status === "failed") {
    if (local) {
      store.set({
        ...local,
        sessionId: realSessionId,
        orderId: result.order_id || local.orderId,
        status: result.status,
        completedAt: Date.now(),
      });
    }
    return {
      session_id: realSessionId,
      order_id: result.order_id || local?.orderId || "",
      status: result.status,
      merchant_name: local?.merchantName,
      total_amount: local?.totalAmount,
      currency: local?.currency,
      description: local?.description,
      message:
        result.status === "completed"
          ? "Payment completed."
          : "Payment failed.",
    };
  }

  return {
    session_id: realSessionId,
    order_id: result.order_id || local?.orderId || "",
    status: result.status,
    message: `Unexpected status: ${result.status}`,
  };
}

export async function completeCheckoutFromCallback(
  deps: { store: SessionStore; config: PravaSdkConfig },
  opts: { sessionId?: string; pendingId?: string; clientId?: string },
): Promise<CheckoutStatusResult> {
  const { store } = deps;
  let sessionId = opts.sessionId;
  if (!sessionId && opts.pendingId) {
    const pend = store.get(opts.pendingId);
    if (pend) {
      const siblings = store.listByClient(pend.clientId);
      const real = siblings.find(
        (s) => s.orderId === pend.orderId && !s.sessionId.startsWith("pend_"),
      );
      sessionId = real?.sessionId ?? opts.pendingId;
    } else {
      sessionId = opts.pendingId;
    }
  }
  if (!sessionId && opts.clientId) {
    const list = store
      .listByClient(opts.clientId)
      .filter((s) => !s.sessionId.startsWith("pend_"))
      .sort((a, b) => b.createdAt - a.createdAt);
    sessionId = list[0]?.sessionId;
  }
  if (!sessionId) {
    throw new Error("missing session_id for callback");
  }
  try {
    return await getCheckoutStatus(deps, sessionId);
  } catch (e) {
    if (e instanceof PravaApiError) {
      return {
        session_id: sessionId,
        order_id: "",
        status: "unknown",
        message: e.message,
      };
    }
    throw e;
  }
}

export function callbackHtml(result: CheckoutStatusResult): string {
  const ok = result.status === "completed";
  const title = ok ? "Payment received" : "Payment update";
  const body = ok
    ? `Payment completed. Order id: <code>${escapeHtml(result.order_id)}</code>. You can close this tab and return to Telegram.`
    : `Status: <code>${escapeHtml(result.status)}</code>. ${escapeHtml(result.message)} Return to Telegram; John will confirm.`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 32rem; margin: 3rem auto; padding: 0 1rem; color: #111; }
    code { background: #f4f4f5; padding: 0.1em 0.35em; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>${body}</p>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
