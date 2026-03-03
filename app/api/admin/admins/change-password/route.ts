import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/middleware/auth-guard";
import { authService } from "@/server/services/auth-service";
import { errorResponse } from "@/server/lib/errors";
import { validateCsrf } from "@/server/middleware/csrf";
import { getClientIP } from "@/server/middleware/rate-limiter";
import { z } from "zod";
import { validateBody } from "@/server/middleware/validate";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  newPassword: z
    .string()
    .min(8, "كلمة المرور الجديدة يجب أن تتكون من 8 أحرف على الأقل"),
});

export async function POST(request: NextRequest) {
  try {
    const csrf = validateCsrf(request);
    if (!csrf.valid) {
      return NextResponse.json(
        { success: false, error: csrf.error },
        { status: 403 },
      );
    }

    // Any logged-in admin can change their own password
    const session = await requireAdmin();
    const ip = getClientIP(request);

    const body = await validateBody(request, changePasswordSchema);

    await authService.changeOwnPassword(
      session.adminId!,
      body.currentPassword,
      body.newPassword,
      ip,
    );

    return NextResponse.json({
      success: true,
      data: { message: "تم تغيير كلمة المرور بنجاح" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
