/**
 * Admin Products API
 * GET  /api/admin/products — List products (any authenticated admin)
 * POST /api/admin/products — Create product (ADMIN+ only)
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireRole } from "@/server/middleware/auth-guard";
import { productService } from "@/server/services/product-service";
import { validateBody } from "@/server/middleware/validate";
import { createProductSchema } from "@/server/schemas/product.schema";
import { errorResponse } from "@/server/lib/errors";
import { validateCsrf } from "@/server/middleware/csrf";

export async function GET() {
  try {
    await requireAdmin();
    const products = await productService.getAllAdmin();
    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const csrf = validateCsrf(request);
    if (!csrf.valid) {
      return NextResponse.json(
        { success: false, error: csrf.error },
        { status: 403 },
      );
    }

    const session = await requireRole("SUPER_ADMIN", "ADMIN");
    const data = await validateBody(request, createProductSchema);

    const product = await productService.create(
      data as never,
      session.adminId!,
    );
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
