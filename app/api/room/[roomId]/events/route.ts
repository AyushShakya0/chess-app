import { NextRequest } from "next/server";
import { roomManager, toPublicRoomState, PublicRoomState } from "@/lib/server/room-manager";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const room = roomManager.getRoom(roomId);

  if (!room) {
    return new Response(JSON.stringify({ error: "Room not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial state immediately
      const initialPayload = `event: state\ndata: ${JSON.stringify(toPublicRoomState(room))}\n\n`;
      controller.enqueue(encoder.encode(initialPayload));

      // Subscribe to real-time room events
      const unsubscribe = roomManager.subscribe(roomId, (updatedState: PublicRoomState) => {
        try {
          const chunk = `event: state\ndata: ${JSON.stringify(updatedState)}\n\n`;
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // Client disconnected
        }
      });

      // Keepalive heartbeat ping every 15 seconds
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`event: ping\ndata: {}\n\n`));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
