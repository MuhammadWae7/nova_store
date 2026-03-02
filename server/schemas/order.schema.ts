import { z } from "zod";

// ─── Checkout Schema ───────────────────────────

export const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().min(2, "الاسم مطلوب (حرفان على الأقل)"),
    email: z.string().email("بريد إلكتروني غير صالح"),
    phone: z
      .string()
      .regex(
        /^(01[0125]\d{8}|201[0125]\d{8}|\+201[0125]\d{8})$/,
        "رقم هاتف مصري غير صالح"
      ),
    address: z.string().min(5, "العنوان مطلوب (5 أحرف على الأقل)"),
    city: z.string().min(2, "المدينة مطلوبة"),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().optional(), // Validated against SKU server-side
        sku: z.string().min(1, "كود المنتج مطلوب"),
        productName: z.string().min(1),
        variantColor: z.string().optional().default(""),
        size: z.string().min(1),
        quantity: z.number().int().min(1).max(10),
        // unitPrice is still accepted for backward compat but IGNORED by server
        unitPrice: z.number().optional(),
      })
    )
    .min(1, "الطلب يجب أن يحتوي على منتج واحد على الأقل"),
  // totalAmount is accepted but IGNORED — server recalculates (SEC-05)
  totalAmount: z.number().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ─── Order Status Schema ───────────────────────

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
