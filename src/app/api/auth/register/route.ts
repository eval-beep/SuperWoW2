import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ensureUserSettings } from "@/lib/user-settings";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

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
      emailRedirectTo: `${request.headers.get("origin") || request.nextUrl.origin}/api/auth/callback`,
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

  if (data.user && data.session) {
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await supabase.from("otp_codes").insert({
      user_id: data.user.id,
      email,
      code,
      purpose: "email_verification",
      expires_at: expiresAt.toISOString(),
    });

    const emailSent = await sendVerificationEmail(email, code);
    console.log(`[Register] ${email} registered, OTP: ${code} (email sent: ${emailSent})`);

    return NextResponse.json({
      success: true,
      message: "Registrasi berhasil! Silakan cek email Anda untuk kode verifikasi.",
      requiresVerification: true,
      _debug_code: process.env.NODE_ENV === "development" ? code : undefined,
    });
  }

  if (data.user && !data.session) {
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_KEY!
    );

    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.users?.find((u) => u.id === data.user!.id);

    if (user) {
      await supabaseAdmin.from("otp_codes").insert({
        user_id: data.user.id,
        email,
        code,
        purpose: "email_verification",
        expires_at: expiresAt.toISOString(),
      });

      const emailSent = await sendVerificationEmail(email, code);
      console.log(`[Register] ${email} registered (no session), OTP: ${code} (email sent: ${emailSent})`);
    }

    return NextResponse.json({
      success: true,
      message: "Registrasi berhasil! Silakan cek email Anda untuk kode verifikasi.",
      requiresVerification: true,
    });
  }

  return NextResponse.json({ error: "Registrasi gagal. Silakan coba lagi." }, { status: 500 });
}
