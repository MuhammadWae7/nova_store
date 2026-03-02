"use client";

import { useState } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-black" dir="rtl">
      {/* Desktop Sidebar */}
      <AdminSidebar className="hidden md:flex" />

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity md:hidden ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      >
        <div 
          className={`absolute right-0 h-full transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <AdminSidebar onClose={() => setSidebarOpen(false)} />
        </div>
      </div>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-16 items-center border-b border-white/10 px-4 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-white" />
          </Button>
          <h1 className="mr-4 text-lg font-bold text-white">لوحة التحكم</h1>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
        </div>
      </main>
    </div>
  );
}
