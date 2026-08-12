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
  const full_name = body.full_name?.trim() || "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email dan password harus diisi" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!
  );

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, nickname: full_name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/auth/callback`,
    },
  });

  if (error) {
    console.error("[Register Error]", error.message);
    if (error.message.includes("already registered")) {
      return NextResponse.json({ error: "Email sudah terdaftar. Silakan masuk." }, { status: 409 });
    }
    if (error.message.includes("valid email")) {
      return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (data.user) {
    try {
      await ensureUserSettings(data.user.id);
    } catch (e) {
      console.error("[Register] Gagal membuat default settings:", e);
    }
  }

  if (data.user && !data.session) {
    return NextResponse.json({
      success: true,
      message: "Registrasi berhasil! Silakan cek email Anda untuk verifikasi, lalu masuk.",
      requiresVerification: true,
    });
  }

  if (data.user && data.session) {
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

  return NextResponse.json({ error: "Registrasi gagal. Silakan coba lagi." }, { status: 500 });
}
