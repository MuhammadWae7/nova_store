import type { Metadata } from "next";
import { Noto_Sans_Arabic } from "next/font/google";
import { CartProvider } from "@/features/cart/context";
import "./globals.css";

const notoSansArabic = Noto_Sans_Arabic({ 
  subsets: ["arabic"],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-noto-sans-arabic',
});

export const metadata: Metadata = {
  title: "Nova Store | Luxury Fashion",
  description: "Exclusive high-end fashion e-commerce.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${notoSansArabic.className} min-h-screen bg-primary text-primary-foreground antialiased selection:bg-accent selection:text-accent-foreground`}>
        <CartProvider>
            {children}
        </CartProvider>
      </body>
    </html>
  );
}
