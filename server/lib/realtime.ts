/**
 * Real-Time Publisher Abstraction.
 *
 * Decouples dashboard notification logic from the transport mechanism.
 * Current implementation: in-memory event emitter (for SSE).
 * Can be swapped to WebSocket, Durable Objects, Redis pub/sub, etc.
 */

// ─── Interface ─────────────────────────────────

export type RealtimeEventHandler = (data: unknown) => void;

export interface IRealtimePublisher {
  /** Publish an event to all subscribers. */
  publish(event: string, data: unknown): void;
  /** Subscribe to events of a given type. Returns an unsubscribe function. */
  subscribe(event: string, handler: RealtimeEventHandler): () => void;
  /** Get active subscriber count for an event type. */
  subscriberCount(event: string): number;
}

// ─── In-Memory Implementation (SSE-compatible) ─

class InMemoryRealtimePublisher implements IRealtimePublisher {
  private listeners: Map<string, Set<RealtimeEventHandler>> = new Map();

  publish(event: string, data: unknown): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch {
          // Individual handler failures must not break other listeners
        }
      }
    }
  }

  subscribe(event: string, handler: RealtimeEventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  subscriberCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

// ─── Singleton ─────────────────────────────────

const globalForRealtime = globalThis as unknown as {
  realtimePublisher: IRealtimePublisher | undefined;
};

export const realtimePublisher: IRealtimePublisher =
  globalForRealtime.realtimePublisher ?? new InMemoryRealtimePublisher();

if (process.env.NODE_ENV !== "production") {
  globalForRealtime.realtimePublisher = realtimePublisher;
}
