"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function SetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("رابط غير صالح أو مفقود.");
      return;
    }

    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    if (password.length < 8) {
      setError("يجب أن تتكون كلمة المرور من 8 أحرف على الأقل");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      
      const json = await res.json();
      
      if (!res.ok || !json.success) {
        throw new Error(json.error || "حدث خطأ أثناء تعيين كلمة المرور");
      }

      // Success, redirect to admin dashboard
      router.push("/admin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4 text-center">
        <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-8 max-w-md w-full backdrop-blur-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <Lock className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-white">رابط غير صالح</h1>
          <p className="mb-6 text-neutral-400">
            لم يتم العثور على رمز الإعداد. يرجى طلب رابط جديد من مدير النظام.
          </p>
          <Button asChild variant="luxury" className="w-full">
            <Link href="/admin/login">العودة لتسجيل الدخول</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4">
      {/* Background Effect */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] left-[20%] h-[500px] w-[500px] rounded-full bg-accent/20 blur-[120px]" />
      </div>

      <div className="z-10 w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-neutral-900/80 shadow-2xl backdrop-blur-xl">
            <Package className="h-8 w-8 text-accent" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">إعداد كلمة المرور</h2>
          <p className="mt-2 text-sm text-neutral-400">يرجى اختيار كلمة مرور قوية لحسابك</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-white/10 bg-neutral-900/50 p-8 shadow-2xl backdrop-blur-sm">
          {error && (
            <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20 text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">كلمة المرور الجديدة</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-black/50 border-white/10 text-white pl-10"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">تأكيد كلمة المرور</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-black/50 border-white/10 text-white pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <Button type="submit" variant="luxury" className="w-full h-12 text-base" disabled={loading}>
             {loading ? "جاري الحفظ..." : "حفظ والمتابعة"} <Lock className="mr-2 h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
