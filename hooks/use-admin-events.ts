"use client";

/**
 * useAdminEvents — SSE-based real-time admin event listener.
 *
 * Connects to GET /api/events/stream (Server-Sent Events) with credentials.
 * Includes auto-reconnect with exponential backoff.
 *
 * Transport-agnostic from the consumer's perspective — callbacks remain
 * the same regardless of whether the backend uses SSE, WebSocket, or polling.
 */

import { useEffect, useCallback, useRef, useState } from "react";

interface OrderEvent {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
}

interface OrderStatusEvent {
  id: string;
  orderNumber: string;
  status: string;
  previousStatus: string;
}

interface UseAdminEventsOptions {
  onNewOrder?: (order: OrderEvent) => void;
  onOrderStatus?: (update: OrderStatusEvent) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const INITIAL_RECONNECT_DELAY = 1000; // 1 second

export function useAdminEvents(options: UseAdminEventsOptions = {}) {
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const optionsRef = useRef(options);

  // Keep options ref current
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const connect = useCallback(() => {
    // Skip if already connected
    if (eventSourceRef.current?.readyState === EventSource.OPEN) return;

    // Close any stale connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      // SSE with credentials (cookie-based auth)
      const es = new EventSource("/api/events/stream", { withCredentials: true });

      es.addEventListener("connected", () => {
        setIsConnected(true);
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY; // Reset backoff
        optionsRef.current.onConnected?.();
      });

      es.addEventListener("new_order", (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          optionsRef.current.onNewOrder?.(data);
        } catch {
          // Ignore malformed messages
        }
      });

      es.addEventListener("order_status", (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          optionsRef.current.onOrderStatus?.(data);
        } catch {
          // Ignore malformed messages
        }
      });

      es.onerror = () => {
        setIsConnected(false);
        es.close();
        eventSourceRef.current = null;
        optionsRef.current.onDisconnected?.();

        // Auto-reconnect with exponential backoff
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectDelayRef.current = Math.min(
            reconnectDelayRef.current * 2,
            MAX_RECONNECT_DELAY
          );
          connect();
        }, reconnectDelayRef.current);
      };

      eventSourceRef.current = es;
    } catch {
      // EventSource not available — retry later
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, reconnectDelayRef.current);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      // Cleanup on unmount
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connect]);

  return { isConnected };
}
