"use client";

/**
 * Image Upload Component — MISS-04
 * Now uploads to /api/admin/upload instead of using URL.createObjectURL.
 * Images persist across page reloads.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadCloud, Link as LinkIcon, X, Image as ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  value: string[];
  onChange: (value: string[]) => void;
  maxFiles?: number;
}

export function ImageUpload({ value = [], onChange, maxFiles = 1 }: ImageUploadProps) {
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      if (value.length + newUrls.length >= maxFiles) break;

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setUploadError(data.error || "فشل رفع الصورة");
          continue;
        }

        newUrls.push(data.data.url);
      } catch {
        setUploadError("خطأ في الاتصال أثناء رفع الصورة");
      }
    }

    if (newUrls.length > 0) {
      onChange([...value, ...newUrls]);
    }

    setIsUploading(false);
    // Reset file input
    e.target.value = "";
  };

  const handleUrlAdd = () => {
    if (!urlInput.trim() || value.length >= maxFiles) return;

    try {
      new URL(urlInput.trim());
      onChange([...value, urlInput.trim()]);
      setUrlInput("");
      setUploadError(null);
    } catch {
      setUploadError("رابط غير صالح");
    }
  };

  const handleRemove = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      {/* Current images */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {value.map((url, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10">
              <Image
                src={url}
                alt={`صورة ${index + 1}`}
                fill
                className="object-cover"
                sizes="150px"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 p-1 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload controls */}
      {value.length < maxFiles && (
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-neutral-800">
            <TabsTrigger value="upload" className="text-xs">
              <UploadCloud className="h-3 w-3 ml-1" />
              رفع
            </TabsTrigger>
            <TabsTrigger value="url" className="text-xs">
              <LinkIcon className="h-3 w-3 ml-1" />
              رابط
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-lg p-6 cursor-pointer hover:border-white/30 transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleFileUpload}
                className="hidden"
                multiple={maxFiles > 1}
                disabled={isUploading}
              />
              {isUploading ? (
                <>
                  <Loader2 className="h-8 w-8 text-neutral-400 animate-spin mb-2" />
                  <span className="text-xs text-neutral-400">جاري الرفع...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-neutral-400 mb-2" />
                  <span className="text-xs text-neutral-400">اضغط لرفع صورة</span>
                  <span className="text-xs text-neutral-600 mt-1">
                    JPEG, PNG, WebP • حد أقصى 5MB
                  </span>
                </>
              )}
            </label>
          </TabsContent>

          <TabsContent value="url">
            <div className="flex gap-2">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="bg-black/50 border-white/10 text-white text-xs"
                dir="ltr"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleUrlAdd())}
              />
              <Button
                type="button"
                onClick={handleUrlAdd}
                variant="outline"
                size="sm"
                className="shrink-0 border-white/10"
              >
                إضافة
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Error display */}
      {uploadError && (
        <p className="text-xs text-red-400">{uploadError}</p>
      )}
    </div>
  );
}
