import type { Metadata } from "next";
import { CartPage } from "@/components/cart-page";

export const metadata: Metadata = {
  title: "Cart",
  // A cart is per-visitor and holds nothing worth ranking, so it stays out of
  // the index — same treatment as /account and /checkout.
  robots: { index: false, follow: true },
};

export default function Page() {
  return <CartPage />;
}
