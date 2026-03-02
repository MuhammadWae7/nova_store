/**
 * Admin Taxonomy — Section Detail
 * PATCH  /api/admin/taxonomy/sections/[id] — Update section (rename/toggle)
 * DELETE /api/admin/taxonomy/sections/[id] — Delete section
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/middleware/auth-guard";
import { taxonomyService } from "@/server/services/taxonomy-service";
import { errorResponse } from "@/server/lib/errors";
import { validateCsrf } from "@/server/middleware/csrf";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const csrf = validateCsrf(request);
    if (!csrf.valid) {
      return NextResponse.json({ success: false, error: csrf.error }, { status: 403 });
    }

    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const section = await taxonomyService.updateSection(id, body);
    return NextResponse.json({ success: true, data: section });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const csrf = validateCsrf(request);
    if (!csrf.valid) {
      return NextResponse.json({ success: false, error: csrf.error }, { status: 403 });
    }

    await requireAdmin();
    const { id } = await params;
    const force = new URL(request.url).searchParams.get("force") === "true";

    await taxonomyService.deleteSection(id, force);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
