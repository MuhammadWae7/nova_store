"use client";

import { useEffect, useState } from "react";
import { ContentService, HomePageData } from "@/services/content-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming we have this, or use Input
import { Save, RefreshCw } from "lucide-react";
import Image from "next/image";

export default function ContentEditorPage() {
  const [data, setData] = useState<HomePageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const content = await ContentService.getHomePageData();
    setData(content);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    await ContentService.saveHomePageData(data);
    alert("Content updated successfully!");
  };

  if (loading || !data) return <div>Loading content...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">إدارة المحتوى (CMS)</h1>
        <Button onClick={handleSave} variant="luxury" className="gap-2">
            <Save className="h-4 w-4" /> حفظ التغييرات
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Hero Section */}
        <div className="rounded-lg border border-white/10 bg-neutral-900 p-6 space-y-4">
            <h2 className="text-xl font-bold text-white border-b border-white/5 pb-2">Hero Section (الواجهة الرئيسية)</h2>
            
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm text-neutral-400">العنوان الرئيسي</label>
                    <Input 
                        value={data.hero.title} 
                        onChange={e => setData({...data, hero: {...data.hero, title: e.target.value}})}
                        className="bg-black/50 border-white/10 text-white font-bold"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm text-neutral-400">العنوان الفرعي</label>
                    <Input 
                        value={data.hero.subtitle} 
                        onChange={e => setData({...data, hero: {...data.hero, subtitle: e.target.value}})}
                        className="bg-black/50 border-white/10 text-white"
                    />
                </div>
                <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm text-neutral-400">رابط صورة الخلفية</label>
                    <Input 
                        value={data.hero.backgroundImage} 
                        onChange={e => setData({...data, hero: {...data.hero, backgroundImage: e.target.value}})}
                        className="bg-black/50 border-white/10 text-white"
                    />
                    <div className="relative h-40 w-full overflow-hidden rounded border border-white/10 mt-2">
                        <Image src={data.hero.backgroundImage} alt="Preview" fill className="object-cover opacity-60" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <h1 className="text-2xl font-black text-white mix-blend-overlay">{data.hero.title}</h1>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Marquee Section */}
        <div className="rounded-lg border border-white/10 bg-neutral-900 p-6 space-y-4">
            <h2 className="text-xl font-bold text-white border-b border-white/5 pb-2">شريط العلامة التجارية (Marquee)</h2>
            <div className="space-y-2">
                <label className="text-sm text-neutral-400">النصوص (افصل بينها بفاصلة)</label>
                <Input 
                    value={data.marquee.text.join(", ")} 
                    onChange={e => setData({...data, marquee: { text: e.target.value.split(",").map(s => s.trim()) }})}
                    className="bg-black/50 border-white/10 text-white"
                />
                <p className="text-xs text-neutral-500">مثال: NOVA, فخامة, LUXURY, STYLE</p>
            </div>
        </div>

        {/* Featured Section Titles */}
        <div className="rounded-lg border border-white/10 bg-neutral-900 p-6 space-y-4">
             <h2 className="text-xl font-bold text-white border-b border-white/5 pb-2">عناوين الأقسام</h2>
             <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm text-neutral-400">عنوان "إصدارات حصرية"</label>
                    <Input 
                        value={data.featuredCollection.title} 
                        onChange={e => setData({...data, featuredCollection: {...data.featuredCollection, title: e.target.value}})}
                        className="bg-black/50 border-white/10 text-white"
                    />
                </div>
                 <div className="space-y-2">
                    <label className="text-sm text-neutral-400">وصف "إصدارات حصرية"</label>
                    <Input 
                        value={data.featuredCollection.description} 
                        onChange={e => setData({...data, featuredCollection: {...data.featuredCollection, description: e.target.value}})}
                        className="bg-black/50 border-white/10 text-white"
                    />
                </div>
             </div>
        </div>
      </form>
    </div>
  );
}
