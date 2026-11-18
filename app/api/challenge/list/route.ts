import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export async function GET() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("open_challenges")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        const mapped = data.map((item) => ({
          id: item.id,
          creatorId: item.creator_id,
          creatorName: item.creator_name,
          creatorElo: item.creator_elo,
          timeControl: item.time_control,
          category: item.category,
          rated: item.rated,
          colorPreference: item.color_preference,
          status: item.status,
          createdAt: new Date(item.created_at).getTime(),
          expiresAt: new Date(item.expires_at).getTime(),
        }));
        return NextResponse.json({ challenges: mapped });
      }
    } catch {}
  }

  return NextResponse.json({ challenges: [] });
}
