"use client";

/**
 * Product Info Component
 * PERF-05: Removed the useEffect fetch-on-mount (server data is fresh).
 * STR-01: Now passes `sku` and `color` to cart when adding items.
 */

import { Product, ProductVariant, ProductSize } from "@/features/product/types";
import { useCart } from "@/features/cart/context";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductInfoProps {
  product: Product;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const { addItem } = useCart();

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[0]?.id
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const selectedVariant = product.variants.find(
    (v) => v.id === selectedVariantId
  ) as ProductVariant;

  if (!selectedVariant) return null;

  const selectedSizeObj = selectedVariant.sizes.find(
    (s) => s.size === selectedSize
  );

  const currentSizeStock = selectedSizeObj?.stock;
  const isOutOfStock = currentSizeStock === 0;

  const handleAddToCart = () => {
    if (!selectedSize || isOutOfStock || !selectedSizeObj) return;

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      sku: selectedSizeObj.sku,  // STR-01: Pass real SKU to cart
      size: selectedSize,
      quantity: 1,
      productSnapshot: {
        name: product.name,
        price: product.price,
        images: selectedVariant.images,
        color: selectedVariant.color,  // Pass color for order display
      },
    });
  };

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-right duration-700">
      <div>
        <h1 className="text-3xl font-bold uppercase tracking-tight text-white md:text-5xl font-heading">
          {product.name}
        </h1>
        <div className="mt-4 flex items-center justify-between">
            <p className="text-2xl font-semibold text-accent">
              {product.price.amount.toLocaleString()} {product.price.currency}
            </p>
            {isOutOfStock && (
                <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-500">
                    نفذت الكمية
                </span>
            )}
        </div>
      </div>

      <div className="space-y-6 border-t border-white/5 pt-6">
        <div className="space-y-2">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground text-right">
              الألوان المتاحة
            </h3>
            <div className="flex flex-wrap justify-end gap-3">
              {product.variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => {
                    setSelectedVariantId(variant.id);
                    setSelectedSize(null);
                  }}
                  className={cn(
                    "relative h-10 w-10 rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background",
                    selectedVariantId === variant.id
                      ? "border-accent ring-2 ring-accent ring-offset-2 ring-offset-background scale-110"
                      : "border-transparent hover:border-white/20"
                  )}
                  style={{ backgroundColor: variant.color }}
                  title={variant.color}
                  aria-label={`Select color ${variant.color}`}
                />
              ))}
            </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-white/5 pt-6">
        <div className="flex items-center justify-between flex-row-reverse">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            المقاس
          </h3>
          <button className="text-xs text-accent underline underline-offset-4 hover:text-accent/80 transition-colors">
            دليل المقاسات
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
          {selectedVariant.sizes.map((sizeOption) => {
            const isAvailable = sizeOption.stock > 0;
            return (
              <button
                key={sizeOption.size}
                disabled={!isAvailable}
                onClick={() => setSelectedSize(sizeOption.size)}
                className={cn(
                  "relative flex h-12 items-center justify-center rounded-sm border text-sm font-medium transition-all duration-200",
                  selectedSize === sizeOption.size
                    ? "border-accent bg-accent text-primary shadow-[0_0_15px_rgba(255,215,0,0.3)] transform scale-105"
                    : "border-white/10 bg-transparent text-white hover:border-white/30 hover:bg-white/5",
                  !isAvailable &&
                    "cursor-not-allowed opacity-30 bg-white/5 decoration-slice line-through"
                )}
              >
                {sizeOption.size}
              </button>
            );
          })}
        </div>
        {selectedSize && (
            <p className="text-right text-xs text-muted-foreground animate-in fade-in slide-in-from-right-1">
                تم اختيار: <span className="text-white font-semibold">{selectedSize}</span>
            </p>
        )}
      </div>

      <div className="pt-8">
        <Button
          onClick={handleAddToCart}
          disabled={!selectedSize || isOutOfStock}
          variant="luxury"
          size="lg"
          className="w-full text-lg uppercase tracking-widest py-8 shadow-lg hover:shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!selectedSize
            ? "يرجى اختيار المقاس"
            : isOutOfStock
            ? "نفذت الكمية"
            : "أضف إلى السلة"}
        </Button>
        <div className="mt-6 flex flex-col gap-2 text-center text-xs text-muted-foreground">
             <p>شحن مجاني للطلبات التي تزيد عن 5,000 جنيه مصري.</p>
             <p>استرجاع مجاني خلال 14 يوم.</p>
        </div>
      </div>

      <div className="mt-8 border-t border-white/5 pt-8">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-right text-white">تفاصيل المنتج</h3>
        <p className="leading-relaxed text-neutral-400 text-right text-sm">
          {product.description}
        </p>
      </div>
    </div>
  );
}
