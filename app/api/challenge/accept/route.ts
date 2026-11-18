import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { challengeId, roomId, acceptorName } = body;

    if (!challengeId || !roomId) {
      return NextResponse.json({ error: "Missing challengeId or roomId" }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from("open_challenges")
          .update({
            status: "claimed",
            room_id: roomId,
            acceptor_id: acceptorName,
          })
          .eq("id", challengeId);
      } catch (dbErr) {
        console.warn("[Challenge API] Supabase update warning:", dbErr);
      }
    }

    return NextResponse.json({ success: true, roomId });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to accept challenge" }, { status: 400 });
  }
}
