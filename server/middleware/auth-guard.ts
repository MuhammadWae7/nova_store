import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/server/lib/session";
import { UnauthorizedError, ForbiddenError } from "@/server/lib/errors";
import { prisma } from "@/server/db/client";

/**
 * Validate admin session from the request cookies.
 * Performs a DB round-trip to verify the admin still exists and is active.
 * This guard is intentionally limited to admin API routes only — never call
 * it from public storefront routes.
 * Throws UnauthorizedError if no valid session exists or admin is inactive.
 */
export async function requireAdmin(): Promise<SessionData> {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  );

  if (!session.adminId) {
    throw new UnauthorizedError();
  }

  // DB check: verify admin still exists and has not been deactivated
  const admin = await prisma.admin.findUnique({
    where: { id: session.adminId },
    select: { id: true, isActive: true },
  });

  if (!admin || !admin.isActive) {
    // Invalidate the stale session so the browser cookie is cleared
    session.destroy();
    throw new UnauthorizedError();
  }

  return session;
}

/**
 * Validate admin session and require a specific role.
 * Inherits the DB isActive check from requireAdmin().
 */
export async function requireRole(...roles: string[]): Promise<SessionData> {
  const session = await requireAdmin();

  if (!roles.includes(session.role)) {
    throw new ForbiddenError();
  }

  return session;
}
