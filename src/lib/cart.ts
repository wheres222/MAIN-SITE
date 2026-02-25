import type { SellAuthProduct, SellAuthVariant } from "@/types/sellauth";

export type CartStatus = "undetected" | "updating" | "detected";

export interface StoredCartLine {
  lineId: string;
  productId: number;
  productName: string;
  image: string;
  quantity: number;
  variantId?: number;
  variantName?: string;
  unitPrice: number;
  currency: string;
  status: CartStatus;
}

export const CART_STORAGE_KEY = "marketplace_cart_v1";
const CART_CHANGE_EVENT = "marketplace:cart-change";
const EMPTY_CART_LINES: StoredCartLine[] = [];

let cachedCartRaw: string | null | undefined;
let cachedCartLines: StoredCartLine[] = EMPTY_CART_LINES;

export function lineId(productId: number, variantId?: number): string {
  return `${productId}:${variantId ?? 0}`;
}

export function variantsFor(product: SellAuthProduct): SellAuthVariant[] {
  if (product.variants.length > 0) return product.variants;
  return [
    {
      id: product.id * 1000,
      name: "Default",
      price: product.price ?? 0,
      stock: product.stock ?? 999,
    },
  ];
}

export function readCart(): StoredCartLine[] {
  if (typeof window === "undefined") return EMPTY_CART_LINES;
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (raw === cachedCartRaw) return cachedCartLines;

    if (!raw) {
      cachedCartRaw = raw;
      cachedCartLines = EMPTY_CART_LINES;
      return cachedCartLines;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      cachedCartRaw = raw;
      cachedCartLines = EMPTY_CART_LINES;
      return cachedCartLines;
    }

    cachedCartRaw = raw;
    cachedCartLines = parsed.map(normalizeLine);
    return cachedCartLines;
  } catch {
    cachedCartRaw = undefined;
    cachedCartLines = EMPTY_CART_LINES;
    return cachedCartLines;
  }
}

function normalizeLine(line: StoredCartLine): StoredCartLine {
  return {
    ...line,
    status: line.status || "undetected",
  };
}

export function writeCart(lines: StoredCartLine[]) {
  if (typeof window === "undefined") return;
  const normalizedLines = lines.map(normalizeLine);
  const raw = JSON.stringify(normalizedLines);
  window.localStorage.setItem(CART_STORAGE_KEY, raw);
  cachedCartRaw = raw;
  cachedCartLines = normalizedLines;
  window.dispatchEvent(new Event(CART_CHANGE_EVENT));
}

export function subscribeCart(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key === CART_STORAGE_KEY) onStoreChange();
  };
  const handleLocalChange = () => {
    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(CART_CHANGE_EVENT, handleLocalChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CART_CHANGE_EVENT, handleLocalChange);
  };
}
