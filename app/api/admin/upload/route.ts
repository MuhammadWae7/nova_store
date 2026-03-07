/**
 * POST /api/admin/upload — Image upload (ADMIN+ only)
 * Uses platform-agnostic storage adapter (S3-compatible or local dev).
 * Validates file type and size. Returns public URL.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/middleware/auth-guard";
import { errorResponse, AppError } from "@/server/lib/errors";
import { auditService } from "@/server/services/audit-service";
import { logger } from "@/server/lib/logger";
import { getStorage } from "@/server/lib/storage";
import { randomBytes } from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("SUPER_ADMIN", "ADMIN");

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      throw new AppError(400, "لم يتم رفع ملف");
    }

    // Validate file type
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new AppError(
        400,
        "نوع الملف غير مدعوم. يُسمح بـ JPEG, PNG, WebP, AVIF فقط.",
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new AppError(400, "حجم الملف يتجاوز الحد المسموح (5MB)");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const uniqueName = `${randomBytes(16).toString("hex")}.${ext}`;
    const key = `uploads/${uniqueName}`;

    // Upload via platform-agnostic storage adapter
    const storage = getStorage();
    const publicUrl = await storage.upload(key, buffer, file.type);

    // Audit log
    await auditService.log({
      adminId: session.adminId!,
      action: "IMAGE_UPLOAD",
      entity: "image",
      entityId: uniqueName,
      details: {
        originalName: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
      },
    });

    return NextResponse.json({
      success: true,
      data: { url: publicUrl, name: uniqueName },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
