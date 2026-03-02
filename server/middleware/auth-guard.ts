import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/server/lib/session";
import { UnauthorizedError, ForbiddenError } from "@/server/lib/errors";

/**
 * Validate admin session from the request cookies.
 * Throws UnauthorizedError if no valid session exists.
 */
export async function requireAdmin(): Promise<SessionData> {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.adminId) {
    throw new UnauthorizedError();
  }

  return session;
}

/**
 * Validate admin session and require a specific role.
 */
export async function requireRole(...roles: string[]): Promise<SessionData> {
  const session = await requireAdmin();

  if (!roles.includes(session.role)) {
    throw new ForbiddenError();
  }

  return session;
}
