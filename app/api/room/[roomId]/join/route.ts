import { NextRequest, NextResponse } from "next/server";
import { roomManager, toPublicRoomState } from "@/lib/server/room-manager";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`room-join:${ip}`, 60, 60 * 1000);

  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many join requests" }, { status: 429 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const playerName = typeof body.playerName === "string" ? body.playerName.slice(0, 30) : undefined;
    const existingToken = typeof body.token === "string" ? body.token : undefined;

    const result = roomManager.joinRoom(roomId, { playerName, existingToken });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Cannot join room" }, { status: 400 });
    }

    return NextResponse.json({
      playerToken: result.token,
      role: result.role,
      room: toPublicRoomState(result.room),
    });
  } catch {
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
  }
}
