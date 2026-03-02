import { prisma } from "@/server/db/client";
import { errorResponse } from "@/server/lib/errors";

/**
 * GET /api/content — Public CMS content endpoint
 */
export async function GET() {
  try {
    const content = await prisma.siteContent.findMany();

    // Transform array into key-value object
    const result: Record<string, unknown> = {};
    for (const item of content) {
      result[item.key] = item.value;
    }

    return Response.json({ success: true, data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
