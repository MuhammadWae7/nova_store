import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/middleware/auth-guard";
import { auditService } from "@/server/services/audit-service";
import { errorResponse } from "@/server/lib/errors";

/**
 * GET /api/admin/audit-logs — List audit logs with filtering
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const action = searchParams.get("action") || undefined;
    const adminId = searchParams.get("adminId") || undefined;
    const entity = searchParams.get("entity") || undefined;

    const result = await auditService.getAll(page, limit, {
      action,
      adminId,
      entity,
    });

    return Response.json({ success: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}
