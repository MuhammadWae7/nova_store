/**
 * POST /api/auth/login
 * Authenticates admin with email + password.
 */
import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/server/services/auth-service";
import { validateBody } from "@/server/middleware/validate";
import { loginSchema } from "@/server/schemas/auth.schema";
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

    // Rate limit (SEC-08: DB-backed)
    const rateCheck = await checkRateLimit(`login:${ip}`, RATE_LIMITS.login);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: "محاولات كثيرة. حاول بعد 15 دقيقة." },
        { status: 429 }
      );
    }

    const { email, password } = await validateBody(request, loginSchema);
    const admin = await authService.login(email, password, ip);

    return NextResponse.json({ success: true, data: admin });
  } catch (error) {
    return errorResponse(error);
  }
}
