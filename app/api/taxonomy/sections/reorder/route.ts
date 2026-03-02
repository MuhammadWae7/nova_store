/**
 * REMOVED — Section reorder endpoint has moved to:
 * POST /api/admin/taxonomy/sections/reorder
 */
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { success: false, error: "This endpoint has moved to /api/admin/taxonomy/sections/reorder" },
    { status: 410 }
  );
}
