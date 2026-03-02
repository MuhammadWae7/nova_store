/**
 * Admin Order Detail API
 * GET /api/admin/orders/[id]
 * PATCH /api/admin/orders/[id] — Update order status
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/middleware/auth-guard";
import { orderService } from "@/server/services/order-service";
import { validateBody } from "@/server/middleware/validate";
import { updateOrderStatusSchema } from "@/server/schemas/order.schema";
import { errorResponse } from "@/server/lib/errors";
import { validateCsrf } from "@/server/middleware/csrf";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const order = await orderService.getById(id);
    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const csrf = validateCsrf(request);
    if (!csrf.valid) {
      return NextResponse.json({ success: false, error: csrf.error }, { status: 403 });
    }

    const session = await requireAdmin();
    const { id } = await params;
    const data = await validateBody(request, updateOrderStatusSchema);

    const order = await orderService.updateStatus(id, data, session.adminId!);
    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    return errorResponse(error);
  }
}
