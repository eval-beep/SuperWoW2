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

  return NextResponse.json({ success: true, purpose: otpRecord.purpose });
}
