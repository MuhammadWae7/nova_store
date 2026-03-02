import { prisma } from "@/server/db/client";
import type { AuditAction } from "@/server/generated/prisma";

interface AuditLogEntry {
  adminId?: string;
  action: AuditAction | string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export const auditService = {
  /**
   * Create an audit log entry. Fire-and-forget — failures are logged but don't throw.
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          adminId: entry.adminId || null,
          action: entry.action as AuditAction,
          entity: entry.entity,
          entityId: entry.entityId || null,
          details: (entry.details as any) || undefined,
          ipAddress: entry.ipAddress || null,
        },
      });
    } catch (err) {
      // Audit log failures must never break the main operation
      console.error("[AUDIT] Failed to write audit log:", err);
    }
  },

  /**
   * Get audit logs with filtering and pagination.
   */
  async getAll(
    page = 1,
    limit = 50,
    filters?: { action?: string; adminId?: string; entity?: string },
  ) {
    const where: Record<string, unknown> = {};
    if (filters?.action) where.action = filters.action;
    if (filters?.adminId) where.adminId = filters.adminId;
    if (filters?.entity) where.entity = filters.entity;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          admin: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};
