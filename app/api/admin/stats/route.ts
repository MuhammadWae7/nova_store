/**
 * GET /api/admin/stats — Dashboard statistics
 * MISS-01: Returns real counts instead of placeholders.
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/middleware/auth-guard";
import { errorResponse } from "@/server/lib/errors";
import { prisma } from "@/server/db/client";

export async function GET() {
  try {
    await requireAdmin();

    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      activeProducts,
      totalRevenue,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "PROCESSING" } }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.aggregate({
        where: { status: { in: ["DELIVERED", "SHIPPED", "PROCESSING"] } },
        _sum: { totalAmount: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        processingOrders,
        deliveredOrders,
        activeProducts,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
