import { useState, useEffect } from "react";
import { Admin, AdminFrontendService } from "@/services/admin-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  admin: Admin | null; // null for create, object for edit
}

export function AdminModal({ isOpen, onClose, onSuccess, admin }: AdminModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(admin?.name || "");
  const [email, setEmail] = useState(admin?.email || "");
  const [role, setRole] = useState<Admin["role"]>(admin?.role || "VIEWER");

  // Reset local state when modal opens/closes or admin changes
  useEffect(() => {
    if (isOpen) {
      setName(admin?.name || "");
      setEmail(admin?.email || "");
      setRole(admin?.role || "VIEWER");
      setError(null);
    }
  }, [isOpen, admin]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (admin) {
        // Edit mode (only role can be modified via this modal, email/name fixed for safety initially)
        await AdminFrontendService.update(admin.id, { role });
        onSuccess();
        onClose();
      } else {
        // Create mode
        const { setupUrl } = await AdminFrontendService.invite({ name, email, role });
        onSuccess();
        onClose();
        
        // Show setup link to SUPER_ADMIN so they can copy it
        prompt("المدير تم إنشاؤه. انسخ هذا الرابط وشاركه بشكل آمن:", window.location.origin + setupUrl);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-neutral-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h2 className="text-xl font-bold tracking-tight text-white">
            {admin ? "تعديل صلاحية المدير" : "إضافة مدير جديد"}
          </h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-white/10 text-neutral-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">الاسم</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!!admin || loading}
              className="bg-black/50 border-white/10 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">البريد الإلكتروني</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!admin || loading}
              className="bg-black/50 border-white/10 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">الصلاحية (الدور)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Admin["role"])}
              disabled={loading}
              className="flex h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="SUPER_ADMIN">مدير عام (SUPER_ADMIN)</option>
              <option value="ADMIN">مدير (ADMIN)</option>
              <option value="EDITOR">محرر (EDITOR)</option>
              <option value="VIEWER">مشاهد (VIEWER)</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              إلغاء
            </Button>
            <Button type="submit" variant="luxury" disabled={loading}>
              {loading ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
