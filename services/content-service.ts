import { apiFetch } from "@/lib/api-client";

/**
 * Frontend Content Service — calls the real API instead of localStorage.
 */

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

const API_BASE = "/api";

// Default content used as fallback
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

export const ContentService = {
  /**
   * Get homepage content from API, with fallback to defaults.
   */
  getHomePageData: async (): Promise<HomePageData> => {
    try {
      const res = await apiFetch<{ data: any }>(`${API_BASE}/content`);
      const data = res?.data;
      if (!data) return DEFAULT_CONTENT;

      return {
        hero: (data.home_hero as HeroData) || DEFAULT_CONTENT.hero,
        marquee: (data.home_marquee as MarqueeData) || DEFAULT_CONTENT.marquee,
        featuredCollection:
          (data.home_featured as SectionData) || DEFAULT_CONTENT.featuredCollection,
        newArrivals:
          (data.home_new_arrivals as SectionData) || DEFAULT_CONTENT.newArrivals,
      };
    } catch {
      return DEFAULT_CONTENT;
    }
  },

  /**
   * Save homepage content via admin API.
   */
  saveHomePageData: async (data: HomePageData): Promise<void> => {
    const contentMap = {
      home_hero: data.hero,
      home_marquee: data.marquee,
      home_featured: data.featuredCollection,
      home_new_arrivals: data.newArrivals,
    };

    for (const [key, value] of Object.entries(contentMap)) {
      await apiFetch(`${API_BASE}/admin/content`, {
        method: "PUT",
        body: JSON.stringify({ key, value }),
        context: "admin",
      });
    }
  },
};
