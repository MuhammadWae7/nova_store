/**
 * REMOVED — Section mutation endpoints have moved to:
 * PATCH /api/admin/taxonomy/sections/[id]
 * DELETE /api/admin/taxonomy/sections/[id]
 */
import { NextResponse } from "next/server";

export async function PATCH() {
  return NextResponse.json(
    { success: false, error: "This endpoint has moved to /api/admin/taxonomy/sections/[id]" },
    { status: 410 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: "This endpoint has moved to /api/admin/taxonomy/sections/[id]" },
    { status: 410 }
  );
}
