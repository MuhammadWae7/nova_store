/**
 * Admin Product Detail API
 * GET    /api/admin/products/[id] — Get product (any authenticated admin)
 * PUT    /api/admin/products/[id] — Update (ADMIN+ only)
 * DELETE /api/admin/products/[id] — Soft delete (ADMIN+ only)
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireRole } from "@/server/middleware/auth-guard";
import { productService } from "@/server/services/product-service";
import { validateBody } from "@/server/middleware/validate";
import { updateProductSchema } from "@/server/schemas/product.schema";
import { errorResponse } from "@/server/lib/errors";
import { validateCsrf } from "@/server/middleware/csrf";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const product = await productService.getById(id);
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const csrf = validateCsrf(request);
    if (!csrf.valid) {
      return NextResponse.json(
        { success: false, error: csrf.error },
        { status: 403 },
      );
    }

    const session = await requireRole("SUPER_ADMIN", "ADMIN");
    const { id } = await params;
    const data = await validateBody(request, updateProductSchema);

    const product = await productService.update(
      id,
      data as never,
      session.adminId!,
    );
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const csrf = validateCsrf(request);
    if (!csrf.valid) {
      return NextResponse.json(
        { success: false, error: csrf.error },
        { status: 403 },
      );
    }

    const session = await requireRole("SUPER_ADMIN", "ADMIN");
    const { id } = await params;

    await productService.delete(id, session.adminId!);
    return NextResponse.json({ success: true, message: "تم حذف المنتج بنجاح" });
  } catch (error) {
    return errorResponse(error);
  }
}
