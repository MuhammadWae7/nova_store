/**
 * POST /api/orders — Customer checkout
 * SEC-05/06: totalAmount and unitPrice from client are IGNORED.
 * Server fetches real prices from DB and recalculates.
 */
import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/server/services/order-service";
import { validateBody } from "@/server/middleware/validate";
import { checkoutSchema } from "@/server/schemas/order.schema";
import { errorResponse } from "@/server/lib/errors";
import {
  checkRateLimit,
  getClientIP,
  RATE_LIMITS,
} from "@/server/middleware/rate-limiter";
import { validateCsrf } from "@/server/middleware/csrf";

export async function POST(request: NextRequest) {
  try {
    // CSRF check (SEC-04)
    const csrf = validateCsrf(request);
    if (!csrf.valid) {
      return NextResponse.json(
        { success: false, error: csrf.error },
        { status: 403 },
      );
    }

    const ip = getClientIP(request);

    // Rate limit (SEC-08: DB-backed)
    const rateCheck = await checkRateLimit(
      `checkout:${ip}`,
      RATE_LIMITS.checkout,
    );
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: "محاولات كثيرة. حاول لاحقاً." },
        { status: 429 },
      );
    }

    const data = await validateBody(request, checkoutSchema);
    const order = await orderService.createOrder(data);

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount, // Server-computed total
        status: order.status,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
