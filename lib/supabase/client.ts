import { createClient, SupabaseClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isPlaceholder =
  !rawUrl ||
  !rawKey ||
  rawUrl.includes("placeholder.supabase.co") ||
  rawKey === "placeholder-anon-key";

/**
 * Returns true if valid Supabase connection details are provided in environment variables.
 */
export function isSupabaseConfigured(): boolean {
  return !isPlaceholder;
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const url = isPlaceholder ? "https://placeholder.supabase.co" : rawUrl;
    const key = isPlaceholder ? "placeholder-anon-key" : rawKey;
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: typeof window !== "undefined",
        autoRefreshToken: typeof window !== "undefined",
      },
    });
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();
