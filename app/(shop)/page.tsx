/**
 * Homepage — Server Component.
 * Data is fetched directly from server-side services with Next.js caching.
 * No "use client", no useEffect, no loading flash. SSR + cache invalidation
 * via revalidateTag("products") / revalidateTag("content") work automatically.
 */
import { siteContentService } from "@/server/services/site-content-service";
import { cachedProductService } from "@/server/services/cached-product-service";
import { HeroSection } from "@/components/home/hero-section";
import { BrandMarquee } from "@/components/home/brand-marquee";
import { FeaturedCollection } from "@/components/home/featured-collection";

export default async function Home() {
  const [content, productsResult] = await Promise.all([
    siteContentService.getHomePageData(),
    cachedProductService.getAllLean({ limit: 8 }),
  ]);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <HeroSection data={content.hero} />

      {/* Marquee Banner */}
      <BrandMarquee data={content.marquee} />

      {/* Featured Collection */}
      <FeaturedCollection
        data={content.featuredCollection}
        products={productsResult.products}
      />

      {/* Spacer for Verification Visuals */}
      <div className="h-24 bg-neutral-900" />
    </main>
  );
}
