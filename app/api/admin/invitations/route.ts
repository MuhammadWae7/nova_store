/**
 * POST /api/admin/invitations — Create invitation token for admin password setup
 * SEC-03: Only SUPER_ADMIN can create invitation tokens.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/middleware/auth-guard";
import { authService } from "@/server/services/auth-service";
import { errorResponse } from "@/server/lib/errors";
import { validateCsrf } from "@/server/middleware/csrf";
import { getClientIP } from "@/server/middleware/rate-limiter";
import { z } from "zod";
import { validateBody } from "@/server/middleware/validate";

const createInvitationSchema = z.object({
  adminId: z.string().min(1, "معرّف المدير مطلوب"),
});

export async function POST(request: NextRequest) {
  try {
    // CSRF check
    const csrf = validateCsrf(request);
    if (!csrf.valid) {
      return NextResponse.json({ success: false, error: csrf.error }, { status: 403 });
    }

    // Only SUPER_ADMIN can create invitations
    const session = await requireRole("SUPER_ADMIN");
    const ip = getClientIP(request);

    const { adminId } = await validateBody(request, createInvitationSchema);

    const result = await authService.createInvitationToken(adminId, session.adminId!, ip);

    return NextResponse.json({
      success: true,
      data: {
        token: result.token,
        email: result.email,
        expiresAt: result.expiresAt,
        setupUrl: `/admin/set-password?token=${result.token}`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
