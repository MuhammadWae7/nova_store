"use client";

import { useState, useEffect, useCallback } from "react";
import { ProductService } from "@/services/product-service";
import { TaxonomyService, Section } from "@/services/taxonomy-service";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Package,
} from "lucide-react";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  categoryId: string;
  category?: { name: string; section?: { name: string } };
  isActive: boolean;
  variants: Array<{
    id: string;
    images: string[];
    sizes: Array<{ stock: number }>;
  }>;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      const result = await ProductService.getAllAdmin();
      setProducts(result.products as unknown as Product[]);
    } catch (e) {
      console.error("Failed to load products", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    TaxonomyService.getAllSections()
      .then(setSections)
      .catch(() => setSections([]));
  }, [loadProducts]);

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    try {
      await ProductService.delete(id);
      await loadProducts();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filteredProducts = products.filter((product) => {
    // Search filter
    if (search && !product.name.toLowerCase().includes(search.toLowerCase())) return false;
    // Category filter
    if (filterCategoryId && product.categoryId !== filterCategoryId) return false;
    return true;
  });

  const getTotalStock = (product: Product) => {
    return product.variants.reduce(
      (total, variant) =>
        total + variant.sizes.reduce((sum, size) => sum + size.stock, 0),
      0
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-neutral-400">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-7 w-7 text-accent" />
          <h1 className="text-3xl font-bold text-white">المنتجات</h1>
        </div>
        <Link href="/admin/products/new">
          <Button variant="luxury" className="gap-2">
            <Plus className="h-4 w-4" /> إضافة منتج
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center rounded-lg border border-white/10 bg-neutral-900 p-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث عن منتج..."
            className="w-full rounded-md border border-white/10 bg-neutral-800 py-2 pr-10 pl-3 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-accent/50"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterCategoryId === null ? "luxury" : "outline"}
            size="sm"
            onClick={() => setFilterCategoryId(null)}
          >
            الكل
          </Button>
          {sections.map((section) =>
            (section.categories || []).map((cat) => (
              <Button
                key={cat.id}
                variant={filterCategoryId === cat.id ? "luxury" : "outline"}
                size="sm"
                onClick={() => setFilterCategoryId(cat.id)}
              >
                {cat.name}
              </Button>
            ))
          )}
        </div>
      </div>

      {/* Product Grid/Table */}
      <div className="rounded-lg border border-white/10 bg-neutral-900 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-right">
              <th className="px-4 py-3 text-xs font-medium text-neutral-400 uppercase">المنتج</th>
              <th className="px-4 py-3 text-xs font-medium text-neutral-400 uppercase hidden sm:table-cell">التصنيف</th>
              <th className="px-4 py-3 text-xs font-medium text-neutral-400 uppercase hidden md:table-cell">السعر</th>
              <th className="px-4 py-3 text-xs font-medium text-neutral-400 uppercase hidden md:table-cell">المخزون</th>
              <th className="px-4 py-3 text-xs font-medium text-neutral-400 uppercase">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {product.variants[0]?.images[0] ? (
                      <Image
                        src={product.variants[0].images[0]}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-md object-cover bg-neutral-800"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-neutral-800 flex items-center justify-center">
                        <Package className="h-5 w-5 text-neutral-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white text-sm">{product.name}</p>
                      <p className="text-xs text-neutral-500">{product.variants.length} ألوان</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <div>
                    <span className="text-sm text-neutral-300">{product.category?.name || "-"}</span>
                    {product.category?.section?.name && (
                      <span className="text-xs text-neutral-500 block">{product.category.section.name}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-sm text-white">{product.price} ج.م</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className={`text-sm ${getTotalStock(product) === 0 ? "text-red-400" : "text-green-400"}`}>
                    {getTotalStock(product)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Link href={`/products/${product.slug}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-3.5 w-3.5 text-blue-400" />
                      </Button>
                    </Link>
                    <Link href={`/admin/products/${product.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-3.5 w-3.5 text-accent" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-red-500/10"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-neutral-500">
                  {search ? "لا توجد نتائج" : "لا توجد منتجات"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-neutral-500 text-center">
        إجمالي {filteredProducts.length} من {products.length} منتج
      </p>
    </div>
  );
}
