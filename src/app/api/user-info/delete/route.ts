import { NextRequest, NextResponse } from "next/server";
import { supabaseDelete } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth-server";
import { getUserCloudId, columnExists } from "@/lib/user-settings";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const userCloudId = await getUserCloudId(user.id);
    const hasUserCol = await columnExists("pins", "user_id");

    const body = await request.json();
    const { pin, mode } = body;
    if (!pin) return NextResponse.json({ error: "pin harus diisi" }, { status: 400 });

    if (mode === "device") {
      const { sendFingerspotCommand } = await import("@/lib/fingerspot");
      try {
        await sendFingerspotCommand("delete_userinfo", { trans_id: "1", cloud_id: userCloudId, pin });
      } catch { /* continue */ }
    }

    const pinsFilter: Record<string, string> = { cloud_id: `eq.${userCloudId}`, pin: `eq.${pin}` };
    const userinfosFilter: Record<string, string> = { cloud_id: `eq.${userCloudId}`, pin: `eq.${pin}` };
    if (hasUserCol) {
      pinsFilter.user_id = `eq.${user.id}`;
      userinfosFilter.user_id = `eq.${user.id}`;
    }

    await Promise.all([
      supabaseDelete("pins", pinsFilter),
      supabaseDelete("userinfos", userinfosFilter),
    ]);
    return NextResponse.json({ success: true, message: "Berhasil dihapus" });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
  }
}
