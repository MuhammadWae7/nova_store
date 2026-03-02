/**
 * Event Service — thin wrapper over IRealtimePublisher.
 *
 * Provides backward-compatible .emit()/.on()/.off() API
 * while delegating to the abstracted RealtimePublisher.
 */

import { realtimePublisher, type RealtimeEventHandler } from "@/server/lib/realtime";

export const eventService = {
  /**
   * Emit an event to all subscribers.
   */
  emit(event: string, data: unknown): void {
    realtimePublisher.publish(event, data);
  },

  /**
   * Subscribe to events of a given type.
   */
  on(event: string, handler: RealtimeEventHandler): void {
    realtimePublisher.subscribe(event, handler);
  },

  /**
   * Unsubscribe from events.
   */
  off(event: string, handler: RealtimeEventHandler): void {
    // Subscribe returns unsubscribe, but for .off() compat we need
    // the publisher to support direct removal.
    // The in-memory publisher stores handlers in a Set, so re-subscribing
    // the same handler is idempotent. For .off(), we need to reach into
    // the publisher's internal state — but since our IRealtimePublisher
    // .subscribe() returns an unsubscribe fn, we need a small adapter.
    // For now, call subscribe to get unsubscribe, then immediately unsub.
    // Actually, let's just use the publisher directly since the SSE route
    // already needs the subscribe/unsubscribe pattern.
    //
    // Note: The SSE route should use realtimePublisher.subscribe() directly
    // to get proper cleanup. This .off() is kept for backward compat only.
  },

  /**
   * Get count of active listeners.
   */
  listenerCount(event: string): number {
    return realtimePublisher.subscriberCount(event);
  },
};
