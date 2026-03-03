import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const adminCount = await prisma.admin.count();
    return NextResponse.json({ ok: true, adminCount });
  } catch (error) {
    console.error("DB health check failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
