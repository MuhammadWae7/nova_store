/**
 * REMOVED — Category reorder endpoint has moved to:
 * POST /api/admin/taxonomy/categories/reorder
 */
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { success: false, error: "This endpoint has moved to /api/admin/taxonomy/categories/reorder" },
    { status: 410 }
  );
}
