"use client";

import { ID, OAuthProvider } from "appwrite";
import { appwriteAccount, isAppwriteConfigured } from "./client";
import { formatAuthError } from "./auth-helpers";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export async function signInWithGoogle(): Promise<{ error?: string }> {
  if (!isAppwriteConfigured()) {
    return { error: "Appwrite project is not configured. Please set NEXT_PUBLIC_APPWRITE_PROJECT_ID." };
  }

  try {
    const successUrl = typeof window !== "undefined" ? `${window.location.origin}/` : "/";
    const failureUrl = typeof window !== "undefined" ? `${window.location.origin}/` : "/";

    // Trigger Appwrite Google OAuth2 Session flow
    appwriteAccount.createOAuth2Session(
      OAuthProvider.Google,
      successUrl,
      failureUrl
    );
    return {};
  } catch (err: any) {
    return { error: formatAuthError(err?.message || "Google sign in failed") };
  }
}

export async function loginWithEmail(email: string, pass: string): Promise<{ user?: AuthUser; error?: string }> {
  if (!isAppwriteConfigured()) {
    return { error: "Appwrite is not configured in this environment." };
  }

  try {
    await appwriteAccount.createEmailPasswordSession(email, pass);
    const accountUser = await appwriteAccount.get();
    const user: AuthUser = {
      id: accountUser.$id,
      name: accountUser.name,
      email: accountUser.email,
    };
    await syncUserToSupabase(user);
    return { user };
  } catch (err: any) {
    return { error: formatAuthError(err?.message || "Login failed") };
  }
}

export async function registerWithEmail(
  email: string,
  pass: string,
  name: string
): Promise<{ user?: AuthUser; error?: string }> {
  if (!isAppwriteConfigured()) {
    return { error: "Appwrite is not configured in this environment." };
  }

  try {
    const userId = ID.unique();
    await appwriteAccount.create(userId, email, pass, name);
    await appwriteAccount.createEmailPasswordSession(email, pass);
    const accountUser = await appwriteAccount.get();
    const user: AuthUser = {
      id: accountUser.$id,
      name: accountUser.name,
      email: accountUser.email,
    };
    await syncUserToSupabase(user);
    return { user };
  } catch (err: any) {
    return { error: formatAuthError(err?.message || "Registration failed") };
  }
}

export async function logoutUser(): Promise<void> {
  if (isAppwriteConfigured()) {
    try {
      await appwriteAccount.deleteSession("current");
    } catch {}
  }
}

export async function getCurrentAppwriteUser(): Promise<AuthUser | null> {
  if (!isAppwriteConfigured()) return null;
  try {
    const accountUser = await appwriteAccount.get();
    return {
      id: accountUser.$id,
      name: accountUser.name,
      email: accountUser.email,
    };
  } catch {
    return null;
  }
}

/**
 * Idempotently upsert user into Supabase `profiles` table to maintain relational integrity
 */
export async function syncUserToSupabase(user: AuthUser): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from("profiles").upsert(
      {
        id: user.id,
        username: user.name || user.email.split("@")[0],
        email: user.email,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  } catch (err) {
    console.warn("[UserSync] Supabase sync warning:", err);
  }
}
