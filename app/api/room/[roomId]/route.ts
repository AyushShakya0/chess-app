import { NextRequest, NextResponse } from "next/server";
import { roomManager, toPublicRoomState } from "@/lib/server/room-manager";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const room = roomManager.getRoom(roomId);

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json({ room: toPublicRoomState(room) });
}
