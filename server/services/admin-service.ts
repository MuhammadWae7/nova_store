import { prisma } from "@/server/db/client";
import { AppError } from "@/server/lib/errors";
import { authService } from "./auth-service";
import { auditService } from "./audit-service";
import { AdminRole } from "../generated/prisma/index.js";

export const adminService = {
  /**
   * List all admins.
   * Excludes sensitive fields like passwordHash.
   */
  async getAllAdmins() {
    return prisma.admin.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mustSetPassword: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Get a specific admin
   */
  async getAdminById(id: string) {
    return prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mustSetPassword: true,
      },
    });
  },

  /**
   * Invite a new admin.
   * Creates the admin record and generates an invitation token.
   */
  async inviteAdmin(
    creatorId: string,
    data: { email: string; name: string; role: AdminRole },
    ipAddress?: string,
  ) {
    const existing = await prisma.admin.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new AppError(400, "يوجد مدير بهذا البريد الإلكتروني مسبقاً");
    }

    const newAdmin = await prisma.admin.create({
      data: {
        email: data.email.toLowerCase().trim(),
        name: data.name,
        role: data.role,
        passwordHash: null,
        mustSetPassword: true,
      },
    });

    // Create token
    const tokenResult = await authService.createInvitationToken(
      newAdmin.id,
      creatorId,
      ipAddress,
    );

    return {
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role,
      },
      ...tokenResult,
    };
  },

  /**
   * Update admin role or active status
   */
  async updateAdmin(
    actorId: string,
    targetId: string,
    data: { role?: AdminRole; isActive?: boolean },
    ipAddress?: string,
  ) {
    if (Object.keys(data).length === 0) return;

    // Prevent disabling the last SUPER_ADMIN
    if (data.isActive === false || (data.role && data.role !== "SUPER_ADMIN")) {
      const targetAdmin = await prisma.admin.findUnique({
        where: { id: targetId },
      });
      if (targetAdmin?.role === "SUPER_ADMIN") {
        const superAdminCount = await prisma.admin.count({
          where: { role: "SUPER_ADMIN", isActive: true },
        });
        if (superAdminCount <= 1) {
          throw new AppError(
            400,
            "لا يمكن تعطيل أو تغيير صلاحية آخر مدير نظام (SUPER_ADMIN)",
          );
        }
      }
    }

    // A SUPER_ADMIN shouldn't disable themselves easily
    if (actorId === targetId && data.isActive === false) {
      throw new AppError(400, "لا يمكنك تعطيل حسابك الخاص");
    }

    const updated = await prisma.admin.update({
      where: { id: targetId },
      data,
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    // Audit log
    await auditService.log({
      adminId: actorId,
      action: data.isActive !== undefined ? "ADMIN_LOGOUT" : "ADMIN_LOGIN", // Placeholder actions, ideally better distinct actions but these will do for now.
      entity: "admin",
      entityId: targetId,
      details: data,
      ipAddress,
    });

    return updated;
  },

  /**
   * Issue a reset token for an existing admin.
   */
  async issueResetToken(actorId: string, targetId: string, ipAddress?: string) {
    return authService.createResetToken(targetId, actorId, ipAddress);
  },
};
