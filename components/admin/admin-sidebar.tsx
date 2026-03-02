"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingBag,
  type LucideIcon,
  FileText,
  Settings,
  LogOut,
  AlertCircle,
  Package,
  Layers,
} from "lucide-react";
import { useState } from "react";

interface SidebarItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

const items: SidebarItem[] = [
  {
    title: "لوحة التحكم", // Dashboard
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "الطلبات", // Orders
    href: "/admin/orders",
    icon: Package,
  },
  {
    title: "المنتجات", // Products
    href: "/admin/products",
    icon: ShoppingBag,
  },
  {
    title: "الأقسام والتصنيفات", // Sections & Categories
    href: "/admin/taxonomy",
    icon: Layers,
  },
  {
    title: "المحتوى", // Content
    href: "/admin/content",
    icon: FileText,
  },
  {
    title: "الإعدادات", // Settings
    href: "/admin/settings",
    icon: Settings,
  },
];

interface AdminSidebarProps {
  className?: string;
  onClose?: () => void;
}

export function AdminSidebar({ className, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /**
   * STR-04: Real logout — calls POST /api/auth/logout and redirects to /admin/login.
   */
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "X-Requested-With": "XMLHttpRequest" },
        credentials: "include",
      });
    } catch {
      // Even if the logout call fails, redirect anyway
    }
    router.replace("/admin/login");
  };

  return (
    <aside
      className={cn(
        "flex flex-col w-64 min-h-screen bg-neutral-900 border-l border-white/10",
        className,
      )}
    >
      {/* Brand */}
      <div className="p-6 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-xl font-bold text-white">نوفا</span>
          <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded">
            لوحة التحكم
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-white/5",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer — Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-50"
        >
          <LogOut className="h-5 w-5" />
          <span>{isLoggingOut ? "جاري الخروج..." : "تسجيل الخروج"}</span>
        </button>
      </div>
    </aside>
  );
}
