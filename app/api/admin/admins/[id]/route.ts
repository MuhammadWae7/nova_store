import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/middleware/auth-guard";
import { adminService } from "@/server/services/admin-service";
import { errorResponse } from "@/server/lib/errors";
import { validateCsrf } from "@/server/middleware/csrf";
import { getClientIP } from "@/server/middleware/rate-limiter";
import { z } from "zod";
import { validateBody } from "@/server/middleware/validate";
import { AdminRole } from "@/server/generated/prisma/index.js";

const updateAdminSchema = z.object({
  role: z
    .enum(["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"] as const)
    .optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const csrf = validateCsrf(request);
    if (!csrf.valid) {
      return NextResponse.json(
        { success: false, error: csrf.error },
        { status: 403 },
      );
    }

    const { id } = await params;
    const session = await requireRole("SUPER_ADMIN");
    const ip = getClientIP(request);

    const body = await validateBody(request, updateAdminSchema);

    // To prevent TypeScript error with role type
    const roleMap: Record<string, AdminRole> = {
      SUPER_ADMIN: "SUPER_ADMIN",
      ADMIN: "ADMIN",
      EDITOR: "EDITOR",
      VIEWER: "VIEWER",
    };

    const data: any = {};
    if (body.role) data.role = roleMap[body.role];
    if (body.isActive !== undefined) data.isActive = body.isActive;

    const updated = await adminService.updateAdmin(
      session.adminId!,
      id,
      data,
      ip,
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
