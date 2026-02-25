export interface SellAuthImage {
  id?: number | string;
  url?: string;
}

export interface SellAuthVariant {
  id: number;
  name: string;
  price: number | null;
  stock: number | null;
}

export interface SellAuthGroup {
  id: number;
  name: string;
  description: string;
  image: SellAuthImage | null;
}

export interface SellAuthCategory {
  id: number;
  name: string;
  description: string;
  image: SellAuthImage | null;
}

export interface SellAuthProduct {
  id: number;
  name: string;
  description: string;
  image: string;
  price: number | null;
  currency: string;
  stock: number | null;
  groupId: number | null;
  groupName: string;
  categoryId: number | null;
  categoryName: string;
  variants: SellAuthVariant[];
}

export interface SellAuthPaymentMethod {
  id: string;
  name: string;
  enabled: boolean;
}

export interface StorefrontData {
  success: boolean;
  provider: "sellauth" | "mock";
  message: string;
  products: SellAuthProduct[];
  groups: SellAuthGroup[];
  categories: SellAuthCategory[];
  paymentMethods: SellAuthPaymentMethod[];
  warnings: string[];
  fetchedAt: string;
}

export interface CheckoutLineItemInput {
  productId: number;
  quantity: number;
  variantId?: number;
}

export interface CheckoutRequestInput {
  email?: string;
  paymentMethod: string;
  couponCode?: string;
  items: CheckoutLineItemInput[];
}
