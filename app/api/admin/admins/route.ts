import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/middleware/auth-guard";
import { adminService } from "@/server/services/admin-service";
import { errorResponse } from "@/server/lib/errors";
import { validateCsrf } from "@/server/middleware/csrf";
import { getClientIP } from "@/server/middleware/rate-limiter";
import { z } from "zod";
import { validateBody } from "@/server/middleware/validate";
import { AdminRole } from "@/server/generated/prisma";

const createAdminSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صالح"),
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"] as const),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole("ADMIN", "SUPER_ADMIN"); // Admins can view other admins
    const admins = await adminService.getAllAdmins();
    return NextResponse.json({ success: true, data: admins });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const csrf = validateCsrf(request);
    if (!csrf.valid) {
      return NextResponse.json(
        { success: false, error: csrf.error },
        { status: 403 },
      );
    }

    const session = await requireRole("SUPER_ADMIN");
    const ip = getClientIP(request);

    const body = await validateBody(request, createAdminSchema);

    // To prevent TypeScript error with role type
    const roleMap: Record<string, AdminRole> = {
      SUPER_ADMIN: "SUPER_ADMIN",
      ADMIN: "ADMIN",
      EDITOR: "EDITOR",
      VIEWER: "VIEWER",
    };

    const result = await adminService.inviteAdmin(
      session.adminId!,
      {
        ...body,
        role: roleMap[body.role],
      },
      ip,
    );

    return NextResponse.json({
      success: true,
      data: {
        admin: result.admin,
        setupUrl: `/admin/set-password?token=${result.token}`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
