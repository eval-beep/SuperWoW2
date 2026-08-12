import { NextRequest, NextResponse } from "next/server";
import { supabaseDelete } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth-server";
import { getUserCloudId } from "@/lib/user-settings";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const userCloudId = await getUserCloudId(user.id);

    const body = await request.json();
    const { pin, mode } = body;
    if (!pin) return NextResponse.json({ error: "pin harus diisi" }, { status: 400 });

    if (mode === "device") {
      const { sendFingerspotCommand } = await import("@/lib/fingerspot");
      try {
        await sendFingerspotCommand("delete_userinfo", { trans_id: "1", cloud_id: userCloudId, pin });
      } catch { /* continue */ }
    }

    await Promise.all([
      supabaseDelete("pins", { cloud_id: `eq.${userCloudId}`, pin: `eq.${pin}`, user_id: `eq.${user.id}` }),
      supabaseDelete("userinfos", { cloud_id: `eq.${userCloudId}`, pin: `eq.${pin}`, user_id: `eq.${user.id}` }),
    ]);
    return NextResponse.json({ success: true, message: "Berhasil dihapus" });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
  }
}
