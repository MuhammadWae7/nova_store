import { prisma } from "@/server/db/client";
import { compare, hash } from "bcryptjs";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/server/lib/session";
import { UnauthorizedError, AppError } from "@/server/lib/errors";
import { logger } from "@/server/lib/logger";
import { auditService } from "./audit-service";
import { createHash, randomBytes } from "crypto";

const BCRYPT_ROUNDS = 12;
const INVITATION_TOKEN_EXPIRY_HOURS = 24;

/**
 * Hash a raw invitation token using SHA-256.
 * We store the hash, not the raw token.
 */
function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export const authService = {
  /**
   * Authenticate admin with email and password.
   * Returns session data on success.
   */
  async login(email: string, password: string, ipAddress?: string) {
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!admin || !admin.isActive) {
      // Use same error for both cases to prevent user enumeration
      throw new UnauthorizedError("بريد إلكتروني أو كلمة مرور غير صحيحة");
    }

    // If admin hasn't set password yet, only allow if mustSetPassword is true
    if (admin.mustSetPassword || !admin.passwordHash) {
      throw new AppError(403, "يجب تعيين كلمة المرور أولاً. استخدم رابط تعيين كلمة المرور.");
    }

    const isValid = await compare(password, admin.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError("بريد إلكتروني أو كلمة مرور غير صحيحة");
    }

    // Create session
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    session.adminId = admin.id;
    session.role = admin.role;
    session.name = admin.name;
    session.createdAt = Date.now();
    await session.save();

    // Audit log
    await auditService.log({
      adminId: admin.id,
      action: "ADMIN_LOGIN",
      entity: "admin",
      entityId: admin.id,
      ipAddress,
    });

    logger.info("Admin logged in", { adminId: admin.id, email: admin.email });

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };
  },

  /**
   * Create an invitation token for an admin to set their password. (SEC-03)
   * Only SUPER_ADMIN can create these.
   * Returns the raw token to be shared securely (email/direct message).
   */
  async createInvitationToken(adminId: string, creatorAdminId: string, ipAddress?: string) {
    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) throw new AppError(404, "المدير غير موجود");
    if (!admin.mustSetPassword && admin.passwordHash) {
      throw new AppError(400, "المدير قام بتعيين كلمة المرور بالفعل");
    }

    // Invalidate any existing unused tokens for this admin
    await prisma.invitationToken.updateMany({
      where: { adminId, usedAt: null },
      data: { usedAt: new Date() }, // Mark as used to invalidate
    });

    // Generate secure random token
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + INVITATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.invitationToken.create({
      data: {
        adminId,
        tokenHash,
        expiresAt,
      },
    });

    // Audit log
    await auditService.log({
      adminId: creatorAdminId,
      action: "INVITATION_CREATE",
      entity: "admin",
      entityId: adminId,
      ipAddress,
      details: { targetEmail: admin.email, expiresAt: expiresAt.toISOString() },
    });

    logger.info("Invitation token created", { adminId, creatorId: creatorAdminId });

    return {
      token: rawToken,
      email: admin.email,
      expiresAt,
    };
  },

  /**
   * Set password using a valid invitation token. (SEC-03)
   * The token is single-use, hashed, and has an expiry.
   */
  async setPasswordWithToken(rawToken: string, password: string, ipAddress?: string) {
    const tokenHash = hashToken(rawToken);

    const invitation = await prisma.invitationToken.findUnique({
      where: { tokenHash },
      include: { admin: true },
    });

    if (!invitation) {
      throw new UnauthorizedError("رابط غير صالح أو منتهي الصلاحية");
    }

    if (invitation.usedAt) {
      throw new AppError(400, "تم استخدام هذا الرابط بالفعل");
    }

    if (invitation.expiresAt < new Date()) {
      throw new AppError(400, "انتهت صلاحية هذا الرابط. اطلب رابطاً جديداً.");
    }

    const admin = invitation.admin;
    const passwordHash = await hash(password, BCRYPT_ROUNDS);

    // Atomic: set password + mark token as used
    await prisma.$transaction([
      prisma.admin.update({
        where: { id: admin.id },
        data: { passwordHash, mustSetPassword: false },
      }),
      prisma.invitationToken.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Audit log
    await auditService.log({
      adminId: admin.id,
      action: "ADMIN_PASSWORD_SET",
      entity: "admin",
      entityId: admin.id,
      ipAddress,
    });

    // Auto-login after setting password
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    session.adminId = admin.id;
    session.role = admin.role;
    session.name = admin.name;
    session.createdAt = Date.now();
    await session.save();

    logger.info("Admin password set via invitation token", { adminId: admin.id });

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };
  },

  /**
   * Destroy the current session.
   */
  async logout() {
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    const adminId = session.adminId;
    session.destroy();

    if (adminId) {
      await auditService.log({
        adminId,
        action: "ADMIN_LOGOUT",
        entity: "admin",
        entityId: adminId,
      });
    }

    logger.info("Admin logged out", { adminId });
  },

  /**
   * Get the current session data if valid.
   */
  async getCurrentAdmin() {
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    if (!session.adminId) return null;

    const admin = await prisma.admin.findUnique({
      where: { id: session.adminId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!admin || !admin.isActive) {
      session.destroy();
      return null;
    }

    return admin;
  },
};
