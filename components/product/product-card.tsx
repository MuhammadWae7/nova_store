"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "@/features/product/types";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { ProductService } from "@/services/product-service";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product: initialProduct }: ProductCardProps) {
  const [product, setProduct] = useState(initialProduct);

  // Real-time update logic
  useEffect(() => {
    // Only fetch if client-side
    const fetchFresh = async () => {
        const fresh = await ProductService.getBySlug(initialProduct.slug);
        if (fresh) setProduct(fresh);
    };

    // Initial fetch on mount
    fetchFresh();

    const handleStorage = () => fetchFresh();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [initialProduct.slug]);

  const mainImage = product.variants[0]?.images[0] || "/placeholder";
  
  return (
    <Link href={`/products/${product.slug}`} className="group relative block overflow-hidden rounded-sm bg-secondary/10">
      {/* Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-900">
         <Image 
           src={mainImage} 
           alt={product.name}
           fill
           className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
           sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
         />
         
         {product.isNewArrival && (
             <span className="absolute top-4 left-4 z-10 bg-accent px-2 py-1 text-[10px] uppercase font-bold tracking-widest text-primary">
                 New
             </span>
         )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-base font-medium text-white group-hover:text-accent transition-colors duration-300">
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-gray-400 font-light">
          {product.price.amount.toLocaleString()} {product.price.currency}
        </p>
      </div>
    </Link>
  );
}
