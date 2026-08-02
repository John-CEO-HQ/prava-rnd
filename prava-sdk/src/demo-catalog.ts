/** Hardcoded demo catalog for Telegram Conversation A (hackathon). */

export interface DemoProduct {
  id: string;
  title: string;
  merchantName: string;
  merchantUrl: string;
  merchantCountry: string;
  unitPrice: string;
  currency: string;
  description: string;
}

export const DEMO_CATALOG: readonly DemoProduct[] = [
  {
    id: "demo_headphones",
    title: "Wireless Headphones",
    merchantName: "Example Store",
    merchantUrl: "https://examplestore.com",
    merchantCountry: "US",
    unitPrice: "49.99",
    currency: "USD",
    description: "Wireless Headphones",
  },
  {
    id: "demo_lamp",
    title: "Desk Lamp",
    merchantName: "Home Goods Co",
    merchantUrl: "https://homegoodsco.example.com",
    merchantCountry: "US",
    unitPrice: "24.00",
    currency: "USD",
    description: "Desk Lamp",
  },
  {
    id: "demo_notebooks",
    title: "Notebook Pack",
    merchantName: "Office Mart",
    merchantUrl: "https://officemart.example.com",
    merchantCountry: "US",
    unitPrice: "12.50",
    currency: "USD",
    description: "Notebook Pack",
  },
] as const;

export function findDemoProduct(idOrIndex: string): DemoProduct | undefined {
  const byId = DEMO_CATALOG.find((p) => p.id === idOrIndex);
  if (byId) return byId;
  const n = Number(idOrIndex);
  if (Number.isInteger(n) && n >= 1 && n <= DEMO_CATALOG.length) {
    return DEMO_CATALOG[n - 1];
  }
  const lower = idOrIndex.toLowerCase();
  return DEMO_CATALOG.find((p) => p.title.toLowerCase() === lower);
}
