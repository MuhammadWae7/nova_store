import { AdminRole } from "@/server/generated/prisma/index.js";

// Note: frontend should not import from server directly, so we redefine minimal types here.
export type Admin = {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "VIEWER";
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
};

export const AdminFrontendService = {
  async getAll(): Promise<Admin[]> {
    const res = await fetch("/api/admin/admins");
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "فشل في جلب المديرين");
    return json.data;
  },

  async invite(data: {
    name: string;
    email: string;
    role: string;
  }): Promise<{ setupUrl: string }> {
    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "فشل في دعوة المدير");
    return json.data;
  },

  async update(
    id: string,
    data: { role?: string; isActive?: boolean },
  ): Promise<Admin> {
    const res = await fetch(`/api/admin/admins/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "فشل في تحديث المدير");
    return json.data;
  },

  async issueResetToken(id: string): Promise<{ resetUrl: string }> {
    const res = await fetch(`/api/admin/admins/${id}/reset-password`, {
      method: "POST",
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "فشل في إصدار الرابط");
    return json.data;
  },
};
