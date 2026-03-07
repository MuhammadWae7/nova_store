import { unstable_cache } from "next/cache";
import { productService } from "./product-service";
import { Product } from "@/features/product/types";

function mapApiProductToFrontend(api: any): Product {
  return {
    id: api.id,
    name: api.name,
    slug: api.slug,
    description: api.description,
    price: { amount: api.price, currency: api.currency as "EGP" },
    categoryId: api.categoryId,
    categoryName: api.category?.name,
    sectionName: api.category?.section?.name,
    gender: api.gender?.toLowerCase() as Product["gender"],
    isNewArrival: api.isNewArrival,
    variants: (api.variants || []).map((v: any) => ({
      id: v.id,
      color: v.color,
      images: v.images,
      sizes: (v.sizes || []).map((s: any) => ({
        size: s.size,
        stock: s.stock,
        sku: s.sku,
      })),
    })),
  };
}

export const cachedProductService = {
  getAll: unstable_cache(
    async (options?: {
      categoryId?: string;
      gender?: string;
      search?: string;
      page?: number;
      limit?: number;
    }) => {
      const result = await productService.getAll(options);
      return {
        products: result.products.map(mapApiProductToFrontend),
        pagination: result.pagination,
      };
    },
    ["products-all"],
    { tags: ["products"] },
  ),

  getBySlug: unstable_cache(
    async (slug: string) => {
      try {
        const result = await productService.getBySlug(slug);
        return mapApiProductToFrontend(result);
      } catch {
        return undefined;
      }
    },
    ["products-single"],
    { tags: ["products"] },
  ),

  /**
   * Lean listing query — minimal fields, first-image-only, no sizes.
   * Use this for storefront listing pages. Cached under the "products" tag
   * so revalidateTag("products") invalidates it on any product mutation.
   */
  getAllLean: unstable_cache(
    async (options?: {
      categoryId?: string;
      gender?: string;
      search?: string;
      page?: number;
      limit?: number;
    }) => {
      const result = await productService.getAllLean(options);
      return result; // already normalized inside getAllLean()
    },
    ["products-lean"],
    { tags: ["products"] },
  ),
};
