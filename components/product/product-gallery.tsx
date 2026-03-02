"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(images[0] || "/placeholder");

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      {/* Thumbnails */}
      <div className="flex gap-4 overflow-x-auto md:w-24 md:flex-col md:overflow-y-auto">
        {images.map((image, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedImage(image)}
            className={cn(
              "relative aspect-square w-20 flex-shrink-0 overflow-hidden rounded-sm border md:w-full",
              selectedImage === image ? "border-accent" : "border-transparent"
            )}
          >
             <Image src={image} alt="Thumbnail" fill className="object-cover" />
          </button>
        ))}
        {/* Placeholder thumbnails if empty */}
        {images.length === 0 && (
           <div className="h-20 w-20 bg-neutral-800" />
        )}
      </div>

      {/* Main Image */}
      <div className="relative aspect-[3/4] w-full flex-1 overflow-hidden rounded-sm bg-neutral-900">
         <Image src={selectedImage} alt="Product Image" fill className="object-cover" priority />
      </div>
    </div>
  );
}
