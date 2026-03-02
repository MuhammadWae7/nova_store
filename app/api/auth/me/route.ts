import { authService } from "@/server/services/auth-service";
import { errorResponse } from "@/server/lib/errors";

export async function GET() {
  try {
    const admin = await authService.getCurrentAdmin();

    if (!admin) {
      return Response.json({ success: false, data: null }, { status: 401 });
    }

    return Response.json({ success: true, data: admin });
  } catch (error) {
    return errorResponse(error);
  }
}
