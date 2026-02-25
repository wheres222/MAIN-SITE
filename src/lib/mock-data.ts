import {
  bannersToCategories,
  bannersToGroups,
  createExampleProductsForBanner,
  getLocalCategoryBanners,
} from "@/lib/local-banners";
import type { StorefrontData } from "@/types/sellauth";

const localBanners = getLocalCategoryBanners(14);

const generatedCatalog = {
  groups: bannersToGroups(localBanners),
  categories: bannersToCategories(localBanners),
  products: localBanners.flatMap((banner, index) =>
    createExampleProductsForBanner(banner, index)
  ),
};

export const mockStorefrontData: StorefrontData = {
  success: true,
  provider: "mock",
  message:
    "SellAuth is not configured yet. Showing demo catalog with full UI behavior.",
  products: generatedCatalog.products,
  groups: generatedCatalog.groups,
  categories: generatedCatalog.categories,
  paymentMethods: [
    { id: "crypto", name: "Crypto", enabled: true },
    { id: "paypal", name: "PayPal", enabled: true },
    { id: "card", name: "Card", enabled: true },
  ],
  warnings: [
    "Add SELLAUTH_SHOP_ID and SELLAUTH_API_KEY in .env.local to switch from demo mode to live dashboard data.",
  ],
  fetchedAt: new Date().toISOString(),
};
