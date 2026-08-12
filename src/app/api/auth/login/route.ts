import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ensureUserSettings } from "@/lib/user-settings";

export async function POST(request: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body invalid" }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json({ error: "Email dan password harus diisi" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("[Login Error]", error.message);
    if (error.message.includes("Invalid login")) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }
    if (error.message.includes("Email not confirmed")) {
      return NextResponse.json({ error: "Email belum diverifikasi. Silakan cek inbox Anda." }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  try {
    await ensureUserSettings(data.user.id);
  } catch (e) {
    console.error("[Login] Gagal memastikan settings:", e);
  }

  const response = NextResponse.json({
    success: true,
    user: { id: data.user.id, email: data.user.email },
  });

  response.cookies.set("sb-access-token", data.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  response.cookies.set("sb-refresh-token", data.session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
