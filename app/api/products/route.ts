/**
 * GET /api/products — Public product listing
 * MISS-03, PERF-01: Supports search, filtering, and pagination.
 */
import { NextRequest, NextResponse } from "next/server";
import { productService } from "@/server/services/product-service";
import { errorResponse } from "@/server/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const result = await productService.getAll({
      page: Number(searchParams.get("page")) || 1,
      limit: Number(searchParams.get("limit")) || 20,
      search: searchParams.get("search") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      gender: searchParams.get("gender") || undefined,
    });

    return NextResponse.json({
      success: true,
      products: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
