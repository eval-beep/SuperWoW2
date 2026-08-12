import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string;
}

export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  const accessToken = request.cookies.get("sb-access-token")?.value;
  if (!accessToken) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!
  );

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) return null;

  return { id: user.id, email: user.email || "" };
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getUserFromRequest(request);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}
