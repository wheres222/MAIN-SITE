import { notFound } from "next/navigation";
import { ProductDetailPage } from "@/components/product-detail-page";
import { getStorefrontData } from "@/lib/sellauth";

interface ProductPageProps {
  params: Promise<{ productId: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = await params;
  const parsedId = Number(productId);
  if (!Number.isFinite(parsedId)) {
    notFound();
  }

  const storefront = await getStorefrontData();
  const product = storefront.products.find((item) => item.id === parsedId);

  if (!product) {
    notFound();
  }

  return (
    <ProductDetailPage product={product} paymentMethods={storefront.paymentMethods} />
  );
}
