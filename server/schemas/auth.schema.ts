import { z } from "zod";

// ─── Login Schema ──────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صالح"),
  password: z
    .string()
    .min(1, "كلمة المرور مطلوبة"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Set Password Schema (SEC-03: now requires token, not email) ───

export const setPasswordSchema = z.object({
  token: z.string().min(1, "رمز الدعوة مطلوب"),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .regex(/[A-Z]/, "يجب أن تحتوي على حرف كبير واحد على الأقل")
    .regex(/[a-z]/, "يجب أن تحتوي على حرف صغير واحد على الأقل")
    .regex(/[0-9]/, "يجب أن تحتوي على رقم واحد على الأقل"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمة المرور غير متطابقة",
  path: ["confirmPassword"],
});

export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
