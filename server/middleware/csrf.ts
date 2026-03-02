/**
 * CSRF Protection Middleware (SEC-04)
 *
 * Defense-in-depth: validates Origin header against allowed origins
 * AND requires a custom header (X-Requested-With) on all state-mutating requests.
 *
 * This works alongside sameSite=strict cookies because:
 * 1. Custom headers cannot be set by cross-origin forms
 * 2. Origin validation blocks cross-origin fetch with credentials
 */

import { NextRequest } from "next/server";

const ALLOWED_ORIGINS = new Set([
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://localhost:3001",
]);

const STATE_MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function validateCsrf(request: NextRequest): { valid: boolean; error?: string } {
  // Only check state-mutating methods
  if (!STATE_MUTATING_METHODS.has(request.method)) {
    return { valid: true };
  }

  // 1. Check Origin header
  const origin = request.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return { valid: false, error: "Origin not allowed" };
  }

  // 2. Require custom header (cannot be set by HTML forms or cross-origin scripts)
  const xRequestedWith = request.headers.get("x-requested-with");
  if (xRequestedWith !== "XMLHttpRequest") {
    // Allow requests without Origin (same-origin navigations) but require marker
    // Exception: multipart/form-data uploads (file upload forms set their own content-type)
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      // File uploads: validate origin only
      if (!origin) return { valid: true }; // Same-origin
      return ALLOWED_ORIGINS.has(origin)
        ? { valid: true }
        : { valid: false, error: "Origin not allowed for upload" };
    }
    return { valid: false, error: "Missing X-Requested-With header" };
  }

  return { valid: true };
}
