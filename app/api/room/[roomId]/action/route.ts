import { NextRequest, NextResponse } from "next/server";
import { roomManager, toPublicRoomState } from "@/lib/server/room-manager";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;

  try {
    const body = await req.json();
    const token = typeof body.token === "string" ? body.token : "";
    const action = body.action;

    if (!token || !action) {
      return NextResponse.json({ error: "Missing token or action" }, { status: 400 });
    }

    if (
      action !== "resign" &&
      action !== "offer_draw" &&
      action !== "accept_draw" &&
      action !== "claim_timeout"
    ) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const result = roomManager.handleAction(roomId, { token, action });

    if (!result.success || !result.room) {
      return NextResponse.json({ error: result.error || "Action rejected" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      room: toPublicRoomState(result.room),
    });
  } catch {
    return NextResponse.json({ error: "Failed to process action" }, { status: 500 });
  }
}
