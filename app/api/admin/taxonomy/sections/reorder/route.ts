/**
 * POST /api/admin/taxonomy/sections/reorder — Reorder sections (admin only).
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/middleware/auth-guard";
import { taxonomyService } from "@/server/services/taxonomy-service";
import { errorResponse } from "@/server/lib/errors";
import { validateCsrf } from "@/server/middleware/csrf";

export async function POST(request: NextRequest) {
  try {
    const csrf = validateCsrf(request);
    if (!csrf.valid) {
      return NextResponse.json({ success: false, error: csrf.error }, { status: 403 });
    }

    await requireAdmin();

    const body = await request.json();
    if (!Array.isArray(body.items)) {
      return NextResponse.json({ success: false, error: "items مطلوبة" }, { status: 400 });
    }

    await taxonomyService.reorderSections(body.items);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
