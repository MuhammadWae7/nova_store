import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductInfo } from "@/components/product/product-info";
import { cachedProductService } from "@/server/services/cached-product-service";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const product = await cachedProductService.getBySlug(resolvedParams.slug);

  if (!product) {
    return (
      <Container className="py-20 text-center">
        <h1 className="text-3xl font-bold mb-4 text-white">المنتج غير موجود</h1>
        <p className="text-muted-foreground">نأسف، لم يتم العثور على المنتج الذي تبحث عنه.</p>
      </Container>
    );
  }

  return (
    <Container className="py-12 md:py-20">
      <div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-2 lg:items-start lg:gap-x-16">
        {/* Gallery */}
        <div className="lg:sticky lg:top-24">
          <ProductGallery images={product.variants[0]?.images || []} />
        </div>

        {/* Info */}
        <div className="lg:max-w-xl">
          <ProductInfo product={product} />
        </div>
      </div>
      
      {/* Related Section Placeholder to make it engaging */}
      <div className="mt-24 border-t border-white/5 pt-12">
        <h2 className="text-2xl font-bold uppercase tracking-tight text-white mb-8">قد يعجبك أيضاً</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Mock Items or Empty State */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] bg-neutral-900/50 rounded-sm animate-pulse" />
          ))}
        </div>
      </div>
    </Container>
  );
}
