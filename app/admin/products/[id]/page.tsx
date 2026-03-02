"use client";

import { useEffect, useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ProductService } from "@/services/product-service";
import { TaxonomyService, Section, Category, SizeType } from "@/services/taxonomy-service";
import { Product, ProductVariant, ProductSize } from "@/features/product/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  Plus,
  Trash2,
  Save,
  Sparkles,
  ShoppingBag,
  Palette,
  Ruler,
  Star,
  StarOff,
  Eye,
  AlertCircle,
  Check,
  Package,
} from "lucide-react";
import Link from "next/link";
import { ImageUpload } from "@/components/admin/image-upload";

// ── Size Charts by SizeType ────────────────────

const SIZE_MAP: Record<SizeType, { label: string; sizes: string[] }> = {
  TOPS: { label: "أعلى (XS-3XL)", sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"] },
  PANTS: { label: "بنطلون (28-40)", sizes: ["28", "30", "32", "34", "36", "38", "40"] },
  SHOES: { label: "أحذية (38-46)", sizes: ["38", "39", "40", "41", "42", "43", "44", "45", "46"] },
  ONE_SIZE: { label: "مقاس واحد", sizes: ["One Size"] },
};

const SIZETYPE_LABELS: Record<SizeType, string> = {
  TOPS: "ملابس علوية",
  PANTS: "بنطلونات",
  SHOES: "أحذية",
  ONE_SIZE: "مقاس واحد",
};

// ── Preset Colors ──────────────────────────────

const COLOR_PRESETS = [
  { hex: "#000000", name: "أسود" },
  { hex: "#FFFFFF", name: "أبيض" },
  { hex: "#333333", name: "رمادي غامق" },
  { hex: "#666666", name: "رمادي" },
  { hex: "#8B4513", name: "بني" },
  { hex: "#1A1A2E", name: "كحلي" },
  { hex: "#800020", name: "عنابي" },
  { hex: "#2D5016", name: "زيتي" },
  { hex: "#C4A35A", name: "ذهبي" },
  { hex: "#F5F5DC", name: "بيج" },
];

// ── Component ──────────────────────────────────

export default function ProductEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const isNew = id === "new";

  // ── State ──────────────────────────────────────

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");

  const [product, setProduct] = useState<Product>({
    id: "",
    name: "",
    slug: "",
    description: "",
    price: { amount: 0, currency: "EGP" },
    categoryId: "",
    gender: "men",
    variants: [],
    isNewArrival: false,
  });

  // ── Load data ──────────────────────────────────

  useEffect(() => {
    TaxonomyService.getAllSections()
      .then(setSections)
      .catch(() => setSections([]));
  }, []);

  useEffect(() => {
    if (!isNew) {
      ProductService.getAdminById(id).then((p) => {
        if (p) {
          setProduct(p);
          // Find the section for the category
          TaxonomyService.getAllSections().then((secs) => {
            for (const sec of secs) {
              const cat = sec.categories?.find((c) => c.id === p.categoryId);
              if (cat) {
                setSelectedSectionId(sec.id);
                break;
              }
            }
          });
        } else {
          router.push("/admin/products");
        }
        setLoading(false);
      });
    }
  }, [id, isNew, router]);

  // ── Derived ────────────────────────────────────

  const selectedSection = sections.find((s) => s.id === selectedSectionId);
  const categories = selectedSection?.categories || [];

  const totalStock = useMemo(
    () =>
      product.variants.reduce(
        (sum, v) => sum + v.sizes.reduce((s, sz) => s + sz.stock, 0),
        0
      ),
    [product.variants]
  );

  // ── Handlers ───────────────────────────────────

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!product.name.trim()) e.name = "اسم المنتج مطلوب";
    if (product.price.amount <= 0) e.price = "السعر يجب أن يكون أكبر من صفر";
    if (!product.categoryId) e.category = "يجب اختيار التصنيف";
    if (product.variants.length === 0) e.variants = "يجب إضافة لون واحد على الأقل";
    const noSizes = product.variants.some((v) => v.sizes.length === 0);
    if (noSizes) e.sizes = "كل لون يجب أن يحتوي على مقاس واحد على الأقل";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await ProductService.save(product);
      router.push("/admin/products");
    } catch (err: any) {
      setErrors({ save: err.message || "فشل في حفظ المنتج" });
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof Product>(field: K, value: Product[K]) => {
    setProduct((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  // ── Slug generator ─────────────────────────────

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    updateField("name", name);
    updateField("slug", slug || `product-${Date.now()}`);
  };

  // ── Get active sizeType from selected category ─

  const getActiveSizeType = (): SizeType | null => {
    if (!product.categoryId) return null;
    for (const sec of sections) {
      const cat = sec.categories?.find((c) => c.id === product.categoryId);
      if (cat) return cat.sizeType;
    }
    return null;
  };

  const activeSizeType = getActiveSizeType();
  const activeSizeChart = activeSizeType ? SIZE_MAP[activeSizeType] : null;

  // ── Variant Helpers ────────────────────────────

  const buildSizesForVariant = (hex: string, sizeType: SizeType | null, defaultStock = 10): ProductSize[] => {
    if (!sizeType) return [];
    const chart = SIZE_MAP[sizeType];
    const slugBase = product.slug || "prod";
    const colorCode = hex.replace("#", "").substring(0, 3).toUpperCase();
    return chart.sizes.map((size) => ({
      size,
      stock: defaultStock,
      sku: `${slugBase}-${colorCode}-${size}`.toUpperCase(),
    }));
  };

  const addVariant = (hex: string = "#000000") => {
    const newVariant: ProductVariant = {
      id: crypto.randomUUID(),
      color: hex,
      images: [],
      sizes: buildSizesForVariant(hex, activeSizeType),
    };
    updateField("variants", [...product.variants, newVariant]);
  };

  const updateVariant = (
    index: number,
    field: keyof ProductVariant,
    value: any
  ) => {
    const newVariants = [...product.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    updateField("variants", newVariants);
  };

  const removeVariant = (index: number) => {
    const newVariants = [...product.variants];
    newVariants.splice(index, 1);
    updateField("variants", newVariants);
  };

  // ── Size Template Apply ────────────────────────

  const applySizeTemplate = (
    variantIndex: number,
    templateSizes: string[],
    defaultStock = 10
  ) => {
    const variant = product.variants[variantIndex];
    const slugBase = product.slug || "prod";
    const colorCode = variant.color.replace("#", "").substring(0, 3).toUpperCase();

    const newSizes: ProductSize[] = templateSizes.map((size) => ({
      size,
      stock: defaultStock,
      sku: `${slugBase}-${colorCode}-${size}`.toUpperCase(),
    }));

    updateVariant(variantIndex, "sizes", newSizes);
  };

  // ── Bulk Stock ─────────────────────────────────

  const setBulkStock = (variantIndex: number, stock: number) => {
    const variant = product.variants[variantIndex];
    const newSizes = variant.sizes.map((s) => ({ ...s, stock }));
    updateVariant(variantIndex, "sizes", newSizes);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-neutral-400">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="ghost" size="icon">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isNew ? "إضافة منتج جديد" : `تعديل: ${product.name}`}
            </h1>
            {product.slug && (
              <p className="text-xs text-neutral-500 mt-1 font-mono dir-ltr">
                /{product.slug}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isNew && (
            <Link href={`/products/${product.slug}`} target="_blank">
              <Button variant="outline" size="sm" className="gap-2 border-white/10">
                <Eye className="h-3.5 w-3.5" /> معاينة
              </Button>
            </Link>
          )}
          <Button
            onClick={handleSave}
            variant="luxury"
            className="gap-2"
            disabled={saving}
          >
            {saving ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "جاري الحفظ..." : "حفظ المنتج"}
          </Button>
        </div>
      </div>

      {/* Global Errors */}
      {errors.save && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-300 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errors.save}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* PANEL 1 — Product Basics                    */}
      {/* ═══════════════════════════════════════════ */}
      <div className="rounded-xl border border-white/10 bg-neutral-900/80 p-6 space-y-5">
        <div className="flex items-center gap-2 text-white">
          <ShoppingBag className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-bold">معلومات المنتج</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm text-neutral-400">اسم المنتج *</label>
            <Input
              value={product.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="مثال: هودي ميدنايت سيلك"
              className={`bg-black/40 border-white/10 text-white ${errors.name ? "border-red-500/50" : ""}`}
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <label className="text-sm text-neutral-400">السعر (جنيه مصري) *</label>
            <Input
              type="number"
              value={product.price.amount || ""}
              onChange={(e) =>
                updateField("price", {
                  ...product.price,
                  amount: Number(e.target.value),
                })
              }
              placeholder="0"
              className={`bg-black/40 border-white/10 text-white ${errors.price ? "border-red-500/50" : ""}`}
            />
            {errors.price && (
              <p className="text-xs text-red-400">{errors.price}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm text-neutral-400">الوصف</label>
            <Textarea
              value={product.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="وصف تفصيلي للمنتج..."
              className="bg-black/40 border-white/10 text-white h-24 resize-none"
            />
          </div>
        </div>

        {/* Section → Category Cascading Picker */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm text-neutral-400">القسم *</label>
            <select
              value={selectedSectionId}
              onChange={(e) => {
                setSelectedSectionId(e.target.value);
                updateField("categoryId", ""); // Reset category when section changes
              }}
              className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-accent/50 appearance-none"
            >
              <option value="" className="bg-neutral-900">
                — اختر القسم —
              </option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id} className="bg-neutral-900">
                  {sec.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-neutral-400">التصنيف *</label>
            <select
              value={product.categoryId}
              onChange={(e) => {
                const newCatId = e.target.value;
                updateField("categoryId", newCatId);
                // Auto-apply sizes to variants without sizes
                if (newCatId) {
                  const cat = categories.find((c) => c.id === newCatId);
                  if (cat) {
                    const newVariants = product.variants.map((v) => {
                      if (v.sizes.length === 0) {
                        return { ...v, sizes: buildSizesForVariant(v.color, cat.sizeType) };
                      }
                      return v;
                    });
                    setProduct((prev) => ({ ...prev, categoryId: newCatId, variants: newVariants }));
                  }
                }
              }}
              disabled={!selectedSectionId}
              className={`w-full rounded-md border bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-accent/50 appearance-none ${
                errors.category ? "border-red-500/50" : "border-white/10"
              } ${!selectedSectionId ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <option value="" className="bg-neutral-900">
                {selectedSectionId ? "— اختر التصنيف —" : "اختر القسم أولاً"}
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-neutral-900">
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs text-red-400">{errors.category}</p>
            )}
          </div>
        </div>

        {/* Gender + New Arrival */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm text-neutral-400">الجنس</label>
            <div className="flex gap-2">
              {(
                [
                  { value: "men", label: "رجالي" },
                  { value: "women", label: "نسائي" },
                  { value: "unisex", label: "للجميع" },
                ] as const
              ).map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => updateField("gender", g.value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    product.gender === g.value
                      ? "bg-accent text-black"
                      : "bg-white/5 text-neutral-400 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mr-auto">
            <button
              type="button"
              onClick={() => updateField("isNewArrival", !product.isNewArrival)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                product.isNewArrival
                  ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                  : "bg-white/5 text-neutral-500 hover:bg-white/10 border border-white/10"
              }`}
            >
              {product.isNewArrival ? (
                <Star className="h-4 w-4 fill-yellow-400" />
              ) : (
                <StarOff className="h-4 w-4" />
              )}
              وصل حديثاً
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* PANEL 2 — Colors & Images                   */}
      {/* ═══════════════════════════════════════════ */}
      <div className="rounded-xl border border-white/10 bg-neutral-900/80 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Palette className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-bold">الألوان والصور</h2>
          </div>
          <Button
            type="button"
            onClick={() => addVariant()}
            variant="outline"
            size="sm"
            className="gap-2 border-white/10 text-sm"
          >
            <Plus className="h-3.5 w-3.5" /> إضافة لون
          </Button>
        </div>

        {errors.variants && (
          <p className="text-xs text-red-400">{errors.variants}</p>
        )}

        {/* Quick Color Presets */}
        {product.variants.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-neutral-500">
              اختر لوناً سريعاً أو أضف لوناً مخصصاً:
            </p>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => addVariant(preset.hex)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-sm"
                >
                  <div
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: preset.hex }}
                  />
                  <span className="text-neutral-300">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Variant Cards */}
        {product.variants.map((variant, vIndex) => (
          <div
            key={variant.id}
            className="rounded-lg border border-white/5 bg-black/30 p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg border-2 border-white/20 shadow-lg"
                  style={{ backgroundColor: variant.color }}
                />
                <div className="flex items-center gap-2">
                  <Input
                    value={variant.color}
                    onChange={(e) =>
                      updateVariant(vIndex, "color", e.target.value)
                    }
                    className="w-28 h-8 text-xs font-mono bg-white/5 border-white/10 text-white"
                    dir="ltr"
                  />
                  <input
                    type="color"
                    value={variant.color}
                    onChange={(e) =>
                      updateVariant(vIndex, "color", e.target.value)
                    }
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                  />
                </div>
                <span className="text-xs text-neutral-500">
                  {variant.sizes.length} مقاس •{" "}
                  {variant.sizes.reduce((s, sz) => s + sz.stock, 0)} قطعة
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-red-500/10"
                onClick={() => removeVariant(vIndex)}
              >
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            </div>

            {/* Image Upload */}
            <ImageUpload
              value={variant.images}
              onChange={(newImages) =>
                updateVariant(vIndex, "images", newImages)
              }
              maxFiles={4}
            />

            {/* ═══════════════════════════════════ */}
            {/* PANEL 3 (inline) — Sizes & Stock    */}
            {/* ═══════════════════════════════════ */}
            <div className="border-t border-white/5 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium text-white">
                    المقاسات والمخزون
                  </span>
                </div>
              </div>

              {/* Auto Size Info */}
              {activeSizeChart ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent/20 bg-accent/5 text-xs">
                    <Sparkles className="h-3 w-3 text-accent" />
                    <span className="text-accent">{activeSizeChart.label}</span>
                    <span className="text-neutral-500">({activeSizeChart.sizes.join(", ")})</span>
                  </div>
                  {variant.sizes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => applySizeTemplate(vIndex, activeSizeChart.sizes)}
                      className="text-xs text-neutral-500 hover:text-accent transition-colors underline"
                    >
                      إعادة تطبيق
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-neutral-600">
                  اختر التصنيف أولاً لتحديد المقاسات تلقائياً
                </p>
              )}

              {/* Bulk Stock Control */}
              {variant.sizes.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500">ملء سريع:</span>
                  {[5, 10, 15, 20, 50].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setBulkStock(vIndex, n)}
                      className="px-2 py-0.5 rounded text-xs bg-white/5 text-neutral-400 hover:bg-accent/10 hover:text-accent border border-white/5 transition-all"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}

              {errors.sizes && vIndex === product.variants.length - 1 && (
                <p className="text-xs text-red-400">{errors.sizes}</p>
              )}

              {/* Size Grid */}
              {variant.sizes.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {variant.sizes.map((sizeObj, sIndex) => (
                    <div
                      key={sIndex}
                      className="relative group rounded-lg border border-white/10 bg-neutral-800/50 p-3 space-y-2 hover:border-white/20 transition-colors"
                    >
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => {
                          const newSizes = [...variant.sizes];
                          newSizes.splice(sIndex, 1);
                          updateVariant(vIndex, "sizes", newSizes);
                        }}
                        className="absolute -top-1.5 -left-1.5 p-0.5 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>

                      {/* Size Label */}
                      <Input
                        value={sizeObj.size}
                        onChange={(e) => {
                          const newSizes = [...variant.sizes];
                          newSizes[sIndex] = {
                            ...newSizes[sIndex],
                            size: e.target.value,
                          };
                          updateVariant(vIndex, "sizes", newSizes);
                        }}
                        className="h-7 text-center text-sm font-bold bg-transparent border-0 text-white px-1"
                        placeholder="Size"
                      />

                      {/* Stock Input */}
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3 text-neutral-500" />
                        <Input
                          type="number"
                          value={sizeObj.stock}
                          onChange={(e) => {
                            const newSizes = [...variant.sizes];
                            newSizes[sIndex] = {
                              ...newSizes[sIndex],
                              stock: Number(e.target.value),
                            };
                            updateVariant(vIndex, "sizes", newSizes);
                          }}
                          className="h-6 text-xs bg-white/5 border-0 text-white px-1 w-full text-center"
                          min={0}
                        />
                      </div>

                      {/* Stock indicator */}
                      <div
                        className={`h-0.5 rounded-full ${
                          sizeObj.stock === 0
                            ? "bg-red-500"
                            : sizeObj.stock < 5
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                      />
                    </div>
                  ))}

                  {/* Add Size Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const newSizes = [
                        ...variant.sizes,
                        {
                          size: "",
                          stock: 10,
                          sku: `${product.slug || "prod"}-${variant.color.replace("#", "").substring(0, 3)}-NEW`.toUpperCase(),
                        },
                      ];
                      updateVariant(vIndex, "sizes", newSizes);
                    }}
                    className="rounded-lg border-2 border-dashed border-white/10 p-3 flex flex-col items-center justify-center gap-1 text-neutral-500 hover:text-accent hover:border-accent/30 transition-all min-h-[88px]"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-[10px]">مقاس</span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-4 text-neutral-600 text-sm">
                  اختر قالب مقاسات أعلاه أو أضف مقاسات يدوياً
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Add Color Presets (always visible) */}
        {product.variants.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            <span className="text-xs text-neutral-500 self-center ml-2">
              أضف لون:
            </span>
            {COLOR_PRESETS.map((preset) => {
              const isUsed = product.variants.some((v) => v.color === preset.hex);
              return (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => !isUsed && addVariant(preset.hex)}
                  disabled={isUsed}
                  className={`relative w-6 h-6 rounded-full border transition-transform ${
                    isUsed
                      ? "border-accent/50 opacity-40 cursor-not-allowed"
                      : "border-white/20 hover:scale-125"
                  }`}
                  style={{ backgroundColor: preset.hex }}
                  title={isUsed ? `${preset.name} (مستخدم)` : preset.name}
                >
                  {isUsed && (
                    <Check className="h-3 w-3 absolute inset-0 m-auto text-accent drop-shadow-md" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* Live Preview Card                           */}
      {/* ═══════════════════════════════════════════ */}
      {product.name && (
        <div className="rounded-xl border border-white/10 bg-neutral-900/80 p-6 space-y-4">
          <div className="flex items-center gap-2 text-white">
            <Eye className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-bold">معاينة المنتج</h2>
          </div>
          <div className="flex gap-5 items-start">
            {/* Preview Image */}
            <div className="w-32 h-40 rounded-lg bg-neutral-800 border border-white/10 overflow-hidden shrink-0">
              {product.variants[0]?.images[0] ? (
                <img
                  src={product.variants[0].images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-600">
                  <ShoppingBag className="h-8 w-8" />
                </div>
              )}
            </div>
            {/* Preview Info */}
            <div className="space-y-2 flex-1">
              <h3 className="text-white font-bold text-lg">{product.name}</h3>
              <p className="text-accent font-bold text-xl">
                {product.price.amount.toLocaleString()} ج.م
              </p>
              {product.isNewArrival && (
                <span className="inline-flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">
                  <Star className="h-3 w-3 fill-yellow-400" /> جديد
                </span>
              )}
              <div className="flex gap-2 mt-2">
                {product.variants.map((v) => (
                  <div
                    key={v.id}
                    className="w-5 h-5 rounded-full border border-white/20"
                    style={{ backgroundColor: v.color }}
                  />
                ))}
              </div>
              <div className="flex gap-3 text-xs text-neutral-500 mt-2">
                <span>{product.variants.length} ألوان</span>
                <span>•</span>
                <span>{totalStock} قطعة مخزون</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* Bottom Save Bar (Sticky)                    */}
      {/* ═══════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-neutral-950/90 backdrop-blur-md p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-neutral-400">
            <span>
              {product.variants.length} ألوان • {totalStock} قطعة
            </span>
            {Object.values(errors).some(Boolean) && (
              <span className="text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> يوجد أخطاء
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Link href="/admin/products">
              <Button variant="ghost">إلغاء</Button>
            </Link>
            <Button
              onClick={handleSave}
              variant="luxury"
              className="gap-2 min-w-[140px]"
              disabled={saving}
            >
              {saving ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {saving ? "جاري الحفظ..." : "حفظ المنتج"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
