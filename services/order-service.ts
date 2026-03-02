/**
 * Frontend Order Service — STR-01 fix: now sends real SKU, not variantId.
 * Also adds CSRF header (SEC-04) and email field (MISS-05).
 */

import { CartItem } from "@/features/cart/types";
import { apiFetch } from "@/lib/api-client";

const API_BASE = "/api";

export interface OrderCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

export interface OrderResult {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
}

/** Shape returned by the admin orders API */
export interface Order {
  id: string;
  orderNumber: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  totalAmount: number;
  customer: {
    name: string;
    email?: string;
    phone: string;
    address: string;
    city: string;
  };
  items: {
    productName: string;
    variantColor: string;
    size: string;
    quantity: number;
    unitPrice: number;
    sku: string;
  }[];
  total: { amount: number; currency: string };
  createdAt: string;
  updatedAt: string;
}

export const OrderService = {
  /**
   * Submit a checkout order.
   * STR-01: Uses actual SKU from CartItem, not variantId.
   * SEC-05: totalAmount is computed server-side — the client value is advisory only.
   */
  checkout: async (
    customer: OrderCustomer,
    cartItems: CartItem[]
  ): Promise<OrderResult> => {
    const payload = {
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
      },
      items: cartItems.map((item) => ({
        productId: item.productId,
        sku: item.sku,  // STR-01: Real SKU from cart, not variantId
        productName: item.productSnapshot.name,
        variantColor: item.productSnapshot.color || "",
        size: item.size,
        quantity: item.quantity,
        // unitPrice is sent for display only — server ignores it (SEC-05/06)
        unitPrice: item.productSnapshot.price.amount,
      })),
    };

    const res = await apiFetch<{ data: OrderResult }>(`${API_BASE}/orders`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!res?.data) {
      throw new Error("فشل إنشاء الطلب");
    }

    // @ts-ignore
    return res.data.data || res.data;
  },

  /**
   * Fetch all orders for admin dashboard.
   * Calls GET /api/admin/orders (requires admin session).
   */
  getOrders: async (): Promise<Order[]> => {
    const res = await apiFetch<{ data: { orders: Order[] } }>(`${API_BASE}/admin/orders`, {
      context: "admin",
    });
    
    // @ts-ignore
    const orders = res?.data?.data?.orders || res?.data?.orders || [];
    return orders.map((o: Record<string, unknown>) => ({
      ...o,
      total: { amount: (o.totalAmount as number) || 0, currency: "EGP" },
      customer: o.customer || { name: (o as Record<string, unknown>).customerName || "—", phone: (o as Record<string, unknown>).customerPhone || "" },
    }));
  },

  /**
   * Update order status from admin.
   * Calls PATCH /api/admin/orders/[id] with CSRF header.
   */
  updateStatus: async (id: string, status: string): Promise<void> => {
    await apiFetch(`${API_BASE}/admin/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
      context: "admin",
    });
  },
};
