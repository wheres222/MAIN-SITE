"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  lineId as makeLineId,
  readCart,
  subscribeCart,
  writeCart,
  type StoredCartLine,
} from "@/lib/cart";

/**
 * The cart, built on the store that was already in src/lib/cart.ts.
 *
 * That module had readCart/writeCart/subscribeCart and a change event, but
 * nothing ever called them — only its variantsFor() helper was imported. So
 * the storage layer existed and the cart did not: clicking a plan on a product
 * page went straight to Stripe, with no way to buy two things at once.
 *
 * useSyncExternalStore rather than useState + an effect because localStorage is
 * shared across tabs. readCart() returns a cached reference when the raw string
 * is unchanged, which is exactly the identity guarantee the hook needs.
 */

export interface CartValue {
  lines: StoredCartLine[];
  /** Total units, not distinct lines — the header badge counts items. */
  count: number;
  /** Sum in USD. Display conversion happens at render, via preferences. */
  subtotalUsd: number;
  add: (line: Omit<StoredCartLine, "lineId">) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  /**
   * Adjust by a delta, resolved against the store rather than against a
   * rendered value. The stepper buttons use this: two fast clicks on "+" both
   * close over the same rendered quantity, so setQuantity(q + 1) twice lands
   * on q + 1, not q + 2.
   */
  changeQuantity: (lineId: string, delta: number) => void;
  remove: (lineId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const lines = useSyncExternalStore(
    subscribeCart,
    readCart,
    // Server snapshot. localStorage does not exist during SSR, so the cart
    // renders empty and fills in on hydration.
    () => [] as StoredCartLine[]
  );

  const add = useCallback((line: Omit<StoredCartLine, "lineId">) => {
    const id = makeLineId(line.productId, line.variantId);
    const current = readCart();
    const existing = current.find((l) => l.lineId === id);

    // Adding the same variant twice increments rather than duplicating —
    // two rows for one thing is a cart bug people notice immediately.
    const next = existing
      ? current.map((l) =>
          l.lineId === id ? { ...l, quantity: l.quantity + line.quantity } : l
        )
      : [...current, { ...line, lineId: id }];

    writeCart(next);
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    const q = Math.max(0, Math.floor(quantity));
    const current = readCart();
    // Dropping to zero removes the line, so the stepper doubles as a delete
    // without stranding a 0-quantity row that checkout would reject.
    writeCart(
      q === 0
        ? current.filter((l) => l.lineId !== id)
        : current.map((l) => (l.lineId === id ? { ...l, quantity: q } : l))
    );
  }, []);

  const changeQuantity = useCallback((id: string, delta: number) => {
    const current = readCart();
    const line = current.find((l) => l.lineId === id);
    if (!line) return;
    const q = Math.max(0, line.quantity + delta);
    writeCart(
      q === 0
        ? current.filter((l) => l.lineId !== id)
        : current.map((l) => (l.lineId === id ? { ...l, quantity: q } : l))
    );
  }, []);

  const remove = useCallback((id: string) => {
    writeCart(readCart().filter((l) => l.lineId !== id));
  }, []);

  const clear = useCallback(() => writeCart([]), []);

  const value = useMemo<CartValue>(() => {
    const count = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotalUsd = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    return { lines, count, subtotalUsd, add, setQuantity, changeQuantity, remove, clear };
  }, [lines, add, setQuantity, changeQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/**
 * Falls back to an inert empty cart outside the provider rather than throwing,
 * so a stray consumer degrades to "cart looks empty" instead of taking the
 * page down.
 */
export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (ctx) return ctx;
  return {
    lines: [],
    count: 0,
    subtotalUsd: 0,
    add: () => {},
    setQuantity: () => {},
    changeQuantity: () => {},
    remove: () => {},
    clear: () => {},
  };
}
