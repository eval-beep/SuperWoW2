import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email";

function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function POST(request: NextRequest) {
  const { email, purpose } = await request.json();
  const otpPurpose = purpose || "2fa";

  if (!email) {
    return NextResponse.json({ error: "Email harus diisi" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!
  );

  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users?.find((u) => u.email === email);

  if (!user) {
    return NextResponse.json({ success: true, message: "Jika email terdaftar, kode OTP telah dikirim." });
  }

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await supabase.from("otp_codes").insert({
    user_id: user.id,
    email,
    code,
    purpose: otpPurpose,
    expires_at: expiresAt.toISOString(),
  });

  let emailSent = false;
  if (otpPurpose === "reset_password") {
    emailSent = await sendPasswordResetEmail(email, code);
  } else {
    emailSent = await sendVerificationEmail(email, code);
  }

  if (!emailSent) {
    console.error(`[OTP] Failed to send email to ${email}`);
    return NextResponse.json({ error: "Gagal mengirim email. Silakan coba lagi." }, { status: 500 });
  }

  console.log(`[OTP] ${email} -> ${code} (purpose: ${otpPurpose}, expires: ${expiresAt.toISOString()})`);

  return NextResponse.json({
    success: true,
    message: "Kode OTP telah dikirim ke email Anda",
    _debug_code: process.env.NODE_ENV === "development" ? code : undefined,
  });
}
