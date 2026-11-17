import { NextRequest, NextResponse } from "next/server";
import { roomManager, toPublicRoomState } from "@/lib/server/room-manager";
import { Square } from "chess.js";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;

  try {
    const body = await req.json();
    const token = typeof body.token === "string" ? body.token : "";
    const from = typeof body.from === "string" ? (body.from as Square) : null;
    const to = typeof body.to === "string" ? (body.to as Square) : null;
    const promotion = typeof body.promotion === "string" ? body.promotion : undefined;

    if (!token || !from || !to) {
      return NextResponse.json({ error: "Missing required move parameters" }, { status: 400 });
    }

    const result = roomManager.makeMove(roomId, {
      token,
      from,
      to,
      promotion,
    });

    if (!result.success || !result.room) {
      return NextResponse.json({ error: result.error || "Move rejected" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      room: toPublicRoomState(result.room),
    });
  } catch {
    return NextResponse.json({ error: "Failed to process move" }, { status: 500 });
  }
}
