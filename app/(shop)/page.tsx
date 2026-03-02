"use client";

import { useEffect, useState } from "react";
import { ContentService, HomePageData } from "@/services/content-service";
import { ProductService } from "@/services/product-service";
import { Product } from "@/features/product/types";
import { HeroSection } from "@/components/home/hero-section";
import { BrandMarquee } from "@/components/home/brand-marquee";
import { FeaturedCollection } from "@/components/home/featured-collection";

export default function Home() {
  const [content, setContent] = useState<HomePageData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [contentData, productsResult] = await Promise.all([
          ContentService.getHomePageData(),
          ProductService.getAll()
        ]);
        setContent(contentData);
        setProducts(productsResult.products);
      } catch (e) {
        console.error("Failed to load home data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading || !content) {
      return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <HeroSection data={content.hero} />

      {/* Marquee Banner */}
      <BrandMarquee data={content.marquee} />

      {/* Featured Collection */}
      <FeaturedCollection 
        data={content.featuredCollection} 
        products={products} 
      />

      {/* Spacer for Verification Visuals */}
      <div className="h-24 bg-neutral-900" />
    </main>
  );
}
