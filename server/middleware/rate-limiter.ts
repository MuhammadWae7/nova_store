/**
 * DB-backed Rate Limiter (SEC-08)
 *
 * Uses a Postgres table to track request counts within sliding windows.
 * Works across all serverless instances (Cloudflare Workers, Vercel, etc.).
 *
 * Periodically cleans up old entries to prevent table bloat.
 */

import { prisma } from "@/server/db/client";
import { NextRequest } from "next/server";

interface RateLimitConfig {
  windowMs: number;   // Window size in milliseconds
  maxRequests: number; // Max requests per window
}

/**
 * Check if a request should be rate-limited.
 * Returns true if the request is within limits, false if rate-limited.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const windowStart = new Date(Date.now() - config.windowMs);

  // Count recent requests in this window
  const count = await prisma.rateLimitEntry.count({
    where: {
      key,
      createdAt: { gte: windowStart },
    },
  });

  if (count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + config.windowMs),
    };
  }

  // Record this request
  await prisma.rateLimitEntry.create({
    data: { key },
  });

  return {
    allowed: true,
    remaining: config.maxRequests - count - 1,
    resetAt: new Date(Date.now() + config.windowMs),
  };
}

/**
 * Extract client IP from request headers.
 * Handles Cloudflare, Vercel, and standard proxies.
 */
export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ||   // Cloudflare
    request.headers.get("x-real-ip") ||           // Nginx
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/**
 * Cleanup old rate limit entries (run periodically or via cron).
 * Deletes entries older than 1 hour to prevent table bloat.
 */
export async function cleanupRateLimitEntries(): Promise<number> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const result = await prisma.rateLimitEntry.deleteMany({
    where: { createdAt: { lt: oneHourAgo } },
  });
  return result.count;
}

// Pre-configured rate limit profiles
export const RATE_LIMITS = {
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5 },        // 5 per 15 min
  setPassword: { windowMs: 15 * 60 * 1000, maxRequests: 3 },  // 3 per 15 min
  checkout: { windowMs: 5 * 60 * 1000, maxRequests: 10 },     // 10 per 5 min
  upload: { windowMs: 5 * 60 * 1000, maxRequests: 20 },       // 20 per 5 min
  api: { windowMs: 60 * 1000, maxRequests: 60 },              // 60 per minute
} as const;
