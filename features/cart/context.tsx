"use client";

/**
 * Cart Context — PERF-04: Debounced localStorage writes.
 * STR-01: Now creates CartItems with `sku` and `color` fields.
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { CartItem, CartState } from "./types";

interface CartContextType {
  items: CartItem[];
  total: number;
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string, variantId: string, size: string) => void;
  updateQuantity: (itemId: string, variantId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "nova_cart";
const DEBOUNCE_MS = 300;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialized = useRef(false);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      // Corrupted data — start with empty cart
      localStorage.removeItem(CART_STORAGE_KEY);
    }
    isInitialized.current = true;
  }, []);

  // PERF-04: Debounced localStorage writes (300ms)
  useEffect(() => {
    if (!isInitialized.current) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch {
        // localStorage full or unavailable — fail silently
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [items]);

  const addItem = useCallback((newItem: CartItem) => {
    setItems((prev) => {
      const existingItemIndex = prev.findIndex(
        (item) =>
          item.productId === newItem.productId &&
          item.variantId === newItem.variantId &&
          item.size === newItem.size
      );

      if (existingItemIndex > -1) {
        const newItems = [...prev];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + newItem.quantity,
        };
        return newItems;
      }

      return [...prev, newItem];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback(
    (productId: string, variantId: string, size: string) => {
      setItems((prev) =>
        prev.filter(
          (item) =>
            !(
              item.productId === productId &&
              item.variantId === variantId &&
              item.size === size
            )
        )
      );
    },
    []
  );

  const updateQuantity = useCallback(
    (productId: string, variantId: string, size: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId, variantId, size);
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.productId === productId &&
          item.variantId === variantId &&
          item.size === size
            ? { ...item, quantity }
            : item
        )
      );
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const total = items.reduce(
    (acc, item) => acc + item.productSnapshot.price.amount * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        isOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
