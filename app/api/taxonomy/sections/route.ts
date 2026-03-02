/**
 * GET /api/taxonomy/sections — Active sections with active categories (storefront).
 * Public endpoint — returns only isActive=true sections.
 *
 * POST is explicitly handled to return 410 Gone (moved to /api/admin/taxonomy/sections).
 */
import { NextResponse } from "next/server";
import { taxonomyService } from "@/server/services/taxonomy-service";
import { errorResponse } from "@/server/lib/errors";

export async function GET() {
  try {
    const sections = await taxonomyService.getActiveSections();
    return NextResponse.json({ success: true, data: sections });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: "This endpoint has moved to /api/admin/taxonomy/sections" },
    { status: 410 }
  );
}
