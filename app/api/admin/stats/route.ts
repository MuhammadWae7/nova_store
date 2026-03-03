/**
 * GET /api/admin/stats — Dashboard statistics
 * MISS-01: Returns real counts instead of placeholders.
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/middleware/auth-guard";
import { errorResponse } from "@/server/lib/errors";
import { prisma } from "@/server/db/client";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const url = new URL(request.url);
    const daysParam = url.searchParams.get("days");

    // Optional time-windowing
    let dateFilter = {};
    if (daysParam) {
      const days = parseInt(daysParam, 10);
      if (!isNaN(days) && days > 0) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        dateFilter = { createdAt: { gte: startDate } };
      }
    }

    const [activeProducts, statusCounts, totalRevenueArg] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { status: true },
        where: dateFilter,
      }),
      prisma.order.aggregate({
        where: {
          status: { in: ["DELIVERED", "SHIPPED", "PROCESSING"] },
          ...dateFilter,
        },
        _sum: { totalAmount: true },
      }),
    ]);

    let totalOrders = 0;
    let pendingOrders = 0;
    let processingOrders = 0;
    let deliveredOrders = 0;

    for (const group of statusCounts) {
      totalOrders += group._count.status;
      if (group.status === "PENDING") pendingOrders = group._count.status;
      if (group.status === "PROCESSING") processingOrders = group._count.status;
      if (group.status === "DELIVERED") deliveredOrders = group._count.status;
    }

    return NextResponse.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        processingOrders,
        deliveredOrders,
        activeProducts,
        totalRevenue: totalRevenueArg._sum.totalAmount || 0,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
