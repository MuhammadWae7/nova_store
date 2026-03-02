import { prisma } from "@/server/db/client";
import { AppError, ConflictError, NotFoundError } from "@/server/lib/errors";
import { logger } from "@/server/lib/logger";
import { generateOrderNumber } from "@/server/lib/order-number";
import { auditService } from "./audit-service";
import { notificationService } from "./notification-service";
import { eventService } from "./event-service";
import type { CheckoutInput, UpdateOrderStatusInput } from "@/server/schemas/order.schema";

export const orderService = {
  /**
   * Create order with atomic stock validation, SERVER-SIDE price verification,
   * and atomic stock decrement. (SEC-05, SEC-06, SEC-07)
   *
   * SECURITY: Client-submitted unitPrice and totalAmount are IGNORED.
   * Prices are fetched from the database and recalculated server-side.
   */
  async createOrder(data: CheckoutInput) {
    const order = await prisma.$transaction(
      async (tx) => {
        let serverTotalAmount = 0;

        const resolvedItems: Array<{
          productId: string;
          productName: string;
          variantColor: string;
          size: string;
          quantity: number;
          unitPrice: number;
          sku: string;
        }> = [];

        // 1. Validate, verify prices, and lock stock for every item
        for (const item of data.items) {
          // Look up the ProductSize by SKU, joining to Variant and Product
          const productSize = await tx.productSize.findUnique({
            where: { sku: item.sku },
            include: {
              variant: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      price: true,
                      isActive: true,
                    },
                  },
                },
              },
            },
          });

          if (!productSize) {
            throw new AppError(404, `المنتج بالكود ${item.sku} غير موجود`);
          }

          const product = productSize.variant.product;

          // SEC-07: Validate productId matches the product that owns this SKU
          if (item.productId && item.productId !== product.id) {
            throw new AppError(
              400,
              `معرّف المنتج غير متطابق مع الكود ${item.sku}`
            );
          }

          // Verify product is active
          if (!product.isActive) {
            throw new AppError(400, `المنتج "${product.name}" غير متاح للشراء حالياً`);
          }

          // Stock validation
          if (productSize.stock < item.quantity) {
            throw new ConflictError(
              `الكمية المتوفرة من "${product.name}" مقاس ${productSize.size} هي ${productSize.stock} فقط`
            );
          }

          // 2. Atomic stock decrement
          await tx.productSize.update({
            where: { id: productSize.id },
            data: { stock: { decrement: item.quantity } },
          });

          // SEC-05/06: Use DB price, NOT client-submitted price
          const dbUnitPrice = product.price;
          serverTotalAmount += dbUnitPrice * item.quantity;

          resolvedItems.push({
            productId: product.id,
            productName: product.name,
            variantColor: productSize.variant.color,
            size: productSize.size,
            quantity: item.quantity,
            unitPrice: dbUnitPrice,  // From DB, not client
            sku: item.sku,
          });
        }

        // 3. Generate order number (atomic via DB sequence)
        const orderNumber = await generateOrderNumber(tx);

        // 4. Create order with SERVER-COMPUTED total
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            customerName: data.customer.name,
            customerEmail: data.customer.email,
            customerPhone: data.customer.phone,
            customerAddress: data.customer.address,
            customerCity: data.customer.city,
            totalAmount: serverTotalAmount,  // SEC-05: Server-computed, NOT from client
            items: {
              create: resolvedItems,
            },
          },
          include: { items: true },
        });

        // 5. Audit log (inside transaction)
        await tx.auditLog.create({
          data: {
            action: "ORDER_CREATE",
            entity: "order",
            entityId: newOrder.id,
            details: {
              orderNumber: newOrder.orderNumber,
              customerName: newOrder.customerName,
              totalAmount: newOrder.totalAmount,
              itemCount: newOrder.items.length,
            },
          },
        });

        return newOrder;
      },
      {
        isolationLevel: "Serializable",
        timeout: 15000,
      }
    );

    // 6. Post-transaction: fire-and-forget notifications
    try {
      await notificationService.sendOrderNotification(order);
    } catch (err) {
      logger.error("Failed to send WhatsApp notification", {
        orderId: order.id,
        error: (err as Error).message,
      });
    }

    // 7. Emit real-time event
    eventService.emit("new_order", {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      totalAmount: order.totalAmount,
      itemCount: order.items.length,
      createdAt: order.createdAt,
    });

    logger.info("Order created", {
      orderId: order.id,
      orderNumber: order.orderNumber,
      serverTotal: order.totalAmount,
    });

    return order;
  },

  /**
   * Get all orders with pagination (admin).
   */
  async getAll(page = 1, limit = 20, status?: string) {
    const where = status ? { status: status as never } : {};
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get a single order by ID.
   */
  async getById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) throw new NotFoundError("الطلب");
    return order;
  },

  /**
   * Update order status (admin).
   * Concurrency fix: stock restore is now INSIDE the same transaction as status update.
   */
  async updateStatus(
    id: string,
    data: UpdateOrderStatusInput,
    adminId: string
  ) {
    const result = await prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id },
          include: { items: true },
        });
        if (!order) throw new NotFoundError("الطلب");

        const previousStatus = order.status;

        // Validate status transitions
        const validTransitions: Record<string, string[]> = {
          PENDING: ["PROCESSING", "CANCELLED"],
          PROCESSING: ["SHIPPED", "CANCELLED"],
          SHIPPED: ["DELIVERED"],
          DELIVERED: [],
          CANCELLED: [],
        };

        if (!validTransitions[previousStatus]?.includes(data.status)) {
          throw new AppError(
            400,
            `لا يمكن تغيير حالة الطلب من ${previousStatus} إلى ${data.status}`
          );
        }

        const updated = await tx.order.update({
          where: { id },
          data: { status: data.status },
          include: { items: true },
        });

        // If cancelled, restore stock INSIDE the same transaction (Concurrency fix)
        if (data.status === "CANCELLED") {
          for (const item of order.items) {
            await tx.productSize.updateMany({
              where: { sku: item.sku },
              data: { stock: { increment: item.quantity } },
            });
          }
          logger.info("Stock restored for cancelled order (transactional)", { orderId: order.id });
        }

        // Audit log inside transaction
        await tx.auditLog.create({
          data: {
            adminId,
            action: "ORDER_STATUS_CHANGE",
            entity: "order",
            entityId: id,
            details: {
              orderNumber: order.orderNumber,
              from: previousStatus,
              to: data.status,
            },
          },
        });

        return { updated, previousStatus };
      },
      {
        isolationLevel: "Serializable",
        timeout: 10000,
      }
    );

    // Post-transaction: real-time event
    eventService.emit("order_status", {
      id: result.updated.id,
      orderNumber: result.updated.orderNumber,
      status: data.status,
      previousStatus: result.previousStatus,
    });

    // Post-transaction: WhatsApp notification to customer
    try {
      await notificationService.sendStatusUpdateToCustomer(result.updated);
    } catch (err) {
      logger.error("Failed to send status update to customer", {
        orderId: id,
        error: (err as Error).message,
      });
    }

    logger.info("Order status updated", {
      orderId: id,
      from: result.previousStatus,
      to: data.status,
    });

    return result.updated;
  },
};
