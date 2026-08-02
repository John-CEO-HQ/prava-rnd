/**
 * Live sandbox smoke: create a hosted session and print payment_url.
 * Requires PRAVA_SECRET_KEY=sk_test_...
 *
 * Usage:
 *   PRAVA_SECRET_KEY=sk_test_... npm run smoke
 *
 * Then open payment_url, enter test Visa, OTP 456789, passkey.
 * Poll with the printed session_id via MCP or curl payment-result.
 */
import { createHostedCheckout, getCheckoutStatus } from "../src/checkout.js";
import { MemorySessionStore } from "../src/store.js";
import { DEFAULT_PRAVA_API_URL } from "../src/types.js";

async function main() {
  const secretKey = process.env.PRAVA_SECRET_KEY;
  if (!secretKey) {
    // eslint-disable-next-line no-console
    console.error(
      "Set PRAVA_SECRET_KEY=sk_test_... (from https://dashboard.prava.space)",
    );
    process.exit(1);
  }

  const publicBaseUrl =
    process.env.PRAVA_PUBLIC_BASE_URL || "https://example.com/api/mcp/prava-sdk";
  const store = new MemorySessionStore();
  const config = {
    apiUrl: process.env.PRAVA_API_URL || DEFAULT_PRAVA_API_URL,
    secretKey,
    publicBaseUrl,
    mockMode: false,
  };

  // eslint-disable-next-line no-console
  console.log("Creating hosted sandbox session (demo headphones)...\n");
  const created = await createHostedCheckout(
    { store, config },
    { clientId: "smoke-local", productId: "1" },
  );
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(created, null, 2));
  // eslint-disable-next-line no-console
  console.log("\n1. Open payment_url in a browser");
  // eslint-disable-next-line no-console
  console.log("2. Card 4622 9431 2313 7789 / CVV 757 / exp 12/27 / OTP 456789");
  // eslint-disable-next-line no-console
  console.log("3. Approve with passkey, then press Enter here to poll status\n");

  if (process.stdin.isTTY) {
    await new Promise<void>((resolve) => {
      process.stdin.once("data", () => resolve());
    });
    const status = await getCheckoutStatus(
      { store, config },
      created.session_id,
    );
    // eslint-disable-next-line no-console
    console.log("\nStatus:", JSON.stringify(status, null, 2));
  } else {
    // eslint-disable-next-line no-console
    console.log(
      "(non-interactive) After paying, poll with prava_sdk_get_checkout_status",
    );
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
