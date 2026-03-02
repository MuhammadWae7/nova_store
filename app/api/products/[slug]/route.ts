import { NextRequest } from "next/server";
import { productService } from "@/server/services/product-service";
import { errorResponse } from "@/server/lib/errors";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/products/[slug] — Public product detail by slug
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const product = await productService.getBySlug(slug);
    return Response.json({ success: true, data: product });
  } catch (error) {
    return errorResponse(error);
  }
}
