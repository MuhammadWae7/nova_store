import { Price } from "@/types";

export type ProductGender = 'men' | 'women' | 'unisex';

export interface ProductVariant {
  id: string;
  color: string; // Hex code
  images: string[]; // URLs
  sizes: ProductSize[];
}

export interface ProductSize {
  size: string; // S, M, L, XL, etc.
  stock: number;
  sku: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: Price;
  categoryId: string;
  categoryName?: string;
  sectionName?: string;
  gender: ProductGender;
  variants: ProductVariant[];
  isNewArrival?: boolean;
  slug: string;
}
