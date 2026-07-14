import { NextRequest, NextResponse } from "next/server";
import { supabaseDelete } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { cloud_id, pin, mode } = body;
  if (!cloud_id || !pin) return NextResponse.json({ error: "cloud_id dan pin harus diisi" }, { status: 400 });

  if (mode === "device") {
    const { sendFingerspotCommand } = await import("@/lib/fingerspot");
    const { supabaseInsert } = await import("@/lib/supabase");
    try {
      const result = await sendFingerspotCommand("delete_userinfo", { trans_id: "1", cloud_id, pin });
      await supabaseInsert("command_logs", {
        command_type: "delete_userinfo", cloud_id, trans_id: "1",
        request_payload: { trans_id: "1", cloud_id, pin }, response_payload: result.data,
        status: result.success ? "success" : "failed", endpoint: "delete_userinfo",
      });
    } catch { /* continue */ }
  }

  await supabaseDelete("pins", { cloud_id: `eq.${cloud_id}`, pin: `eq.${pin}` });
  await supabaseDelete("userinfos", { cloud_id: `eq.${cloud_id}`, pin: `eq.${pin}` });
  return NextResponse.json({ success: true, message: "Berhasil dihapus" });
}
