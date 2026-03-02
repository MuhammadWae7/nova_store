import dotenv from "dotenv";
import path from "path";

// Load .env.local first (Next.js convention), then .env as fallback
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },

  datasource: {
    url: env("DIRECT_URL"),
  },
});
