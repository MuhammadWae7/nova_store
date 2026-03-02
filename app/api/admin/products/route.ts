/**
 * Admin Products API
 * GET /api/admin/products — List all products (paginated) (PERF-02)
 * POST /api/admin/products — Create product
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/middleware/auth-guard";
import { productService } from "@/server/services/product-service";
import { validateBody } from "@/server/middleware/validate";
import { createProductSchema } from "@/server/schemas/product.schema";
import { errorResponse } from "@/server/lib/errors";
import { validateCsrf } from "@/server/middleware/csrf";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;

    const result = await productService.getAllAdmin(page, limit);

    return NextResponse.json({
      success: true,
      products: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const csrf = validateCsrf(request);
    if (!csrf.valid) {
      return NextResponse.json({ success: false, error: csrf.error }, { status: 403 });
    }

    const session = await requireAdmin();
    const data = await validateBody(request, createProductSchema);
    const product = await productService.create(data as never, session.adminId!);

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
