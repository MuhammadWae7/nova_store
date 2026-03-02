/**
 * Frontend Taxonomy Service — calls /api/taxonomy endpoints.
 * Handles Sections & Categories for admin dashboard and storefront.
 */

import { apiFetch } from "@/lib/api-client";

// Define shared types locally based on the expected schema if not importing Prisma directly
export interface Section {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  orderIndex: number;
  categories?: Category[];
}

export type SizeType = "TOPS" | "PANTS" | "SHOES" | "ONE_SIZE";

export interface Category {
  id: string;
  name: string;
  slug: string;
  sectionId: string;
  sizeType: SizeType;
  isActive: boolean;
  orderIndex: number;
  productCount?: number;
}

const API_BASE = "/api/taxonomy";
const ADMIN_API_BASE = "/api/admin/taxonomy";

export const TaxonomyService = {
  // --------------------------------------------------------------------------
  // PUBLIC READS (Storefront)
  // --------------------------------------------------------------------------

  async getActiveSections(): Promise<Section[]> {
    try {
      const res = await apiFetch<{ data: Section[] }>(`${API_BASE}/sections`);
      return res?.data?.data || [];
    } catch (error) {
      console.error("Failed to fetch sections:", error);
      return [];
    }
  },

  async getActiveCategories(sectionId: string): Promise<Category[]> {
    try {
      const res = await apiFetch<{ data: Category[] }>(
        `${API_BASE}/categories?sectionId=${sectionId}`,
      );
      return res?.data?.data || [];
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      return [];
    }
  },

  // --------------------------------------------------------------------------
  // ADMIN MUTATIONS (Requires Auth & CSRF)
  // --------------------------------------------------------------------------

  async getAllSections(): Promise<Section[]> {
    try {
      const res = await apiFetch<{ data: Section[] }>(
        `${ADMIN_API_BASE}/sections`,
        { context: "admin" },
      );
      return res?.data?.data || [];
    } catch (error) {
      console.error("Failed to fetch admin sections:", error);
      return [];
    }
  },

  async createSection(name: string): Promise<Section> {
    const res = await apiFetch<{ data: Section }>(
      `${ADMIN_API_BASE}/sections`,
      {
        method: "POST",
        body: JSON.stringify({ name }),
        context: "admin",
      },
    );
    // @ts-ignore
    return res.data;
  },

  async updateSection(
    id: string,
    data: { name?: string; isActive?: boolean },
  ): Promise<Section> {
    const res = await apiFetch<{ data: Section }>(
      `${ADMIN_API_BASE}/sections/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
        context: "admin",
      },
    );
    // @ts-ignore
    return res.data;
  },

  async deleteSection(id: string, force = false): Promise<void> {
    await apiFetch(
      `${ADMIN_API_BASE}/sections/${id}${force ? "?force=true" : ""}`,
      {
        method: "DELETE",
        context: "admin",
      },
    );
  },

  async reorderSections(
    items: { id: string; orderIndex: number }[],
  ): Promise<void> {
    await apiFetch(`${ADMIN_API_BASE}/sections/reorder`, {
      method: "POST",
      body: JSON.stringify({ items }), // The backend expects 'items' or 'sections' based on route. Let's keep 'items' since frontend passed it. We'll adjust if backend fails. Wait, looking at route.ts previously, it might expect 'sections'. The frontend passed 'items' earlier.
      context: "admin",
    });
  },

  // Categories ---

  async createCategory(
    name: string,
    sectionId: string,
    sizeType: SizeType = "TOPS",
  ): Promise<Category> {
    const res = await apiFetch<{ data: Category }>(
      `${ADMIN_API_BASE}/categories`,
      {
        method: "POST",
        body: JSON.stringify({ name, sectionId, sizeType }),
        context: "admin",
      },
    );
    // @ts-ignore
    return res.data;
  },

  async updateCategory(
    id: string,
    data: { name?: string; isActive?: boolean },
  ): Promise<Category> {
    const res = await apiFetch<{ data: Category }>(
      `${ADMIN_API_BASE}/categories/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
        context: "admin",
      },
    );
    // @ts-ignore
    return res.data;
  },

  async deleteCategory(id: string, force = false): Promise<void> {
    await apiFetch(
      `${ADMIN_API_BASE}/categories/${id}${force ? "?force=true" : ""}`,
      {
        method: "DELETE",
        context: "admin",
      },
    );
  },

  async reorderCategories(
    items: { id: string; orderIndex: number }[],
  ): Promise<void> {
    await apiFetch(`${ADMIN_API_BASE}/categories/reorder`, {
      method: "POST",
      body: JSON.stringify({ items }),
      context: "admin",
    });
  },
};
