import { AppError } from "@/server/lib/errors";

interface ApiOptions extends RequestInit {
  context?: "admin" | "storefront";
}

/**
 * Generic API client wrapper that automatically applies:
 * - credentials: "include"
 * - X-Requested-With: XMLHttpRequest (for mutations only)
 * - Centralized 401 redirect logic depending on the context
 * - Standardized error parsing expecting { success: false, error: "Arabic msg" }
 */
export async function apiFetch<T>(url: string, options: ApiOptions = {}): Promise<{ data: T } | null> {
  const { context = "storefront", ...fetchOptions } = options;
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(fetchOptions.method || "GET");

  const headers = new Headers(fetchOptions.headers || {});
  if (isMutation) {
    headers.set("X-Requested-With", "XMLHttpRequest");
    if (!headers.has("Content-Type") && !(fetchOptions.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
  }

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: "include", // ALWAYS include credentials
    });

    if (res.status === 401) {
      if (context === "admin") {
        // Hard redirect to login only if this call explicitly came from an admin context
        if (typeof window !== "undefined") {
          window.location.href = "/admin/login";
        }
        return null;
      }
      // Storefront handles 401s gracefully
      throw new Error("غير مصرح");
    }

    if (res.status === 403) {
      const data = await res.json().catch(() => ({}));
      const msg = data.error || "مرفوض - لا تملك الصلاحية";
      throw new Error(msg);
    }

    if (res.status === 404 || res.status === 410) {
       const data = await res.json().catch(() => ({}));
       throw new Error(data.error || "المورد غير موجود");
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "حدث خطأ غير متوقع");
    }

    // 204 No Content
    if (res.status === 204) {
        return { data: {} as T };
    }

    const data = await res.json();
    if (data.success === false) {
      throw new Error(data.error || "حدث خطأ غير متوقع");
    }

    return data;
  } catch (error: any) {
    // Optionally surface standard UI toast based on error.message here
    console.error(`API Error [${fetchOptions.method || "GET"} ${url}]:`, error.message);
    throw error;
  }
}
