/** Tool schemas mirrored from https://docs.prava.space/mcp/tools (Prava Pay MCP). */

export const PRAVA_TOOLS = [
  {
    name: "ping",
    description: "Health probe for the Prava Pay connection.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_cards",
    description: "List saved cards (masked last4/brand only).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_agents",
    description: "List connected agents on this Prava Pay account.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "shop_search",
    description: "Search products across participating merchants.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        merchant: { type: "string" },
        cursor: { type: "string" },
      },
      required: ["query"],
    },
  },
  {
    name: "shop_product",
    description: "Get product variants and offers for a product_id from shop_search.",
    inputSchema: {
      type: "object",
      properties: {
        product_id: { type: "string" },
        merchant: { type: "string" },
      },
      required: ["product_id"],
    },
  },
  {
    name: "shop_list_addresses",
    description: "List masked delivery addresses on file.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "shop_add_address",
    description: "Add a delivery address (and optional contact phone).",
    inputSchema: {
      type: "object",
      properties: {
        first_name: { type: "string" },
        last_name: { type: "string" },
        street: { type: "string" },
        street2: { type: "string" },
        city: { type: "string" },
        region: { type: "string" },
        postal_code: { type: "string" },
        country: { type: "string" },
        label: { type: "string" },
        phone: { type: "string" },
        set_default: { type: "boolean" },
      },
      required: ["first_name", "last_name", "street", "city", "region", "postal_code", "country"],
    },
  },
  {
    name: "shop_set_default_address",
    description: "Set the default delivery address.",
    inputSchema: {
      type: "object",
      properties: { address_id: { type: "string" } },
      required: ["address_id"],
    },
  },
  {
    name: "shop_quote",
    description: "Lock a live price for a variant. Requires an address on file.",
    inputSchema: {
      type: "object",
      properties: {
        variant_id: { type: "string" },
        merchant: { type: "string" },
        quantity: { type: "number" },
        address_id: { type: "string" },
      },
      required: ["variant_id", "merchant"],
    },
  },
  {
    name: "create_payment_session",
    description:
      "Create a payment session and return payment_url for the user to approve with passkey. Charges nothing by itself.",
    inputSchema: {
      type: "object",
      properties: {
        total_amount: { type: "string" },
        currency: { type: "string" },
        merchant_name: { type: "string" },
        merchant_url: { type: "string" },
        merchant_country: { type: "string" },
        products: { type: "array" },
        idempotency_key: { type: "string" },
      },
      required: [
        "total_amount",
        "currency",
        "merchant_name",
        "merchant_url",
        "merchant_country",
        "products",
      ],
    },
  },
  {
    name: "get_payment_status",
    description: "Poll payment session status (pending/completed/failed). Never returns card credentials.",
    inputSchema: {
      type: "object",
      properties: { session_id: { type: "string" } },
      required: ["session_id"],
    },
  },
  {
    name: "shop_checkout",
    description:
      "Place the order for a prior quote using an approved payment session. Credentials stay server-side.",
    inputSchema: {
      type: "object",
      properties: {
        checkout_session_id: { type: "string" },
        payment_session_id: { type: "string" },
      },
      required: ["checkout_session_id", "payment_session_id"],
    },
  },
  {
    name: "prava_link_status",
    description:
      "John CEO helper: whether this workspace has a linked Prava Pay token, and the link URL if not.",
    inputSchema: { type: "object", properties: {} },
  },
] as const;

export type PravaToolName = (typeof PRAVA_TOOLS)[number]["name"];
