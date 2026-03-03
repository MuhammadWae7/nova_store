import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/middleware/auth-guard";
import { adminService } from "@/server/services/admin-service";
import { errorResponse } from "@/server/lib/errors";
import { validateCsrf } from "@/server/middleware/csrf";
import { getClientIP } from "@/server/middleware/rate-limiter";

export async function POST(
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
    // Only SUPER_ADMIN can issue password reset tokens for other admins
    const session = await requireRole("SUPER_ADMIN");
    const ip = getClientIP(request);

    const result = await adminService.issueResetToken(session.adminId!, id, ip);

    return NextResponse.json({
      success: true,
      data: {
        token: result.token,
        email: result.email,
        expiresAt: result.expiresAt,
        resetUrl: `/admin/set-password?token=${result.token}`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
