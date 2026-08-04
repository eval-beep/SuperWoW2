import { NextRequest, NextResponse } from "next/server";
import { supabaseDelete } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { cloud_id, pin, mode } = body;
  if (!cloud_id || !pin) return NextResponse.json({ error: "cloud_id dan pin harus diisi" }, { status: 400 });

  if (mode === "device") {
    const { sendFingerspotCommand } = await import("@/lib/fingerspot");
    try {
      await sendFingerspotCommand("delete_userinfo", { trans_id: "1", cloud_id, pin });
    } catch { /* continue */ }
  }

  await Promise.all([
    supabaseDelete("pins", { cloud_id: `eq.${cloud_id}`, pin: `eq.${pin}` }),
    supabaseDelete("userinfos", { cloud_id: `eq.${cloud_id}`, pin: `eq.${pin}` }),
  ]);
  return NextResponse.json({ success: true, message: "Berhasil dihapus" });
}
