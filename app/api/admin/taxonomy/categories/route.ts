/**
 * Admin Taxonomy — Categories
 * POST /api/admin/taxonomy/categories — Create category
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
    if (!body.name?.trim() || !body.sectionId) {
      return NextResponse.json(
        { success: false, error: "اسم التصنيف و القسم مطلوبان" },
        { status: 400 }
      );
    }

    const category = await taxonomyService.createCategory({
      name: body.name.trim(),
      sectionId: body.sectionId,
      sizeType: body.sizeType,
    });
    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
