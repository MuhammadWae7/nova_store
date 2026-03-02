import { Price } from "../../types";

export interface CartItem {
  productId: string;
  variantId: string;
  sku: string;  // (STR-01: Added to fix checkout sending variantId as sku)
  size: string;
  quantity: number;
  productSnapshot: {
    name: string;
    price: Price;
    images: string[];
    color: string;
  };
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
}
