"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { ContentService, HeroData } from "@/services/content-service";
import { FadeIn, StaggerContainer } from "@/components/ui/motion-wrapper";
import { motion } from "framer-motion";

interface HeroSectionProps {
  data: HeroData;
}

export function HeroSection({ data: initialData }: HeroSectionProps) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
     // Listen for updates
     const update = async () => {
         const fullData = await ContentService.getHomePageData();
         setData(fullData.hero);
     };

     // Fetch on mount to get latest local storage data
     update();

     window.addEventListener("storage", update);
     return () => window.removeEventListener("storage", update);
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">
      {/* Background Image with Parallax Effect */}
      <motion.div 
        className="absolute inset-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, ease: "easeOut" }}
      >
        <Image
          src={data.backgroundImage}
          alt="Hero Background"
          fill
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40" />
      </motion.div>

      {/* Content */}
      <StaggerContainer className="relative z-10 flex h-full flex-col items-center justify-center text-center px-4">
        <FadeIn delay={0.2}>
          <h1 className="font-heading text-6xl font-black tracking-tighter text-white sm:text-8xl md:text-9xl mix-blend-overlay opacity-90">
            {data.title}
          </h1>
        </FadeIn>
        
        <FadeIn delay={0.4}>
          <div className="mt-6 h-px w-24 bg-accent/50 mx-auto" />
        </FadeIn>

        <FadeIn delay={0.6}>
          <p className="mt-6 max-w-lg text-xl font-light tracking-widest text-neutral-300 md:text-2xl">
            {data.subtitle}
          </p>
        </FadeIn>
      </StaggerContainer>

      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{ delay: 1, duration: 2, repeat: Infinity }}
      >
        <div className="h-12 w-8 rounded-full border border-white/20 p-2">
          <div className="h-2 w-full rounded-full bg-accent" />
        </div>
      </motion.div>
    </section>
  );
}
