/**
 * POST /api/auth/logout — Destroy admin session.
 * Requires an active session to destroy.
 */
import { NextResponse } from "next/server";
import { authService } from "@/server/services/auth-service";
import { requireAdmin } from "@/server/middleware/auth-guard";
import { errorResponse } from "@/server/lib/errors";

export async function POST() {
  try {
    await requireAdmin();
    await authService.logout();
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
