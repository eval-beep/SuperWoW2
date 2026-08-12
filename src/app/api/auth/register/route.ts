import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const { email, password, full_name } = await request.json();

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
      data: { full_name: full_name || "", nickname: full_name || "" },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (data.user && !data.session) {
    return NextResponse.json({
      success: true,
      message: "Registrasi berhasil. Silakan cek email untuk verifikasi.",
      requiresVerification: true,
    });
  }

  const response = NextResponse.json({
    success: true,
    user: { id: data.user!.id, email: data.user!.email },
  });

  if (data.session) {
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
  }

  return response;
}
