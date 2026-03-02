/**
 * REMOVED — Admin-only "all sections" endpoint has moved to:
 * GET /api/admin/taxonomy/sections
 *
 * This file is kept as a redirect stub for safety.
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { success: false, error: "This endpoint has moved to /api/admin/taxonomy/sections" },
    { status: 410 }
  );
}
