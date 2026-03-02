import { logger } from "@/server/lib/logger";

interface OrderWithItems {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
  items: Array<{
    productName: string;
    variantColor: string;
    size: string;
    quantity: number;
    unitPrice: number;
    sku: string;
  }>;
}

interface NotificationResult {
  success: boolean;
  messageId?: string;
}

/**
 * WhatsApp Cloud API provider for sending order notifications.
 */
class WhatsAppProvider {
  private readonly apiUrl: string;
  private readonly token: string;
  private readonly vendorPhone: string;

  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || "";
    this.token = process.env.WHATSAPP_TOKEN || "";
    this.vendorPhone = process.env.VENDOR_WHATSAPP_PHONE || "201551798114";
  }

  private formatOrderMessage(order: OrderWithItems): string {
    const items = order.items
      .map(
        (i) =>
          `• ${i.quantity}× ${i.productName} - مقاس ${i.size} — ${i.unitPrice} ج.م`
      )
      .join("\n");

    return [
      `🛒 *طلب جديد #${order.orderNumber}*`,
      ``,
      `👤 *العميل:* ${order.customerName}`,
      `📱 *الهاتف:* ${order.customerPhone}`,
      `📍 *العنوان:* ${order.customerAddress}، ${order.customerCity}`,
      ``,
      `*المنتجات:*`,
      items,
      ``,
      `💰 *الإجمالي: ${order.totalAmount} ج.م*`,
      `📅 ${new Date(order.createdAt).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })}`,
    ].join("\n");
  }

  private formatStatusMessage(order: OrderWithItems): string {
    const statusMap: Record<string, string> = {
      PENDING: "قيد الانتظار ⏳",
      PROCESSING: "جاري التجهيز 📦",
      SHIPPED: "تم الشحن 🚚",
      DELIVERED: "تم التوصيل ✅",
      CANCELLED: "ملغي ❌",
    };

    return [
      `📋 *تحديث طلبك #${order.orderNumber}*`,
      ``,
      `حالة الطلب: *${statusMap[order.status] || order.status}*`,
      ``,
      `شكراً لتسوقك من Nova Fashion 🖤`,
    ].join("\n");
  }

  async sendMessage(phone: string, message: string): Promise<NotificationResult> {
    if (!this.apiUrl || !this.token) {
      logger.warn("WhatsApp not configured, skipping notification", { phone });
      return { success: false };
    }

    try {
      const res = await fetch(`${this.apiUrl}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: { body: message },
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        logger.error("WhatsApp API error", { error, phone });
        return { success: false };
      }

      const data = await res.json();
      const messageId = data.messages?.[0]?.id;
      logger.info("WhatsApp message sent", { messageId, phone });
      return { success: true, messageId };
    } catch (err) {
      logger.error("WhatsApp service unreachable", {
        error: (err as Error).message,
        phone,
      });
      return { success: false };
    }
  }

  async sendOrderNotification(order: OrderWithItems): Promise<NotificationResult> {
    const message = this.formatOrderMessage(order);
    return this.sendMessage(this.vendorPhone, message);
  }

  async sendStatusUpdateToCustomer(order: OrderWithItems): Promise<NotificationResult> {
    const message = this.formatStatusMessage(order);
    // Format Egyptian phone: 01XXXXXXXXX → 201XXXXXXXXX
    const phone = order.customerPhone.startsWith("0")
      ? `2${order.customerPhone}`
      : order.customerPhone;
    return this.sendMessage(phone, message);
  }
}

/**
 * Console fallback provider for development.
 */
class ConsoleProvider {
  async sendOrderNotification(order: OrderWithItems): Promise<NotificationResult> {
    logger.info("📱 [DEV] Order notification", {
      orderNumber: order.orderNumber,
      vendorPhone: "201551798114",
    });
    return { success: true, messageId: "dev-mock" };
  }

  async sendStatusUpdateToCustomer(order: OrderWithItems): Promise<NotificationResult> {
    logger.info("📱 [DEV] Customer status update", {
      orderNumber: order.orderNumber,
      customerPhone: order.customerPhone,
      status: order.status,
    });
    return { success: true, messageId: "dev-mock" };
  }
}

// Export singleton — uses real WhatsApp if configured, console fallback otherwise
export const notificationService = process.env.WHATSAPP_TOKEN
  ? new WhatsAppProvider()
  : new ConsoleProvider();
