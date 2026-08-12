import { NextRequest, NextResponse } from "next/server";
import { sendFingerspotCommand } from "@/lib/fingerspot";
import { supabaseInsert, supabaseUpdate, supabaseSelect } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth-server";
import { getUserCloudId, columnExists } from "@/lib/user-settings";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const userCloudId = await getUserCloudId(user.id);
    const hasUserCol = await columnExists("command_logs", "user_id");

    const body = await request.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json({ error: "pin harus diisi" }, { status: 400 });
    }

    const transFilter: Record<string, string> = { cloud_id: `eq.${userCloudId}` };
    if (hasUserCol) transFilter.user_id = `eq.${user.id}`;

    const { data: maxRow } = await supabaseSelect("command_logs", {
      select: "trans_id",
      order: { column: "trans_id", ascending: false },
      limit: 1,
      filters: transFilter,
    });
    const transId = Number((maxRow?.[0] as { trans_id?: string | number } | undefined)?.trans_id || 0) + 1;

    const result = await sendFingerspotCommand("get_userinfo", { cloud_id: userCloudId, pin, trans_id: String(transId) });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.data?.error || "Command gagal" }, { status: 500 });
    }

    const responseData = result.data as Record<string, unknown>;

    if (responseData?.data && typeof responseData.data === "object" && !Array.isArray(responseData.data)) {
      const userData = responseData.data as Record<string, unknown>;
      const userPin = String(userData.pin || pin);

      const existingFilter: Record<string, string> = { cloud_id: `eq.${userCloudId}`, pin: `eq.${userPin}` };
      if (hasUserCol) existingFilter.user_id = `eq.${user.id}`;

      const { data: existing } = await supabaseSelect("userinfos", {
        select: "id",
        filters: existingFilter,
      });

      const now = new Date().toISOString();

      if (existing && existing.length > 0) {
        const updateFilter: Record<string, string> = { cloud_id: `eq.${userCloudId}`, pin: `eq.${userPin}` };
        if (hasUserCol) updateFilter.user_id = `eq.${user.id}`;

        await supabaseUpdate("userinfos", {
          name: userData.name || null,
          privilege: Number(userData.privilege || 0),
          password: userData.password || null,
          rfid: userData.rfid || null,
          template: userData.template || null,
          raw_payload: userData,
          synced_at: now,
        }, updateFilter);
      } else {
        const insertData: Record<string, unknown> = {
          cloud_id: userCloudId,
          pin: userPin,
          name: userData.name || null,
          privilege: Number(userData.privilege || 0),
          password: userData.password || null,
          rfid: userData.rfid || null,
          template: userData.template || null,
          raw_payload: userData,
          synced_at: now,
        };
        if (hasUserCol) insertData.user_id = user.id;

        await supabaseInsert("userinfos", insertData);
      }

      return NextResponse.json({
        success: true,
        source: "api",
        data: userData,
        message: `Data user PIN ${userPin} berhasil disimpan`,
      });
    }

    return NextResponse.json({
      success: true,
      source: "pending",
      data: null,
      message: "Command diterima device. Data akan muncul setelah device merespons via webhook.",
    });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
