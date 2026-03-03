import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "./server/generated/prisma/index.js";
import { hash } from "bcryptjs";

async function main() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL,
  });

  const prisma = new PrismaClient({ adapter } as any);

  const passwordHash = await hash("admin123", 12);

  await prisma.admin.update({
    where: { email: "admin1@novastore.com" },
    data: {
      passwordHash,
      mustSetPassword: false,
    },
  });

  console.log("Password for admin1@novastore.com set successfully!");
  await prisma.$disconnect();
}

main().catch(console.error);
