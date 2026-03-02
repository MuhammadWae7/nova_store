"use client";

import { MarqueeData, ContentService } from "@/services/content-service";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface BrandMarqueeProps {
  data: MarqueeData;
}

export function BrandMarquee({ data: initialData }: BrandMarqueeProps) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    const update = async () => {
      const fullData = await ContentService.getHomePageData();
      setData(fullData.marquee);
    };
    
    update(); // Fetch on mount

    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);

  // Duplicate text to ensure seamless loop
  const marqueeText = [...data.text, ...data.text, ...data.text, ...data.text];

  return (
    <div className="relative w-full overflow-hidden bg-accent py-4 border-y border-black">
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: "-50%" }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: 20, // Adjust speed
        }}
      >
        {marqueeText.map((text, index) => (
          <div
            key={index}
            className="mx-8 flex items-center justify-center text-2xl font-black uppercase tracking-widest text-black md:text-4xl"
          >
            {text}
            <span className="ml-8 text-black/20">•</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
