/** Tool schemas for the prava-sdk MCP facade (not upstream Prava MCP shopping tools). */

export const PRAVA_SDK_TOOLS = [
  {
    name: "prava_sdk_list_demo_products",
    description:
      "List the hardcoded John CEO Pay demo catalog (hackathon). Use when the user asks what they can buy or to pick a demo product.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "prava_sdk_create_checkout",
    description:
      "Create a hosted Prava payment session after the user confirmed merchant + total in chat. Pass productId from the demo catalog, OR merchantName + totalAmount for a typed bill. Returns payment_url for the user to open (card + passkey on Prava; never ask for card details in chat).",
    inputSchema: {
      type: "object",
      properties: {
        product_id: {
          type: "string",
          description: "Demo catalog id or 1-based index (e.g. demo_headphones or 1)",
        },
        merchant_name: {
          type: "string",
          description: "Merchant name for a typed bill (required if no product_id)",
        },
        merchant_url: {
          type: "string",
          description: "Optional https merchant URL; a placeholder is used if omitted",
        },
        merchant_country: {
          type: "string",
          description: "ISO 3166-1 alpha-2 country (default US)",
        },
        total_amount: {
          type: "string",
          description: 'Decimal amount string e.g. "20.00" (required if no product_id)',
        },
        currency: {
          type: "string",
          description: "ISO 4217 currency (default USD)",
        },
        description: {
          type: "string",
          description: "Short description / invoice label",
        },
        user_email: {
          type: "string",
          description: "Optional payer email for the Prava session",
        },
      },
    },
  },
  {
    name: "prava_sdk_get_checkout_status",
    description:
      "Poll a hosted checkout session after the user opened payment_url. When payment credentials are ready, completes the sandbox loop and returns completed + order_id. Never returns card numbers.",
    inputSchema: {
      type: "object",
      properties: {
        session_id: {
          type: "string",
          description: "session_id from prava_sdk_create_checkout",
        },
      },
      required: ["session_id"],
    },
  },
] as const;

export type PravaSdkToolName = (typeof PRAVA_SDK_TOOLS)[number]["name"];
