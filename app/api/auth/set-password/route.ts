/**
 * POST /api/auth/set-password
 * SEC-03: Requires a valid invitation token. No email-only access.
 * SEC-04: CSRF validation on this state-mutating endpoint.
 */
import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/server/services/auth-service";
import { validateBody } from "@/server/middleware/validate";
import { setPasswordSchema } from "@/server/schemas/auth.schema";
import { errorResponse } from "@/server/lib/errors";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/server/middleware/rate-limiter";
import { validateCsrf } from "@/server/middleware/csrf";

export async function POST(request: NextRequest) {
  try {
    // CSRF check (SEC-04)
    const csrf = validateCsrf(request);
    if (!csrf.valid) {
      return NextResponse.json(
        { success: false, error: csrf.error },
        { status: 403 }
      );
    }

    const ip = getClientIP(request);

    // Rate limit
    const rateCheck = await checkRateLimit(`set-password:${ip}`, RATE_LIMITS.setPassword);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: "محاولات كثيرة. حاول لاحقاً." },
        { status: 429 }
      );
    }

    const data = await validateBody(request, setPasswordSchema);

    // SEC-03: Use token-based flow, not email
    const admin = await authService.setPasswordWithToken(
      data.token,
      data.password,
      ip
    );

    return NextResponse.json({ success: true, data: admin });
  } catch (error) {
    return errorResponse(error);
  }
}
