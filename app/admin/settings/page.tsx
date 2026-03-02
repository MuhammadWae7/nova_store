"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">الإعدادات</h1>
        <Button variant="luxury">
          <Save className="ml-2 h-4 w-4" /> حفظ التغييرات
        </Button>
      </div>

      <div className="rounded-md border border-white/10 bg-neutral-900 p-6 space-y-6">
         {/* Store Info */}
         <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">معلومات المتجر</h2>
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm text-neutral-400">اسم المتجر</label>
                    <Input defaultValue="Nova Store" className="bg-black/50 border-white/10 text-white" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm text-neutral-400">البريد الإلكتروني للدعم</label>
                    <Input defaultValue="support@novastore.com" className="bg-black/50 border-white/10 text-white" />
                </div>
            </div>
         </section>

         {/* Regional Settings */}
         <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">الإعدادات الإقليمية</h2>
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm text-neutral-400">العملة الافتراضية</label>
                    <select className="flex h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent">
                        <option value="EGP">الجنيه المصري (EGP)</option>
                        <option value="USD">الدولار الأمريكي (USD)</option>
                        <option value="SAR">الريال السعودي (SAR)</option>
                    </select>
                </div>
                 <div className="space-y-2">
                    <label className="text-sm text-neutral-400">اللغة الافتراضية</label>
                    <select className="flex h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent">
                         <option value="ar">العربية</option>
                        <option value="en">English</option>
                    </select>
                </div>
            </div>
         </section>
      </div>
    </div>
  );
}
