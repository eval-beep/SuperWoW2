import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const { email, code } = await request.json();

  if (!email || !code) {
    return NextResponse.json({ error: "Email dan kode harus diisi" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!
  );

  const { data: otpRecord, error: otpError } = await supabase
    .from("otp_codes")
    .select("*")
    .eq("email", email)
    .eq("code", code)
    .eq("purpose", "login_2fa")
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (otpError || !otpRecord) {
    return NextResponse.json({ error: "Kode OTP salah atau sudah kedaluwarsa" }, { status: 401 });
  }

  await supabase
    .from("otp_codes")
    .update({ used: true })
    .eq("id", otpRecord.id);

  const tempCookie = request.cookies.get("sb-temp-token");
  if (!tempCookie?.value) {
    return NextResponse.json({ error: "Sesi kedaluwarsa. Silakan login ulang." }, { status: 401 });
  }

  let tokens: { access_token: string; refresh_token: string };
  try {
    tokens = JSON.parse(tempCookie.value);
  } catch {
    return NextResponse.json({ error: "Sesi tidak valid. Silakan login ulang." }, { status: 401 });
  }

  const response = NextResponse.json({
    success: true,
    message: "Verifikasi berhasil",
  });

  response.cookies.set("sb-access-token", tokens.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  response.cookies.set("sb-refresh-token", tokens.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  response.cookies.set("sb-temp-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
