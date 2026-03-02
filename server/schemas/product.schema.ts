import { z } from "zod";

const productSizeSchema = z.object({
  id: z.string().optional(), // Present when editing, absent when creating
  size: z.string().min(1).max(10),
  stock: z.number().int().min(0),
  sku: z.string().min(3).max(30),
});

const productVariantSchema = z.object({
  id: z.string().optional(), // Present when editing, absent when creating
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "لون غير صالح"),
  images: z.array(z.string().url("رابط صورة غير صالح")).min(1, "يجب إضافة صورة واحدة على الأقل"),
  sizes: z.array(productSizeSchema).min(1, "يجب إضافة مقاس واحد على الأقل"),
  sortOrder: z.number().int().min(0).optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(2, "اسم المنتج قصير جداً").max(200),
  description: z.string().min(10, "الوصف قصير جداً").max(2000),
  price: z.number().int().positive("السعر يجب أن يكون أكبر من صفر"),
  categoryId: z.string().min(1, "التصنيف مطلوب"),
  gender: z.enum(["MEN", "WOMEN", "UNISEX"]).optional(),
  isNewArrival: z.boolean().optional(),
  variants: z.array(productVariantSchema).min(1, "يجب إضافة لون واحد على الأقل"),
});

export const updateProductSchema = createProductSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const updateStockSchema = z.object({
  variantId: z.string(),
  size: z.string(),
  stock: z.number().int().min(0, "المخزون لا يمكن أن يكون سالباً"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;
