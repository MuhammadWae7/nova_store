"use client";

import { SectionData, ContentService } from "@/services/content-service";
import { Product } from "@/features/product/types";
import { ProductService } from "@/services/product-service";
import { ProductCard } from "@/components/product/product-card";
import { StaggerContainer, FadeIn } from "@/components/ui/motion-wrapper";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

interface FeaturedCollectionProps {
  data: SectionData;
  products: Product[];
}

export function FeaturedCollection({ data: initialData, products: initialProducts }: FeaturedCollectionProps) {
  const [data, setData] = useState(initialData);
  const [products, setProducts] = useState(initialProducts);

  useEffect(() => {
    const update = async () => {
      const fullContent = await ContentService.getHomePageData();
      const fullProducts = await ProductService.getAll();
      setData(fullContent.featuredCollection);
      setProducts(fullProducts.products);
    };
    
    update(); // Fetch on mount

    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);
  return (
    <section className="bg-neutral-900 py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <FadeIn>
              <h2 className="font-heading text-4xl font-bold uppercase tracking-tight text-white md:text-6xl">
                {data.title}
              </h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p className="mt-4 text-lg text-neutral-400">
                {data.description}
              </p>
            </FadeIn>
          </div>
          
          <FadeIn delay={0.2}>
            <Link href="/products">
              <Button variant="outline" className="group border-white/20 text-white hover:bg-white hover:text-black">
                عرض الكل
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </FadeIn>
        </div>

        {/* Asymmetric Grid */}
        <StaggerContainer className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4 lg:grid-rows-2">
          {products.slice(0, 5).map((product, index) => ( // Show 5 items in a custom layout
            <div 
              key={product.id}
              className={`
                relative group overflow-hidden rounded-md bg-neutral-800
                ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''} // First item is Featured Large
                ${index === 1 ? 'md:col-span-1' : ''}
                ${index === 2 ? 'md:col-span-1' : ''}
                ${index === 3 ? 'md:col-span-1' : ''} // Wide item if desired
              `}
            >
              <ProductCard product={product} /> 
            </div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
