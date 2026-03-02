/**
 * REMOVED — Category mutation endpoints have moved to:
 * PATCH /api/admin/taxonomy/categories/[id]
 * DELETE /api/admin/taxonomy/categories/[id]
 */
import { NextResponse } from "next/server";

export async function PATCH() {
  return NextResponse.json(
    { success: false, error: "This endpoint has moved to /api/admin/taxonomy/categories/[id]" },
    { status: 410 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: "This endpoint has moved to /api/admin/taxonomy/categories/[id]" },
    { status: 410 }
  );
}
