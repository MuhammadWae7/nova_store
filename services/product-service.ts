/**
 * Frontend Product Service — calls the real API.
 * Updated for dynamic categories (categoryId FK instead of enum).
 * Added CSRF headers (SEC-04) and pagination support (MISS-03).
 */

import { Product } from "@/features/product/types";
import { apiFetch } from "@/lib/api-client";

const API_BASE = "/api";

export const ProductService = {
  /**
   * Get all active products (public storefront).
   * MISS-03: Now supports pagination and search.
   */
  getAll: async (filters?: {
    categoryId?: string;
    gender?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ products: Product[]; pagination?: PaginationInfo }> => {
    const params = new URLSearchParams();
    if (filters?.categoryId) params.set("categoryId", filters.categoryId);
    if (filters?.gender) params.set("gender", filters.gender);
    if (filters?.search) params.set("search", filters.search);
    if (filters?.page) params.set("page", String(filters.page));
    if (filters?.limit) params.set("limit", String(filters.limit));

    const res = await apiFetch<{
      data: { products: ApiProduct[]; pagination: PaginationInfo };
    }>(`${API_BASE}/products?${params.toString()}`);
    const data = res?.data?.data;

    return {
      products: (data?.products || []).map(mapApiProductToFrontend),
      pagination: data?.pagination,
    };
  },

  /**
   * Get a single product by slug (public storefront).
   */
  getBySlug: async (slug: string): Promise<Product | undefined> => {
    try {
      const res = await apiFetch<{ data: ApiProduct }>(
        `${API_BASE}/products/${slug}`,
      );
      if (!res?.data?.data) return undefined;
      return mapApiProductToFrontend(res.data.data);
    } catch {
      return undefined;
    }
  },

  /**
   * Get related products by category.
   */
  getRelated: async (categoryId: string): Promise<Product[]> => {
    try {
      const res = await apiFetch<{ data: { products: ApiProduct[] } }>(
        `${API_BASE}/products?categoryId=${categoryId}`,
      );
      return (res?.data?.data?.products || []).map(mapApiProductToFrontend);
    } catch {
      return [];
    }
  },

  // ─── Admin Methods ────────────────────────────────

  /**
   * Get all products including inactive (admin).
   */
  getAllAdmin: async (
    page = 1,
    limit = 20,
  ): Promise<{ products: Product[]; pagination?: PaginationInfo }> => {
    const res = await apiFetch<{
      data: { products: ApiProduct[]; pagination: PaginationInfo };
    }>(`${API_BASE}/products/admin/all?page=${page}&limit=${limit}`, {
      context: "admin",
    });
    const data = res?.data?.data;
    return {
      products: (data?.products || []) as unknown as Product[],
      pagination: data?.pagination,
    };
  },

  /**
   * Get a single product by ID (admin — includes inactive).
   */
  getAdminById: async (id: string): Promise<Product | null> => {
    try {
      const res = await apiFetch<{ data: ApiProduct }>(
        `${API_BASE}/products/admin/${id}`,
        { context: "admin" },
      );
      if (!res?.data?.data) return null;
      return mapApiProductToFrontend(res.data.data);
    } catch {
      return null;
    }
  },

  /**
   * Save (create or update) a product.
   */
  save: async (product: Product): Promise<void> => {
    const payload = mapFrontendProductToApi(product);

    // Check if it's an existing product (has a cuid-like ID)
    const isExisting = product.id && product.id.length > 10;

    const url = isExisting
      ? `${API_BASE}/products/${product.id}`
      : `${API_BASE}/products`;

    await apiFetch(url, {
      method: isExisting ? "PUT" : "POST",
      body: JSON.stringify(payload),
      context: "admin",
    });
  },

  /**
   * Delete a product (soft-delete).
   */
  delete: async (id: string): Promise<void> => {
    await apiFetch(`${API_BASE}/products/${id}`, {
      method: "DELETE",
      context: "admin",
    });
  },

  /**
   * Decrement stock — handled server-side during order creation.
   * This is now a no-op on the frontend.
   */
  decrementStock: async (
    _productId: string,
    _variantId: string,
    _size: string,
    _quantity: number,
  ): Promise<void> => {
    // Stock decrement is now handled atomically on the server during order creation.
    // This method is kept for backward compatibility but does nothing.
  },
};

// ─── Types ───────────────────────────────────────────

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  categoryId: string;
  gender: string;
  isNewArrival: boolean;
  isActive: boolean;
  category?: {
    id: string;
    name: string;
    slug: string;
    section?: {
      id: string;
      name: string;
      slug: string;
    };
  };
  variants: Array<{
    id: string;
    color: string;
    images: string[];
    sortOrder: number;
    sizes: Array<{
      id: string;
      size: string;
      stock: number;
      sku: string;
    }>;
  }>;
}

function mapApiProductToFrontend(api: ApiProduct): Product {
  return {
    id: api.id,
    name: api.name,
    slug: api.slug,
    description: api.description,
    price: { amount: api.price, currency: api.currency as "EGP" },
    categoryId: api.categoryId,
    categoryName: api.category?.name,
    sectionName: api.category?.section?.name,
    gender: api.gender.toLowerCase() as Product["gender"],
    isNewArrival: api.isNewArrival,
    variants: api.variants.map((v) => ({
      id: v.id,
      color: v.color,
      images: v.images,
      sizes: v.sizes.map((s) => ({
        size: s.size,
        stock: s.stock,
        sku: s.sku,
      })),
    })),
  };
}

function mapFrontendProductToApi(product: Product) {
  return {
    name: product.name,
    description: product.description,
    price: product.price.amount,
    categoryId: product.categoryId,
    gender: (product.gender || "men").toUpperCase(),
    isNewArrival: product.isNewArrival || false,
    variants: product.variants.map((v, idx) => ({
      id: v.id,
      color: v.color,
      images: v.images,
      sizes: v.sizes.map((s) => ({
        id: (s as unknown as Record<string, unknown>).id, // Preserve size ID for partial updates
        size: s.size,
        stock: s.stock,
        sku: s.sku,
      })),
      sortOrder: idx,
    })),
  };
}
