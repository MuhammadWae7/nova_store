/**
 * GET /api/taxonomy/categories — Active categories for a section (storefront).
 * Public endpoint — returns only isActive=true categories.
 *
 * POST is explicitly handled to return 410 Gone (moved to /api/admin/taxonomy/categories).
 */
import { NextRequest, NextResponse } from "next/server";
import { taxonomyService } from "@/server/services/taxonomy-service";
import { errorResponse } from "@/server/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const sectionId = new URL(request.url).searchParams.get("sectionId");
    if (!sectionId) {
      return NextResponse.json({ success: false, error: "sectionId مطلوب" }, { status: 400 });
    }

    const categories = await taxonomyService.getActiveCategories(sectionId);
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: "This endpoint has moved to /api/admin/taxonomy/categories" },
    { status: 410 }
  );
}
