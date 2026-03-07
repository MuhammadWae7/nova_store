/**
 * Products Listing Page — Server Component.
 * Fetches product data directly from cachedProductService at render time.
 * No "use client", no useEffect, no loading flash. Filtering/pagination
 * can be driven by searchParams which are passed as RSC props.
 * Interactive filter UI can be a "use client" child component.
 */
import { cachedProductService } from "@/server/services/cached-product-service";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/product/product-card";

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    gender?: string;
    categoryId?: string;
    search?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  const { products, pagination } = await cachedProductService.getAllLean({
    page: params.page ? Number(params.page) : 1,
    limit: params.limit ? Number(params.limit) : 20,
    gender: params.gender,
    categoryId: params.categoryId,
    search: params.search,
  });

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

      {products.length === 0 ? (
        <p className="text-muted-foreground">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination hint — total pages available for implementing page navigation */}
      {pagination.totalPages > 1 && (
        <p className="mt-8 text-sm text-muted-foreground text-center">
          Page {pagination.page} of {pagination.totalPages}
        </p>
      )}
    </Container>
  );
}
