import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/server/generated/prisma";

/**
 * Create Prisma Client with Neon serverless adapter.
 * In Prisma 7, PrismaNeon handles connection pooling internally.
 */
function createPrismaClient() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

// Prevent multiple Prisma instances in development (hot reload)
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
