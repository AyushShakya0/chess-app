import { NextRequest, NextResponse } from "next/server";
import { roomManager } from "@/lib/server/room-manager";
import { escapeHtml } from "@/lib/security/rate-limiter";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;

  try {
    const body = await req.json();
    const token = typeof body.token === "string" ? body.token : undefined;
    const sender = typeof body.sender === "string" ? escapeHtml(body.sender) : "Anonymous";
    const text = typeof body.text === "string" ? escapeHtml(body.text) : "";

    if (!text.trim()) {
      return NextResponse.json({ error: "Empty message" }, { status: 400 });
    }

    const result = roomManager.addChat(roomId, { token, sender, text });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Cannot post chat" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to post message" }, { status: 500 });
  }
}
