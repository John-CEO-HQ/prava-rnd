import type { FetchFn } from "./types.js";
import type {
  CreateSessionInput,
  CreateSessionResult,
  CheckoutSessionStatus,
} from "./types.js";

export class PravaApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = "PravaApiError";
  }
}

function authHeaders(secretKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/json",
  };
}

export async function createSession(
  apiUrl: string,
  secretKey: string,
  input: CreateSessionInput,
  fetchFn: FetchFn = fetch,
): Promise<CreateSessionResult> {
  const base = apiUrl.replace(/\/$/, "");
  const res = await fetchFn(`${base}/v1/sessions`, {
    method: "POST",
    headers: authHeaders(secretKey),
    body: JSON.stringify({
      user_id: input.userId,
      user_email: input.userEmail,
      total_amount: input.totalAmount,
      currency: input.currency,
      integration_type: "full_checkout",
      callback_url: input.callbackUrl,
      ...(input.description ? { description: input.description } : {}),
      purchase_context: [
        {
          merchant_details: {
            name: input.merchantName,
            url: input.merchantUrl,
            country_code_iso2: input.merchantCountry,
          },
          product_details: input.products,
        },
      ],
    }),
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new PravaApiError(
      `create session failed: ${res.status}`,
      res.status,
      body,
    );
  }
  return {
    session_id: String(body.session_id ?? ""),
    session_token: String(body.session_token ?? ""),
    iframe_url: String(body.iframe_url ?? ""),
    order_id: String(body.order_id ?? ""),
    expires_at: String(body.expires_at ?? ""),
  };
}

export interface PaymentResultLineItem {
  txn_ref_id?: string;
  token?: string;
  dynamic_cvv?: string;
  status?: string;
  merchant_name?: string;
  total_amount?: string;
}

export interface PaymentResult {
  session_id: string;
  order_id: string;
  status: CheckoutSessionStatus;
  transactions?: Array<{
    status?: string;
    line_items?: PaymentResultLineItem[];
  }>;
  raw: unknown;
}

function normalizeStatus(s: unknown): CheckoutSessionStatus {
  const v = String(s ?? "").toLowerCase();
  if (v === "pending") return "pending";
  if (v === "awaiting_result") return "awaiting_result";
  if (v === "completed") return "completed";
  if (v === "failed") return "failed";
  return "unknown";
}

export async function getPaymentResult(
  apiUrl: string,
  secretKey: string,
  sessionId: string,
  fetchFn: FetchFn = fetch,
): Promise<PaymentResult> {
  const base = apiUrl.replace(/\/$/, "");
  const res = await fetchFn(
    `${base}/v1/sessions/${encodeURIComponent(sessionId)}/payment-result`,
    { headers: authHeaders(secretKey) },
  );
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new PravaApiError(
      `payment-result failed: ${res.status}`,
      res.status,
      body,
    );
  }
  return {
    session_id: String(body.session_id ?? sessionId),
    order_id: String(body.order_id ?? ""),
    status: normalizeStatus(body.status),
    transactions: body.transactions as PaymentResult["transactions"],
    raw: body,
  };
}

export async function reportStatus(
  apiUrl: string,
  secretKey: string,
  sessionId: string,
  txnRefId: string,
  txnStatus: "APPROVED" | "DECLINED",
  fetchFn: FetchFn = fetch,
): Promise<void> {
  const base = apiUrl.replace(/\/$/, "");
  const res = await fetchFn(
    `${base}/v1/sessions/${encodeURIComponent(sessionId)}/report-status`,
    {
      method: "POST",
      headers: authHeaders(secretKey),
      body: JSON.stringify({
        txn_ref_id: txnRefId,
        txn_status: txnStatus,
      }),
    },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new PravaApiError(
      `report-status failed: ${res.status}`,
      res.status,
      body,
    );
  }
}

/** Strip one-time card credentials from any object before logging or returning to agents. */
export function redactCredentials<T>(value: T): T {
  if (value == null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((v) => redactCredentials(v)) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (
      k === "token" ||
      k === "dynamic_cvv" ||
      k === "session_token" ||
      k === "cardNumber" ||
      k === "cvv"
    ) {
      out[k] = "[redacted]";
      continue;
    }
    out[k] = redactCredentials(v);
  }
  return out as T;
}
