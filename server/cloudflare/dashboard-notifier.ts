/**
 * Durable Object: DashboardNotifier
 *
 * Manages WebSocket connections for real-time admin dashboard updates.
 * Replaces the in-memory EventEmitter SSE approach for Cloudflare Workers compatibility.
 *
 * Events: new_order, order_status
 */

export class DashboardNotifier {
  private state: DurableObjectState;
  private sessions: Set<WebSocket>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Set();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade for admin clients
    if (url.pathname === "/ws" && request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocket();
    }

    // Broadcast endpoint (called by order service)
    if (url.pathname === "/broadcast" && request.method === "POST") {
      return this.handleBroadcast(request);
    }

    return new Response("Not found", { status: 404 });
  }

  /**
   * Accept a new WebSocket connection from an admin client.
   */
  private handleWebSocket(): Response {
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];

    // Accept the server side
    server.accept();

    // Add to active sessions
    this.sessions.add(server);

    // Send connected event
    server.send(JSON.stringify({ event: "connected", data: { status: "connected" } }));

    // Handle close and errors
    server.addEventListener("close", () => {
      this.sessions.delete(server);
    });

    server.addEventListener("error", () => {
      this.sessions.delete(server);
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  /**
   * Broadcast an event to all connected admin clients.
   * Called by the order service after creating/updating orders.
   */
  private async handleBroadcast(request: Request): Promise<Response> {
    const body = await request.json() as { event: string; data: unknown };
    const message = JSON.stringify({ event: body.event, data: body.data });

    // Send to all connected clients, removing dead connections
    const deadSessions: WebSocket[] = [];

    for (const ws of this.sessions) {
      try {
        ws.send(message);
      } catch {
        deadSessions.push(ws);
      }
    }

    // Cleanup dead sessions
    for (const ws of deadSessions) {
      this.sessions.delete(ws);
      try { ws.close(); } catch { /* already closed */ }
    }

    return new Response(
      JSON.stringify({ success: true, recipients: this.sessions.size }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
}

// Re-export for wrangler
export default {
  async fetch(): Promise<Response> {
    return new Response("DashboardNotifier Durable Object", { status: 200 });
  },
};
