import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function POST(request: NextRequest) {
  const { email } = await request.json();

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
    return NextResponse.json({ success: true, message: "Jika email terdaftar, kode reset telah dikirim." });
  }

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await supabase.from("otp_codes").insert({
    user_id: user.id,
    email,
    code,
    purpose: "reset_password",
    expires_at: expiresAt.toISOString(),
  });

  const emailSent = await sendPasswordResetEmail(email, code);
  console.log(`[ResetPassword] ${email} -> ${code} (email sent: ${emailSent})`);

  return NextResponse.json({
    success: true,
    message: "Kode reset password telah dikirim ke email Anda",
    _debug_code: process.env.NODE_ENV === "development" ? code : undefined,
  });
}
