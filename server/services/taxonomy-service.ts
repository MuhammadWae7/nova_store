/**
 * Taxonomy Service — Section & Category CRUD for Next.js API routes.
 * No auth required — admin panel is accessed directly without login.
 */

import { prisma } from "@/server/db/client";
import { AppError, NotFoundError, ConflictError } from "@/server/lib/errors";
import { logger } from "@/server/lib/logger";

// ── Slug helper ─────────────────────────────────

function generateSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  // Arabic names produce empty slugs — use timestamp-based fallback
  if (!slug || slug === "-") return `s-${Date.now().toString(36)}`;
  return slug;
}

// ── Service ─────────────────────────────────────

export const taxonomyService = {
  // ── Sections ────────────────────────────────────

  /** Active sections with active categories (storefront). */
  async getActiveSections() {
    return prisma.section.findMany({
      where: { isActive: true },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { orderIndex: "asc" },
          include: { _count: { select: { products: true } } },
        },
      },
      orderBy: { orderIndex: "asc" },
    });
  },

  /** All sections for admin (including hidden). */
  async getAllSections() {
    return prisma.section.findMany({
      include: {
        categories: {
          orderBy: { orderIndex: "asc" },
          include: { _count: { select: { products: true } } },
        },
      },
      orderBy: { orderIndex: "asc" },
    });
  },

  /** Create a new section. */
  async createSection(name: string) {
    const slug = generateSlug(name);

    const existing = await prisma.section.findUnique({ where: { slug } });
    if (existing) throw new AppError(400, "يوجد قسم بنفس الاسم بالفعل");

    const maxOrder = await prisma.section.aggregate({ _max: { orderIndex: true } });
    const section = await prisma.section.create({
      data: { name, slug, orderIndex: (maxOrder._max.orderIndex ?? -1) + 1 },
    });

    logger.info("Section created", { id: section.id, name });
    return section;
  },

  /** Update a section (rename or toggle visibility). */
  async updateSection(id: string, data: { name?: string; isActive?: boolean }) {
    const existing = await prisma.section.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("القسم");

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined && data.name !== existing.name) {
      const newSlug = generateSlug(data.name);
      const slugConflict = await prisma.section.findFirst({
        where: { slug: newSlug, id: { not: id } },
      });
      if (slugConflict) throw new AppError(400, "يوجد قسم بنفس الاسم بالفعل");
      updateData.name = data.name;
      updateData.slug = newSlug;
    }

    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const section = await prisma.section.update({ where: { id }, data: updateData });
    logger.info("Section updated", { id });
    return section;
  },

  /** Delete a section. Blocks if products exist unless force=true (soft-hide). */
  async deleteSection(id: string, force = false) {
    const existing = await prisma.section.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("القسم");

    const productCount = await prisma.product.count({
      where: { category: { sectionId: id } },
    });

    if (productCount > 0 && !force) {
      throw new ConflictError(
        `لا يمكن حذف القسم لأنه يحتوي على ${productCount} منتج. استخدم الإخفاء بدلاً من الحذف.`
      );
    }

    if (productCount > 0 && force) {
      await prisma.section.update({ where: { id }, data: { isActive: false } });
    } else {
      await prisma.section.delete({ where: { id } });
    }

    logger.info("Section deleted", { id, name: existing.name });
  },

  /** Reorder sections. */
  async reorderSections(items: Array<{ id: string; orderIndex: number }>) {
    await prisma.$transaction(
      items.map((item) =>
        prisma.section.update({ where: { id: item.id }, data: { orderIndex: item.orderIndex } })
      )
    );
    logger.info("Sections reordered", { count: items.length });
  },

  // ── Categories ──────────────────────────────────

  /** Active categories for a section (storefront). */
  async getActiveCategories(sectionId: string) {
    return prisma.category.findMany({
      where: { sectionId, isActive: true },
      orderBy: { orderIndex: "asc" },
      include: { _count: { select: { products: true } } },
    });
  },

  /** Create a new category. */
  async createCategory(data: { name: string; sectionId: string; sizeType?: string }) {
    const section = await prisma.section.findUnique({ where: { id: data.sectionId } });
    if (!section) throw new NotFoundError("القسم");

    const slug = generateSlug(data.name);

    const existing = await prisma.category.findUnique({
      where: { sectionId_slug: { sectionId: data.sectionId, slug } },
    });
    if (existing) throw new AppError(400, "يوجد تصنيف بنفس الاسم في هذا القسم");

    const maxOrder = await prisma.category.aggregate({
      where: { sectionId: data.sectionId },
      _max: { orderIndex: true },
    });

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        sectionId: data.sectionId,
        sizeType: (data.sizeType as never) || "TOPS",
        orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
      },
    });

    logger.info("Category created", { id: category.id, name: data.name });
    return category;
  },

  /** Update a category (rename or toggle visibility). */
  async updateCategory(id: string, data: { name?: string; isActive?: boolean }) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("التصنيف");

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined && data.name !== existing.name) {
      const newSlug = generateSlug(data.name);
      const slugConflict = await prisma.category.findFirst({
        where: {
          slug: newSlug,
          sectionId: existing.sectionId,
          id: { not: id },
        },
      });
      if (slugConflict) throw new AppError(400, "يوجد تصنيف بنفس الاسم في هذا القسم");
      updateData.name = data.name;
      updateData.slug = newSlug;
    }

    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const category = await prisma.category.update({ where: { id }, data: updateData });
    logger.info("Category updated", { id });
    return category;
  },

  /** Delete a category. Blocks if products exist unless force=true (soft-hide). */
  async deleteCategory(id: string, force = false) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("التصنيف");

    const productCount = await prisma.product.count({ where: { categoryId: id } });

    if (productCount > 0 && !force) {
      throw new ConflictError(
        `لا يمكن حذف التصنيف لأنه يحتوي على ${productCount} منتج. أعد تصنيف المنتجات أولاً أو استخدم الإخفاء.`
      );
    }

    if (productCount > 0 && force) {
      await prisma.category.update({ where: { id }, data: { isActive: false } });
    } else {
      await prisma.category.delete({ where: { id } });
    }

    logger.info("Category deleted", { id, name: existing.name });
  },

  /** Reorder categories. */
  async reorderCategories(items: Array<{ id: string; orderIndex: number }>) {
    await prisma.$transaction(
      items.map((item) =>
        prisma.category.update({ where: { id: item.id }, data: { orderIndex: item.orderIndex } })
      )
    );
    logger.info("Categories reordered", { count: items.length });
  },
};
