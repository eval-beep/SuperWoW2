import { NextRequest, NextResponse } from "next/server";
import { sendFingerspotCommand } from "@/lib/fingerspot";
import { supabaseInsert, supabaseUpdate, supabaseSelect } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth-server";
import { getUserCloudId, getUserCloudIds, getUserFingerspotConfig } from "@/lib/user-settings";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const defaultCloudId = await getUserCloudId(user.id);
    const fsConfig = await getUserFingerspotConfig(user.id);

    const body = await request.json();
    const { pin, cloud_id } = body;

    if (!pin) {
      return NextResponse.json({ error: "pin harus diisi" }, { status: 400 });
    }

    let targetCloudId = defaultCloudId;
    if (cloud_id) {
      const allowedIds = await getUserCloudIds(user.id);
      if (allowedIds.includes(cloud_id)) {
        targetCloudId = cloud_id;
      }
    }

    const { data: maxRow } = await supabaseSelect("command_logs", {
      select: "trans_id",
      order: { column: "trans_id", ascending: false },
      limit: 1,
      filters: { cloud_id: `eq.${targetCloudId}`, user_id: `eq.${user.id}` },
    });
    const transId = Number((maxRow?.[0] as { trans_id?: string | number } | undefined)?.trans_id || 0) + 1;

    const result = await sendFingerspotCommand("get_userinfo", { cloud_id: targetCloudId, pin, trans_id: String(transId) }, fsConfig);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.data?.error || "Command gagal" }, { status: 500 });
    }

    const responseData = result.data as Record<string, unknown>;

    if (responseData?.data && typeof responseData.data === "object" && !Array.isArray(responseData.data)) {
      const userData = responseData.data as Record<string, unknown>;
      const userPin = String(userData.pin || pin);

      const { data: existing } = await supabaseSelect("userinfos", {
        select: "id",
        filters: { cloud_id: `eq.${targetCloudId}`, pin: `eq.${userPin}`, user_id: `eq.${user.id}` },
      });

      const now = new Date().toISOString();

      if (existing && existing.length > 0) {
        await supabaseUpdate("userinfos", {
          name: userData.name || null,
          privilege: Number(userData.privilege || 0),
          password: userData.password || null,
          rfid: userData.rfid || null,
          template: userData.template || null,
          raw_payload: userData,
          synced_at: now,
        }, { cloud_id: `eq.${targetCloudId}`, pin: `eq.${userPin}`, user_id: `eq.${user.id}` });
      } else {
        await supabaseInsert("userinfos", {
          cloud_id: targetCloudId,
          user_id: user.id,
          pin: userPin,
          name: userData.name || null,
          privilege: Number(userData.privilege || 0),
          password: userData.password || null,
          rfid: userData.rfid || null,
          template: userData.template || null,
          raw_payload: userData,
          synced_at: now,
        });
      }

      if (userData.name) {
        await supabaseUpdate("attlogs", { name: userData.name }, {
          cloud_id: `eq.${targetCloudId}`,
          pin: `eq.${userPin}`,
          name: "is.null",
        });
      }

      return NextResponse.json({
        success: true,
        source: "api",
        data: userData,
        cloud_id: targetCloudId,
        message: `Data user PIN ${userPin} berhasil disimpan`,
      });
    }

    return NextResponse.json({
      success: true,
      source: "pending",
      data: null,
      cloud_id: targetCloudId,
      message: "Command diterima device. Data akan muncul setelah device merespons via webhook.",
    });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
