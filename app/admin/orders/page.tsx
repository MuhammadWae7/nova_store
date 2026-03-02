"use client";

import { useEffect, useState } from "react";
import { Order, OrderService } from "@/services/order-service";
import { Button } from "@/components/ui/button";
import { Eye, Package, Truck, CheckCircle, XCircle, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const statusConfig = {
  pending: { label: "قيد الانتظار", color: "text-yellow-400", icon: Clock },
  processing: { label: "جاري التجهيز", color: "text-blue-400", icon: Package },
  shipped: { label: "تم الشحن", color: "text-purple-400", icon: Truck },
  delivered: { label: "تم التوصيل", color: "text-green-400", icon: CheckCircle },
  cancelled: { label: "ملغي", color: "text-red-400", icon: XCircle },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const data = await OrderService.getOrders();
      setOrders(data);
    } catch (e) {
      console.error("Failed to load orders:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id: string, newStatus: Order["status"]) => {
    await OrderService.updateStatus(id, newStatus);
    fetchOrders(); // Refresh local state immediately
  };

  if (loading) return <div className="text-white">Loading orders...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">الطلبات</h1>
        <div className="text-sm text-neutral-400">
            إجمالي الطلبات: <span className="text-white font-bold">{orders.length}</span>
        </div>
      </div>

      <div className="rounded-md border border-white/10 bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm text-neutral-300">
            <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-neutral-400">
              <tr>
                <th className="px-6 py-4">رقم الطلب</th>
                <th className="px-6 py-4">العميل</th>
                <th className="px-6 py-4">المنتجات</th>
                <th className="px-6 py-4">الإجمالي</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4">التاريخ</th>
                <th className="px-6 py-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map((order) => {
                  const StatusIcon = statusConfig[order.status].icon;
                  return (
                    <tr key={order.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 font-mono text-xs text-neutral-500">
                        #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-white">
                        <div className="font-medium">{order.customer.name}</div>
                        <div className="text-xs text-neutral-500">{order.customer.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                        <span className="text-white font-medium">{order.items.length}</span> منتجات
                    </td>
                    <td className="px-6 py-4 text-accent font-bold">
                        {order.total?.amount?.toLocaleString() || 0} {order.total?.currency || "EGP"}
                    </td>
                    <td className="px-6 py-4">
                        <div className={cn("flex items-center gap-2", statusConfig[order.status].color)}>
                            <StatusIcon className="h-4 w-4" />
                            <span>{statusConfig[order.status].label}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-500 text-xs">
                        {new Date(order.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-6 py-4">
                       <select 
                            className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-accent"
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value as Order["status"])}
                        >
                           {Object.entries(statusConfig).map(([key, config]) => (
                               <option key={key} value={key}>{config.label}</option>
                           ))}
                       </select>
                    </td>
                    </tr>
                  );
              })}
              {orders.length === 0 && (
                <tr>
                   <td colSpan={7} className="py-12 text-center text-neutral-500">
                       <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                       لا توجد طلبات حتى الآن.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
