import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string;
}

export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  const accessToken = request.cookies.get("sb-access-token")?.value;
  if (!accessToken) {
    console.error("[Auth] No sb-access-token cookie found");
    return null;
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_KEY!
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error) {
      console.error("[Auth] Supabase getUser error:", error.message);
      return null;
    }

    if (!user) {
      console.error("[Auth] Supabase getUser returned null user");
      return null;
    }

    return { id: user.id, email: user.email || "" };
  } catch (err) {
    console.error("[Auth] Exception in getUserFromRequest:", err);
    return null;
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getUserFromRequest(request);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}
