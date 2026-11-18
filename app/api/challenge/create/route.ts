import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, creatorId, creatorName, creatorElo, timeControl, category, rated, colorPreference } = body;

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("open_challenges").insert({
          id,
          creator_id: creatorId,
          creator_name: creatorName,
          creator_elo: creatorElo,
          time_control: timeControl,
          category,
          rated,
          color_preference: colorPreference,
          status: "open",
        });
      } catch (dbErr) {
        console.warn("[Challenge API] Supabase insert warning:", dbErr);
      }
    }

    return NextResponse.json({ success: true, challenge: body });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to broadcast challenge" }, { status: 400 });
  }
}
