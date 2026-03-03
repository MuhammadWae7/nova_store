import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/server/services/auth-service";
import { errorResponse } from "@/server/lib/errors";
import { getClientIP } from "@/server/middleware/rate-limiter";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();
    const ip = getClientIP(request);

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "بيانات غير مكتملة" },
        { status: 400 },
      );
    }

    const sessionData = await authService.setPasswordWithToken(
      token,
      password,
      ip,
    );

    return NextResponse.json({ success: true, data: sessionData });
  } catch (error) {
    return errorResponse(error);
  }
}
