import dotenv from "dotenv";
import path from "path";

// Load .env.local (Next.js convention) instead of default .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../server/generated/prisma/index.js";

async function main() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });

  const prisma = new PrismaClient({ adapter } as any);

  console.log("🌱 Seeding database...\n");

  // ─────────────────────────────────────────────
  // 1. Create 4 Admin accounts (password set on first login)
  // ─────────────────────────────────────────────
  const admins = [
    {
      email: "admin1@novastore.com",
      name: "المدير الأول",
      role: "SUPER_ADMIN" as const,
    },
    {
      email: "admin2@novastore.com",
      name: "المدير الثاني",
      role: "ADMIN" as const,
    },
    {
      email: "admin3@novastore.com",
      name: "المدير الثالث",
      role: "ADMIN" as const,
    },
    {
      email: "admin4@novastore.com",
      name: "المدير الرابع",
      role: "ADMIN" as const,
    },
  ];

  for (const admin of admins) {
    await prisma.admin.upsert({
      where: { email: admin.email },
      update: {},
      create: {
        email: admin.email,
        name: admin.name,
        role: admin.role,
        passwordHash: null,
        mustSetPassword: true,
      },
    });
    console.log(`  ✅ Admin: ${admin.email} (${admin.role})`);
  }

  // ─────────────────────────────────────────────
  // 2. Create default Sections & Categories
  // ─────────────────────────────────────────────

  // Default section
  let mainSection = await prisma.section.findUnique({
    where: { slug: "main-sections" },
  });

  if (!mainSection) {
    mainSection = await prisma.section.create({
      data: {
        name: "الأقسام الرئيسية",
        slug: "main-sections",
        orderIndex: 0,
      },
    });
    console.log(`  ✅ Section: ${mainSection.name}`);
  }

  // Default categories (matching old enum values)
  const defaultCategories = [
    { name: "هوديز", slug: "hoodie", orderIndex: 0, sizeType: "TOPS" as const },
    { name: "بنطلون ملتون", slug: "pants-milton", orderIndex: 1, sizeType: "PANTS" as const },
    { name: "بنطلون باجي", slug: "pants-baggy", orderIndex: 2, sizeType: "PANTS" as const },
    { name: "إكسسوارات", slug: "accessories", orderIndex: 3, sizeType: "ONE_SIZE" as const },
  ];

  for (const cat of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: { slug: cat.slug, sectionId: mainSection.id },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          sectionId: mainSection.id,
          sizeType: cat.sizeType,
          orderIndex: cat.orderIndex,
        },
      });
      console.log(`  ✅ Category: ${cat.name}`);
    }
  }

  // ─────────────────────────────────────────────
  // 3. Seed default CMS content
  // ─────────────────────────────────────────────
  const defaultContent = [
    {
      key: "home_hero",
      value: {
        title: "NOVA FASHION",
        subtitle: "فخامة المطلق. أناقة الحضور.",
        backgroundImage:
          "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=2400&auto=format&fit=crop",
      },
    },
    {
      key: "home_marquee",
      value: {
        text: [
          "NOVA FASHION",
          "فخامة",
          "MODERN LUXURY",
          "أناقة",
          "STREETWEAR",
          "تميز",
          "EXCLUSIVE",
          "جودة",
        ],
      },
    },
    {
      key: "home_featured",
      value: {
        title: "إصدارات حصرية",
        description: "تصاميم فريدة تجسد جوهر الأناقة العصرية.",
      },
    },
    {
      key: "home_new_arrivals",
      value: {
        title: "وصل حديثاً",
        description: "اكتشف أحدث صيحات الموضة لهذا الموسم.",
      },
    },
  ];

  for (const content of defaultContent) {
    await prisma.siteContent.upsert({
      where: { key: content.key },
      update: { value: content.value },
      create: { key: content.key, value: content.value },
    });
    console.log(`  ✅ Content: ${content.key}`);
  }

  console.log("\n✨ Seeding complete!");
  console.log("\n📋 Admin accounts created (set password on first login):");
  for (const admin of admins) {
    console.log(`   ${admin.email} — ${admin.role}`);
  }
  console.log(
    "\n🔐 Use the SUPER_ADMIN account to create invitation tokens via POST /api/admin/invitations"
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
