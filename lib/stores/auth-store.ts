import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../supabase/client";
import type { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  elo_bullet: number;
  elo_blitz: number;
  elo_rapid: number;
  elo_puzzles: number;
  is_vip: boolean;
  preferences?: Record<string, any>;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isVip: boolean;
  isLoading: boolean;
  isConfigured: boolean;
}

let globalAuthState: AuthState = {
  user: null,
  profile: null,
  isVip: false,
  isLoading: true,
  isConfigured: isSupabaseConfigured(),
};

const listeners = new Set<(state: AuthState) => void>();

function emitChange() {
  for (const listener of listeners) {
    listener(globalAuthState);
  }
}

let isInitialized = false;

export async function initAuth() {
  if (isInitialized) return;
  isInitialized = true;

  const localVip = typeof window !== "undefined" && localStorage.getItem("chess_vip_unlocked") === "true";
  globalAuthState.isVip = localVip;

  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("sovereign_auth_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        globalAuthState.profile = parsed;
        globalAuthState.user = { id: parsed.id, email: parsed.email } as any;
      }
    } catch {}
  }

  if (!isSupabaseConfigured()) {
    globalAuthState.isLoading = false;
    emitChange();
    return;
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      globalAuthState.user = session.user;
      await loadProfile(session.user.id);
    } else {
      globalAuthState.user = null;
      globalAuthState.profile = null;
    }

    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession?.user) {
        globalAuthState.user = newSession.user;
        await loadProfile(newSession.user.id);
      } else {
        globalAuthState.user = null;
        globalAuthState.profile = null;
        globalAuthState.isVip = typeof window !== "undefined" && localStorage.getItem("chess_vip_unlocked") === "true";
        emitChange();
      }
    });
  } catch (err) {
    console.warn("Auth initialization skipped:", err);
  } finally {
    globalAuthState.isLoading = false;
    emitChange();
  }
}

async function loadProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      globalAuthState.profile = data as UserProfile;
      globalAuthState.isVip = Boolean(data.is_vip) || (typeof window !== "undefined" && localStorage.getItem("chess_vip_unlocked") === "true");
    }
  } catch {
    // Keep local fallback
  } finally {
    emitChange();
  }
}

export function useAuth(): [
  AuthState,
  {
    signInWithEmail: (email: string, pass: string) => Promise<{ error?: string }>;
    signUpWithEmail: (email: string, pass: string, username: string) => Promise<{ error?: string }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
  }
] {
  const [state, setState] = useState<AuthState>(globalAuthState);

  useEffect(() => {
    listeners.add(setState);
    if (!isInitialized) {
      initAuth();
    }
    return () => {
      listeners.delete(setState);
    };
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) return { error: error.message };
        return {};
      } catch (e: any) {
        return { error: e.message || "Failed to sign in" };
      }
    }

    // Local-First session for offline / unconfigured environments
    try {
      const username = email.split("@")[0] || "Grandmaster";
      const profile: UserProfile = {
        id: `u_${Date.now()}`,
        username,
        email,
        avatar_url: null,
        elo_bullet: 1200,
        elo_blitz: 1200,
        elo_rapid: 1200,
        elo_puzzles: 1200,
        is_vip: false,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("sovereign_auth_session", JSON.stringify(profile));
        localStorage.setItem("sovereign_player_name", username);
      }

      globalAuthState.user = { id: profile.id, email } as any;
      globalAuthState.profile = profile;
      emitChange();
      return {};
    } catch (e: any) {
      return { error: e.message || "Failed to sign in locally" };
    }
  };

  const signUpWithEmail = async (email: string, pass: string, username: string) => {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: { data: { username } },
        });
        if (error) return { error: error.message };
        return {};
      } catch (e: any) {
        return { error: e.message || "Failed to sign up" };
      }
    }

    // Local-First registration for offline / unconfigured environments
    try {
      const cleanUsername = username.trim() || email.split("@")[0] || "Player";
      const profile: UserProfile = {
        id: `u_${Date.now()}`,
        username: cleanUsername,
        email,
        avatar_url: null,
        elo_bullet: 1200,
        elo_blitz: 1200,
        elo_rapid: 1200,
        elo_puzzles: 1200,
        is_vip: false,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("sovereign_auth_session", JSON.stringify(profile));
        localStorage.setItem("sovereign_player_name", cleanUsername);
      }

      globalAuthState.user = { id: profile.id, email } as any;
      globalAuthState.profile = profile;
      emitChange();
      return {};
    } catch (e: any) {
      return { error: e.message || "Failed to sign up locally" };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("sovereign_auth_session");
        localStorage.removeItem("sovereign_player_name");
      } catch {}
    }
    globalAuthState.user = null;
    globalAuthState.profile = null;
    emitChange();
  };

  const refreshProfile = async () => {
    if (globalAuthState.user) {
      await loadProfile(globalAuthState.user.id);
    }
  };

  return [state, { signInWithEmail, signUpWithEmail, signOut, refreshProfile }];
}
