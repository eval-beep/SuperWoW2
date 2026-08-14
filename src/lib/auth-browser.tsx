"use client";

import { createClient } from "@supabase/supabase-js";
import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey);

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  nickname: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabaseBrowser
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) {
        console.error("Profile fetch error:", error);
        return;
      }
      setProfile(data as UserProfile);
    } catch (err) {
      console.error("Profile fetch failed:", err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: { user: u } } = await supabaseBrowser.auth.getUser();
    if (u) {
      setUser({ id: u.id, email: u.email || "" });
      await fetchProfile(u.id);
    }
  }, [fetchProfile]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // First try to get session from Supabase client (localStorage)
        const { data: { session } } = await supabaseBrowser.auth.getSession();

        if (session?.user && mounted) {
          setUser({ id: session.user.id, email: session.user.email || "" });
          fetchProfile(session.user.id);
        } else if (mounted) {
          // No session in localStorage — try to initialize from cookies
          try {
            const res = await fetch("/api/auth/get-session", { credentials: "include" });
            if (res.ok) {
              const data = await res.json();
              if (data.access_token && data.refresh_token) {
                const { data: { session: newSession } } = await supabaseBrowser.auth.setSession({
                  access_token: data.access_token,
                  refresh_token: data.refresh_token,
                });
                if (newSession?.user && mounted) {
                  setUser({ id: newSession.user.id, email: newSession.user.email || "" });
                  fetchProfile(newSession.user.id);
                }
              }
            }
          } catch {
            // Silent — user just won't be logged in
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          setUser({ id: session.user.id, email: session.user.email || "" });
          await fetchProfile(session.user.id);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setProfile(null);
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
          setUser({ id: session.user.id, email: session.user.email || "" });
          fetch("/api/auth/sync-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            }),
          });
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
