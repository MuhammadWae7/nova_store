import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/middleware/auth-guard";
import { prisma } from "@/server/db/client";
import { errorResponse, NotFoundError } from "@/server/lib/errors";
import { auditService } from "@/server/services/audit-service";
import { validateCsrf } from "@/server/middleware/csrf";

/**
 * GET /api/admin/content — Get all CMS content
 */
export async function GET() {
  try {
    await requireAdmin();
    const content = await prisma.siteContent.findMany();

    // Transform array into key-value object
    const result: Record<string, unknown> = {};
    for (const item of content) {
      result[item.key] = item.value;
    }

    return Response.json({ success: true, data: result });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * PUT /api/admin/content — Update CMS content by key (SEC-04: CSRF validated)
 */
export async function PUT(request: NextRequest) {
  try {
    const csrf = validateCsrf(request);
    if (!csrf.valid) {
      return NextResponse.json(
        { success: false, error: csrf.error },
        { status: 403 },
      );
    }

    const session = await requireAdmin();

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON" },
        { status: 400 },
      );
    }

    const { key, value } = body;
    if (!key || value === undefined) {
      return NextResponse.json(
        { success: false, error: "key and value are required" },
        { status: 400 },
      );
    }

    const existing = await prisma.siteContent.findUnique({
      where: { key: key },
    });

    if (!existing) {
      throw new NotFoundError("المحتوى");
    }

    const updated = await prisma.siteContent.update({
      where: { key: body.key },
      data: { value: body.value as never },
    });

    await auditService.log({
      adminId: session.adminId,
      action: "CONTENT_UPDATE",
      entity: "content",
      entityId: body.key,
      details: { key: body.key },
    });

    return Response.json({ success: true, data: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
