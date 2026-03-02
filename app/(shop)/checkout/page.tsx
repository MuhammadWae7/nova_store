"use client";

/**
 * Checkout Page — MISS-06: Proper form validation with email field (MISS-05).
 * Uses <form onSubmit> instead of onClick for accessibility.
 * SEC-04: Order service sends CSRF header.
 */

import { useCart } from "@/features/cart/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { OrderService } from "@/services/order-service";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, MapPin, Phone, User, CreditCard, Banknote, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Egyptian governorates list
const GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "الشرقية",
  "المنوفية", "القليوبية", "البحيرة", "الغربية", "كفر الشيخ",
  "دمياط", "بورسعيد", "الإسماعيلية", "السويس", "شمال سيناء",
  "جنوب سيناء", "بني سويف", "الفيوم", "المنيا", "أسيوط",
  "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر",
  "الوادي الجديد", "مطروح",
];

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
}

function validateForm(data: { name: string; email: string; phone: string; address: string; city: string }): FormErrors {
  const errors: FormErrors = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = "الاسم مطلوب (حرفان على الأقل)";
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "بريد إلكتروني غير صالح";
  }

  if (!data.phone || !/^(01[0125]\d{8}|201[0125]\d{8}|\+201[0125]\d{8})$/.test(data.phone)) {
    errors.phone = "رقم هاتف مصري غير صالح (مثال: 01012345678)";
  }

  if (!data.address || data.address.trim().length < 5) {
    errors.address = "العنوان مطلوب (5 أحرف على الأقل)";
  }

  if (!data.city) {
    errors.city = "اختر المحافظة";
  }

  return errors;
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [paymentMethod] = useState<"cod">("cod");

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error on edit
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Client-side validation (MISS-06)
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (items.length === 0) return;

    setIsSubmitting(true);

    try {
      const result = await OrderService.checkout(
        {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          city: form.city,
        },
        items
      );

      setOrderNumber(result.orderNumber);
      setServerTotal(result.totalAmount);
      setOrderComplete(true);
      clearCart();
    } catch (err) {
      setServerError((err as Error).message || "فشل إنشاء الطلب. حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Order success state
  if (orderComplete) {
    return (
      <div className="min-h-screen bg-black text-white" dir="rtl">
        <div className="container mx-auto max-w-lg py-20 px-4 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <CheckCircle2 className="mx-auto h-20 w-20 text-green-400 mb-6" />
            <h1 className="text-3xl font-bold mb-2">تم الطلب بنجاح! 🎉</h1>
            <p className="text-neutral-400 mb-6">
              رقم الطلب: <span className="text-white font-mono font-bold">{orderNumber}</span>
            </p>
            {serverTotal !== null && (
              <p className="text-xl font-semibold text-accent mb-8">
                الإجمالي: {serverTotal.toLocaleString()} جنيه
              </p>
            )}
            <Link href="/" className="inline-block">
              <Button variant="luxury" size="lg" className="gap-2">
                <ArrowRight className="h-4 w-4" />
                متابعة التسوق
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (items.length === 0 && !orderComplete) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">السلة فارغة</h1>
          <Link href="/products">
            <Button variant="luxury" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              تصفح المنتجات
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      <div className="container mx-auto max-w-6xl py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">إتمام الطلب</h1>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Customer Info */}
            <div className="space-y-6">
              <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-6 space-y-5">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5 text-accent" />
                  بيانات العميل
                </h2>

                {/* Name */}
                <div>
                  <label htmlFor="checkout-name" className="block text-sm text-neutral-400 mb-1.5">
                    الاسم الكامل *
                  </label>
                  <Input
                    id="checkout-name"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="أحمد محمد"
                    className={`bg-black/50 border-white/10 text-white ${errors.name ? "border-red-500" : ""}`}
                    required
                  />
                  {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                </div>

                {/* Email (MISS-05) */}
                <div>
                  <label htmlFor="checkout-email" className="block text-sm text-neutral-400 mb-1.5">
                    <Mail className="h-3.5 w-3.5 inline ml-1" />
                    البريد الإلكتروني *
                  </label>
                  <Input
                    id="checkout-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="ahmed@example.com"
                    className={`bg-black/50 border-white/10 text-white ${errors.email ? "border-red-500" : ""}`}
                    dir="ltr"
                    required
                  />
                  {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="checkout-phone" className="block text-sm text-neutral-400 mb-1.5">
                    <Phone className="h-3.5 w-3.5 inline ml-1" />
                    رقم الهاتف *
                  </label>
                  <Input
                    id="checkout-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="01012345678"
                    className={`bg-black/50 border-white/10 text-white ${errors.phone ? "border-red-500" : ""}`}
                    dir="ltr"
                    required
                  />
                  {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
                </div>
              </div>

              {/* Shipping */}
              <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-6 space-y-5">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-accent" />
                  عنوان الشحن
                </h2>

                {/* City / Governorate */}
                <div>
                  <label htmlFor="checkout-city" className="block text-sm text-neutral-400 mb-1.5">
                    المحافظة *
                  </label>
                  <select
                    id="checkout-city"
                    value={form.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    className={`w-full rounded-md bg-black/50 border px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent ${
                      errors.city ? "border-red-500" : "border-white/10"
                    }`}
                    required
                  >
                    <option value="" disabled>اختر المحافظة</option>
                    {GOVERNORATES.map((gov) => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                  {errors.city && <p className="text-xs text-red-400 mt-1">{errors.city}</p>}
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="checkout-address" className="block text-sm text-neutral-400 mb-1.5">
                    العنوان التفصيلي *
                  </label>
                  <Input
                    id="checkout-address"
                    value={form.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="شارع، مبنى، شقة..."
                    className={`bg-black/50 border-white/10 text-white ${errors.address ? "border-red-500" : ""}`}
                    required
                  />
                  {errors.address && <p className="text-xs text-red-400 mt-1">{errors.address}</p>}
                </div>
              </div>

              {/* Payment */}
              <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-6">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-accent" />
                  طريقة الدفع
                </h2>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-accent/30">
                  <Banknote className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium text-sm">الدفع عند الاستلام</p>
                    <p className="text-xs text-neutral-400">ادفع عند وصول طلبك</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-6 sticky top-8">
                <h2 className="text-lg font-semibold mb-4">ملخص الطلب</h2>

                <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-3 p-3 rounded-lg bg-white/5">
                      <div className="relative h-16 w-16 overflow-hidden rounded-md bg-neutral-800 shrink-0">
                        {item.productSnapshot.images[0] && (
                          <Image
                            src={item.productSnapshot.images[0]}
                            alt={item.productSnapshot.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.productSnapshot.name}</p>
                        <p className="text-xs text-neutral-400">
                          المقاس: {item.size} • الكمية: {item.quantity}
                        </p>
                        <p className="text-sm text-accent font-semibold mt-1">
                          {(item.productSnapshot.price.amount * item.quantity).toLocaleString()} جنيه
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">المنتجات ({items.length})</span>
                    <span>{total.toLocaleString()} جنيه</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">الشحن</span>
                    <span className="text-green-400">مجاني</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                    <span>الإجمالي</span>
                    <span className="text-accent">{total.toLocaleString()} جنيه</span>
                  </div>
                  <p className="text-xs text-neutral-500 text-center">
                    * الإجمالي النهائي يتم تأكيده من الخادم
                  </p>
                </div>

                {/* Server error */}
                {serverError && (
                  <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400">{serverError}</p>
                  </div>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={isSubmitting || items.length === 0}
                  variant="luxury"
                  size="lg"
                  className="w-full mt-6 text-lg py-6"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      جاري المعالجة...
                    </span>
                  ) : (
                    `تأكيد الطلب — ${total.toLocaleString()} جنيه`
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
