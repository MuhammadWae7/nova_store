import { prisma } from "@/server/db/client";
import { AppError, NotFoundError } from "@/server/lib/errors";
import { logger } from "@/server/lib/logger";
import { auditService } from "./audit-service";
import { revalidateTag } from "next/cache";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export const productService = {
  /**
   * Get all active products for public listing.
   * PERF-01, MISS-03: Now supports pagination, search, category, and gender filtering.
   */
  async getAll(options?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    gender?: string;
  }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 50);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isActive: true };

    if (options?.categoryId) {
      where.categoryId = options.categoryId;
    }
    if (options?.gender) {
      where.gender = options.gender.toUpperCase();
    }
    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        { description: { contains: options.search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: where as never,
        include: {
          variants: {
            include: { sizes: true },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where: where as never }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get a single product by slug (public).
   */
  async getBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        variants: {
          include: { sizes: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!product) throw new NotFoundError("المنتج");
    return product;
  },

  /**
   * Get all products for admin (all statuses).
   * PERF-02: Now supports pagination.
   */
  async getAllAdmin(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        include: {
          variants: {
            include: { sizes: true },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count(),
    ]);

    return {
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  /**
   * Get a single product by ID (admin).
   */
  async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          include: { sizes: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!product) throw new NotFoundError("المنتج");
    return product;
  },

  /**
   * Create a new product with variants and sizes.
   */
  async create(
    data: {
      name: string;
      description: string;
      price: number;
      categoryId: string;
      gender?: string;
      isNewArrival?: boolean;
      variants?: Array<{
        color: string;
        images: string[];
        sortOrder?: number;
        sizes: Array<{ size: string; stock: number; sku: string }>;
      }>;
    },
    adminId: string,
  ) {
    const slug = generateSlug(data.name);

    // Check for slug collision
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      throw new AppError(400, "يوجد منتج بنفس الاسم بالفعل");
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        price: data.price,
        categoryId: data.categoryId,
        gender: (data.gender as never) || "MEN",
        isNewArrival: data.isNewArrival || false,
        variants: {
          create: (data.variants || []).map((v, i) => ({
            color: v.color,
            images: v.images,
            sortOrder: v.sortOrder ?? i,
            sizes: {
              create: v.sizes.map((s) => ({
                size: s.size,
                stock: s.stock,
                sku: s.sku,
              })),
            },
          })),
        },
      },
      include: {
        variants: { include: { sizes: true } },
      },
    });

    // Audit log
    await auditService.log({
      adminId,
      action: "PRODUCT_CREATE",
      entity: "product",
      entityId: product.id,
      details: { name: product.name, slug: product.slug },
    });

    logger.info("Product created", {
      productId: product.id,
      name: product.name,
    });

    revalidateTag("products", "default");
    return product;
  },

  /**
   * Update product with PARTIAL variant updates (STR-03/B4).
   * Instead of deleting all variants, we upsert existing ones and create/remove as needed.
   */
  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      categoryId?: string;
      gender?: string;
      isNewArrival?: boolean;
      isActive?: boolean;
      variants?: Array<{
        id?: string; // If provided, update existing; if absent, create new
        color: string;
        images: string[];
        sortOrder?: number;
        sizes: Array<{
          id?: string; // If provided, update existing; if absent, create new
          size: string;
          stock: number;
          sku: string;
        }>;
      }>;
    },
    adminId: string,
  ) {
    const existing = await prisma.product.findUnique({
      where: { id },
      include: { variants: { include: { sizes: true } } },
    });
    if (!existing) throw new NotFoundError("المنتج");

    // Slug update if name changed
    let slug = existing.slug;
    if (data.name && data.name !== existing.name) {
      slug = generateSlug(data.name);
      const slugConflict = await prisma.product.findFirst({
        where: { slug, id: { not: id } },
      });
      if (slugConflict) throw new AppError(400, "يوجد منتج بنفس الاسم بالفعل");
    }

    const product = await prisma.$transaction(async (tx) => {
      // Update base product fields
      const updated = await tx.product.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name, slug } : {}),
          ...(data.description !== undefined
            ? { description: data.description }
            : {}),
          ...(data.price !== undefined ? { price: data.price } : {}),
          ...(data.categoryId !== undefined
            ? { categoryId: data.categoryId }
            : {}),
          ...(data.gender !== undefined
            ? { gender: data.gender as never }
            : {}),
          ...(data.isNewArrival !== undefined
            ? { isNewArrival: data.isNewArrival }
            : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
      });

      // Handle variant updates if provided (B4: partial, non-destructive)
      if (data.variants) {
        const existingVariantIds = existing.variants.map((v) => v.id);
        const incomingVariantIds = data.variants
          .filter((v) => v.id)
          .map((v) => v.id!);

        // Delete variants that are no longer in the list
        const variantsToDelete = existingVariantIds.filter(
          (vid) => !incomingVariantIds.includes(vid),
        );
        if (variantsToDelete.length > 0) {
          await tx.productSize.deleteMany({
            where: { variantId: { in: variantsToDelete } },
          });
          await tx.productVariant.deleteMany({
            where: { id: { in: variantsToDelete } },
          });
        }

        for (const variant of data.variants) {
          if (variant.id && existingVariantIds.includes(variant.id)) {
            // Update existing variant
            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                color: variant.color,
                images: variant.images,
                sortOrder: variant.sortOrder ?? 0,
              },
            });

            // Handle sizes for this variant
            const existingSizes = existing.variants
              .find((v) => v.id === variant.id)!
              .sizes.map((s) => s.id);
            const incomingSizeIds = variant.sizes
              .filter((s) => s.id)
              .map((s) => s.id!);

            // Delete sizes no longer present
            const sizesToDelete = existingSizes.filter(
              (sid) => !incomingSizeIds.includes(sid),
            );
            if (sizesToDelete.length > 0) {
              await tx.productSize.deleteMany({
                where: { id: { in: sizesToDelete } },
              });
            }

            // Upsert sizes
            for (const size of variant.sizes) {
              if (size.id && existingSizes.includes(size.id)) {
                await tx.productSize.update({
                  where: { id: size.id },
                  data: { size: size.size, stock: size.stock, sku: size.sku },
                });
              } else {
                await tx.productSize.create({
                  data: {
                    variantId: variant.id,
                    size: size.size,
                    stock: size.stock,
                    sku: size.sku,
                  },
                });
              }
            }
          } else {
            // Create new variant
            await tx.productVariant.create({
              data: {
                productId: id,
                color: variant.color,
                images: variant.images,
                sortOrder: variant.sortOrder ?? 0,
                sizes: {
                  create: variant.sizes.map((s) => ({
                    size: s.size,
                    stock: s.stock,
                    sku: s.sku,
                  })),
                },
              },
            });
          }
        }
      }

      return tx.product.findUnique({
        where: { id },
        include: {
          variants: { include: { sizes: true }, orderBy: { sortOrder: "asc" } },
        },
      });
    });

    // Audit log
    await auditService.log({
      adminId,
      action: "PRODUCT_UPDATE",
      entity: "product",
      entityId: id,
      details: {
        name: product?.name,
        changes: Object.keys(data).filter((k) => k !== "variants"),
        variantsModified: !!data.variants,
      },
    });

    logger.info("Product updated", { productId: id });

    revalidateTag("products", "default");
    return product;
  },

  /**
   * Soft-delete product.
   */
  async delete(id: string, adminId: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError("المنتج");

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    // Audit log
    await auditService.log({
      adminId,
      action: "PRODUCT_DELETE",
      entity: "product",
      entityId: id,
      details: { name: product.name },
    });

    logger.info("Product soft-deleted", { productId: id, name: product.name });

    revalidateTag("products", "default");
  },
};
