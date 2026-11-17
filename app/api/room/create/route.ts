import { NextRequest, NextResponse } from "next/server";
import { roomManager, toPublicRoomState } from "@/lib/server/room-manager";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`room-create:${ip}`, 30, 60 * 1000);

  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many room creation requests" }, { status: 429 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const timeControl = typeof body.timeControl === "string" ? body.timeControl : "5+0";
    const playerName = typeof body.playerName === "string" ? body.playerName.slice(0, 30) : undefined;
    const colorPreference = body.colorPreference === "white" || body.colorPreference === "black" ? body.colorPreference : "white";

    const { room, token, color } = roomManager.createRoom({
      timeControl,
      playerName,
      colorPreference,
    });

    return NextResponse.json(
      {
        roomId: room.id,
        playerToken: token,
        assignedColor: color,
        room: toPublicRoomState(room),
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}
