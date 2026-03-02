"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/product/product-card";
import { ProductService } from "@/services/product-service";
import { Product } from "@/features/product/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      const data = await ProductService.getAll();
      setProducts(data.products);
      setLoading(false);
    };
    loadProducts();
  }, []);

  if (loading) {
      return (
          <Container className="py-16">
              <div className="h-12 w-48 bg-neutral-900 rounded mb-12 animate-pulse"></div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {[1,2,3,4].map(i => (
                      <div key={i} className="aspect-[3/4] bg-neutral-900 rounded-sm animate-pulse"></div>
                  ))}
              </div>
          </Container>
      );
  }

  return (
    <Container className="py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-bold uppercase tracking-tighter text-white">
          All Products
        </h1>
        <p className="mt-4 text-muted-foreground">
          Explore our latest collection of premium streetwear.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </Container>
  );
}
