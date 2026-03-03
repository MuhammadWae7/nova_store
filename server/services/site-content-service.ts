import { prisma } from "@/server/db/client";
import { unstable_cache } from "next/cache";

export interface HeroData {
  title: string;
  subtitle: string;
  backgroundImage: string;
}

export interface MarqueeData {
  text: string[];
}

export interface SectionData {
  title: string;
  description: string;
}

export interface HomePageData {
  hero: HeroData;
  marquee: MarqueeData;
  featuredCollection: SectionData;
  newArrivals: SectionData;
}

const DEFAULT_CONTENT: HomePageData = {
  hero: {
    title: "NOVA FASHION",
    subtitle: "فخامة المطلق. أناقة الحضور.",
    backgroundImage:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=2400&auto=format&fit=crop",
  },
  marquee: {
    text: [
      "NOVA FASHION",
      "فخامة",
      "MODERN LUXURY",
      "أناقة",
      "STREETWEAR",
      "تميز",
      "EXCLUSIVE",
      "جودة",
    ],
  },
  featuredCollection: {
    title: "إصدارات حصرية",
    description: "تصاميم فريدة تجسد جوهر الأناقة العصرية.",
  },
  newArrivals: {
    title: "وصل حديثاً",
    description: "اكتشف أحدث صيحات الموضة لهذا الموسم.",
  },
};

export const siteContentService = {
  getHomePageData: unstable_cache(
    async (): Promise<HomePageData> => {
      try {
        const content = await prisma.siteContent.findMany();
        const result: Record<string, any> = {};
        for (const item of content) {
          result[item.key] = item.value;
        }

        if (Object.keys(result).length === 0) return DEFAULT_CONTENT;

        return {
          hero: (result.home_hero as HeroData) || DEFAULT_CONTENT.hero,
          marquee:
            (result.home_marquee as MarqueeData) || DEFAULT_CONTENT.marquee,
          featuredCollection:
            (result.home_featured as SectionData) ||
            DEFAULT_CONTENT.featuredCollection,
          newArrivals:
            (result.home_new_arrivals as SectionData) ||
            DEFAULT_CONTENT.newArrivals,
        };
      } catch {
        return DEFAULT_CONTENT;
      }
    },
    ["site-content", "homepage-data"],
    { tags: ["content"] },
  ),
};
