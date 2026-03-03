"use client";

import { useState, useEffect } from "react";
import { AdminFrontendService, Admin } from "@/services/admin-service";
import { Button } from "@/components/ui/button";
import { Plus, Users, Edit, KeyRound, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { AdminModal } from "./admin-modal";

export default function AdminsSettingsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const data = await AdminFrontendService.getAll();
      setAdmins(data);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleToggleActive = async (admin: Admin) => {
    try {
      await AdminFrontendService.update(admin.id, { isActive: !admin.isActive });
      await loadAdmins();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleIssueResetToken = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من إصدار رابط إعادة تعيين كلمة المرور لـ ${name}؟`)) return;
    try {
      const { resetUrl } = await AdminFrontendService.issueResetToken(id);
      // In a real app, this should be sent via email. 
      // Since we don't have an email provider configured, we display it to the SUPER_ADMIN to copy.
      prompt("انسخ هذا الرابط وشاركه بشكل آمن مع المدير:", window.location.origin + resetUrl);
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-neutral-400">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-white" />
          <h1 className="text-3xl font-bold text-white">إدارة المديرين</h1>
        </div>
        <Button 
          variant="luxury" 
          onClick={() => {
            setEditingAdmin(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="ml-2 h-4 w-4" /> مدير جديد
        </Button>
      </div>

      <div className="rounded-lg border border-white/10 bg-neutral-900 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-right">
              <th className="px-4 py-3 text-xs font-medium text-neutral-400 uppercase">المدير</th>
              <th className="px-4 py-3 text-xs font-medium text-neutral-400 uppercase">البريد الإلكتروني</th>
              <th className="px-4 py-3 text-xs font-medium text-neutral-400 uppercase">الدور</th>
              <th className="px-4 py-3 text-xs font-medium text-neutral-400 uppercase">الحالة</th>
              <th className="px-4 py-3 text-xs font-medium text-neutral-400 uppercase">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{admin.name}</div>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-300">{admin.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                    admin.role === "SUPER_ADMIN" ? "bg-accent/20 text-accent" : 
                    admin.role === "ADMIN" ? "bg-blue-500/20 text-blue-400" :
                    admin.role === "EDITOR" ? "bg-purple-500/20 text-purple-400" :
                    "bg-neutral-500/20 text-neutral-400"
                  }`}>
                    {admin.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {admin.isActive ? (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> نشط
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-red-400">
                      <XCircle className="h-3.5 w-3.5" /> معطل
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setEditingAdmin(admin);
                        setIsModalOpen(true);
                      }}
                    >
                      تعديل <Edit className="mr-1.5 w-3 h-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleToggleActive(admin)}
                      className={admin.isActive ? "text-red-400 hover:text-red-300" : "text-green-400 hover:text-green-300"}
                    >
                      {admin.isActive ? "تعطيل" : "تفعيل"}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-amber-400 hover:text-amber-300"
                      onClick={() => handleIssueResetToken(admin.id, admin.name)}
                    >
                      إعادة التعيين <KeyRound className="mr-1.5 w-3 h-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-neutral-400">
                  لا يوجد مديرين
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadAdmins}
        admin={editingAdmin}
      />
    </div>
  );
}
