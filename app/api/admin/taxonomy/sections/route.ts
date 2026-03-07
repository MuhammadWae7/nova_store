/**
 * Admin Taxonomy — Sections
 * GET  /api/admin/taxonomy/sections — All sections (any authenticated admin)
 * POST /api/admin/taxonomy/sections — Create section (ADMIN+ only)
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireRole } from "@/server/middleware/auth-guard";
import { taxonomyService } from "@/server/services/taxonomy-service";
import { errorResponse } from "@/server/lib/errors";
import { validateCsrf } from "@/server/middleware/csrf";

export async function GET() {
  try {
    await requireAdmin();
    const sections = await taxonomyService.getAllSections();
    return NextResponse.json({ success: true, data: sections });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const csrf = validateCsrf(request);
    if (!csrf.valid) {
      return NextResponse.json(
        { success: false, error: csrf.error },
        { status: 403 },
      );
    }

    await requireRole("SUPER_ADMIN", "ADMIN");

    const body = await request.json();
    if (!body.name?.trim()) {
      return NextResponse.json(
        { success: false, error: "اسم القسم مطلوب" },
        { status: 400 },
      );
    }

    const section = await taxonomyService.createSection(body.name.trim());
    return NextResponse.json({ success: true, data: section }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
