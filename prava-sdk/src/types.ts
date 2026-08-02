/** Shared types for prava-sdk. */

export const DEFAULT_PRAVA_API_URL = "https://sandbox.api.prava.space";
export const MCP_PROTOCOL_VERSION = "2024-11-05";

export type FetchFn = typeof fetch;

export interface PravaSdkConfig {
  /** Base URL for Prava REST API (default sandbox). */
  apiUrl: string;
  /** Secret key sk_test_* / sk_live_* — never leave the control plane. */
  secretKey: string;
  /** Base URL used to build callback_url (.../callback). */
  publicBaseUrl: string;
  /** Optional override for fetch (tests). */
  fetchFn?: FetchFn;
  /**
   * When true, skip real HTTP and use the injected fetchFn only.
   * Secret key may be empty in mock mode.
   */
  mockMode?: boolean;
}

export interface CreateSessionInput {
  userId: string;
  userEmail: string;
  totalAmount: string;
  currency: string;
  merchantName: string;
  merchantUrl: string;
  merchantCountry: string;
  products: Array<{
    description: string;
    unit_price: string;
    quantity: number;
  }>;
  callbackUrl: string;
  description?: string;
}

export interface CreateSessionResult {
  session_id: string;
  session_token: string;
  iframe_url: string;
  order_id: string;
  expires_at: string;
}

export type CheckoutSessionStatus =
  | "pending"
  | "awaiting_result"
  | "completed"
  | "failed"
  | "unknown";

export interface SessionRecord {
  sessionId: string;
  orderId: string;
  clientId: string;
  merchantName: string;
  totalAmount: string;
  currency: string;
  description: string;
  status: CheckoutSessionStatus;
  createdAt: number;
  completedAt?: number;
}
