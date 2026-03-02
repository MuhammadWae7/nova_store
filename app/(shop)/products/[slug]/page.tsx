"use client";

import { useEffect, useState, use } from "react";
import { notFound } from "next/navigation";
import { ProductService } from "@/services/product-service";
import { Product } from "@/features/product/types";
import { Container } from "@/components/ui/container";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductInfo } from "@/components/product/product-info";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const { slug } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const found = await ProductService.getBySlug(slug);
        if (found) {
          setProduct(found);
        }
      } catch (error) {
        console.error("Error loading product:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [slug]);

  if (loading) {
     return (
        <Container className="py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
                <div className="aspect-[3/4] bg-neutral-900 rounded-sm"></div>
                <div className="space-y-4">
                    <div className="h-12 w-3/4 bg-neutral-900 rounded-sm"></div>
                    <div className="h-8 w-1/4 bg-neutral-900 rounded-sm"></div>
                    <div className="h-64 bg-neutral-900 rounded-sm"></div>
                </div>
            </div>
        </Container>
     );
  }

  if (!product) {
    return (
        <Container className="py-20 text-center">
            <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
            <p className="text-muted-foreground">The product you are looking for does not exist.</p>
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
             {[1,2,3,4].map((i) => (
                 <div key={i} className="aspect-[3/4] bg-neutral-900/50 rounded-sm animate-pulse" />
             ))}
          </div>
      </div>
    </Container>
  );
}
