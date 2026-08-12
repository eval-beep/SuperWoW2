import { NextRequest, NextResponse } from "next/server";
import { sendFingerspotCommand } from "@/lib/fingerspot";
import { supabaseInsert, supabaseUpdate, supabaseSelect } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { cloud_id, pin } = body;

  if (!cloud_id || !pin) {
    return NextResponse.json({ error: "cloud_id dan pin harus diisi" }, { status: 400 });
  }

  try {
    const { data: maxRow } = await supabaseSelect("command_logs", {
      select: "trans_id",
      order: { column: "trans_id", ascending: false },
      limit: 1,
      filters: { cloud_id: `eq.${cloud_id}` },
    });
    const transId = Number((maxRow?.[0] as { trans_id?: string | number } | undefined)?.trans_id || 0) + 1;

    const result = await sendFingerspotCommand("get_userinfo", { cloud_id, pin, trans_id: String(transId) });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.data?.error || "Command gagal" }, { status: 500 });
    }

    const responseData = result.data as Record<string, unknown>;

    if (responseData?.data && typeof responseData.data === "object" && !Array.isArray(responseData.data)) {
      const userData = responseData.data as Record<string, unknown>;
      const userPin = String(userData.pin || pin);

      const { data: existing } = await supabaseSelect("userinfos", {
        select: "id",
        filters: { cloud_id: `eq.${cloud_id}`, pin: `eq.${userPin}` },
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
        }, { cloud_id: `eq.${cloud_id}`, pin: `eq.${userPin}` });
      } else {
        await supabaseInsert("userinfos", {
          cloud_id,
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
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
