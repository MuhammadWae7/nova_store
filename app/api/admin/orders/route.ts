/**
 * Admin Orders API
 * GET /api/admin/orders — List orders (paginated)
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/middleware/auth-guard";
import { orderService } from "@/server/services/order-service";
import { errorResponse } from "@/server/lib/errors";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const status = searchParams.get("status") || undefined;

    const result = await orderService.getAll(page, limit, status);

    return NextResponse.json({
      success: true,
      orders: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
