/**
 * GET /api/events/stream — Real-time SSE for admin dashboard
 * SEC-02: Requires admin authentication.
 * PERF-03: Proper cleanup on disconnect.
 * Uses IRealtimePublisher abstraction for transport independence.
 */
import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/middleware/auth-guard";
import { errorResponse } from "@/server/lib/errors";
import { realtimePublisher } from "@/server/lib/realtime";

export async function GET(request: NextRequest) {
  try {
    // SEC-02: Require admin authentication
    await requireAdmin();

    const encoder = new TextEncoder();
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
    let isAlive = true;

    const stream = new ReadableStream({
      start(controller) {
        // Send connected event
        controller.enqueue(
          encoder.encode(
            `event: connected\ndata: ${JSON.stringify({ status: "connected" })}\n\n`,
          ),
        );

        // Subscribe via RealtimePublisher abstraction
        const unsubNewOrder = realtimePublisher.subscribe(
          "new_order",
          (data) => {
            if (!isAlive) return;
            try {
              controller.enqueue(
                encoder.encode(
                  `event: new_order\ndata: ${JSON.stringify(data)}\n\n`,
                ),
              );
            } catch {
              cleanup();
            }
          },
        );

        const unsubOrderStatus = realtimePublisher.subscribe(
          "order_status",
          (data) => {
            if (!isAlive) return;
            try {
              controller.enqueue(
                encoder.encode(
                  `event: order_status\ndata: ${JSON.stringify(data)}\n\n`,
                ),
              );
            } catch {
              cleanup();
            }
          },
        );

        // Heartbeat every 20 seconds
        heartbeatInterval = setInterval(() => {
          if (!isAlive) {
            cleanup();
            return;
          }
          try {
            controller.enqueue(encoder.encode(`: heartbeat\n\n`));
          } catch {
            cleanup();
          }
        }, 20000);

        // Cleanup function to prevent memory leaks (PERF-03)
        function cleanup() {
          isAlive = false;
          unsubNewOrder();
          unsubOrderStatus();
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
          }
          try {
            controller.close();
          } catch {
            // Already closed
          }
        }

        // Handle abort signal for proper cleanup
        request.signal.addEventListener("abort", cleanup);
      },

      cancel() {
        // PERF-03: Cleanup on client disconnect
        isAlive = false;
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
