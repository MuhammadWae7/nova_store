/**
 * Admin Dashboard — MISS-01: Real stats from /api/admin/stats.
 */
"use client";

import { useState, useEffect } from "react";
import { Package, ShoppingBag, DollarSign, Clock, TrendingUp, Users } from "lucide-react";

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  deliveredOrders: number;
  activeProducts: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats", { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch {
        // Silently fail — show zeros
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "إجمالي الطلبات",
      value: stats?.totalOrders ?? 0,
      icon: Package,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "طلبات معلقة",
      value: stats?.pendingOrders ?? 0,
      icon: Clock,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "قيد التجهيز",
      value: stats?.processingOrders ?? 0,
      icon: TrendingUp,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "تم التوصيل",
      value: stats?.deliveredOrders ?? 0,
      icon: Users,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      title: "المنتجات النشطة",
      value: stats?.activeProducts ?? 0,
      icon: ShoppingBag,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
    },
    {
      title: "إجمالي الإيرادات",
      value: stats?.totalRevenue ?? 0,
      icon: DollarSign,
      color: "text-accent",
      bgColor: "bg-accent/10",
      isCurrency: true,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">لوحة التحكم</h1>
        <p className="text-neutral-400">مرحبًا بك في لوحة تحكم نوفا فاشن.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-white/10 bg-neutral-900/50 p-6 transition-all hover:border-white/20 hover:bg-neutral-900/80"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-neutral-400">{card.title}</h3>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
            <div className="text-3xl font-bold text-white">
              {loading ? (
                <div className="h-9 w-24 bg-neutral-800 rounded animate-pulse" />
              ) : card.isCurrency ? (
                `${(card.value).toLocaleString()} جنيه`
              ) : (
                card.value.toLocaleString()
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
