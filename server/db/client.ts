import { PrismaClient } from "@/server/generated/prisma";

export const dynamic = "force-dynamic";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error(
      "CRITICAL ERROR: DATABASE_URL environment variable is missing.",
    );
    throw new Error("DATABASE_URL environment variable is missing.");
  }

  const logOptions =
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"];

  return new PrismaClient({
    log: logOptions as never,
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
