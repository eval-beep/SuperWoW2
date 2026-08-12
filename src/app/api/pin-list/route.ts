import { NextRequest, NextResponse } from "next/server";
import { sendFingerspotCommand } from "@/lib/fingerspot";
import { supabaseSelect } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth-server";
import { getUserCloudId, columnExists } from "@/lib/user-settings";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const userCloudId = await getUserCloudId(user.id);
    const hasUserCol = await columnExists("pins", "user_id");

    const filters: Record<string, string> = { cloud_id: `eq.${userCloudId}` };
    if (hasUserCol) filters.user_id = `eq.${user.id}`;

    const { data: pins } = await supabaseSelect("pins", {
      select: "*",
      order: { column: "pin", ascending: true },
      filters,
    });

    return NextResponse.json({ success: true, data: pins || [] });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, data: { error: (e as Error).message } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const userCloudId = await getUserCloudId(user.id);
    const hasUserCol = await columnExists("pins", "user_id");

    const pinsFilter: Record<string, string> = { cloud_id: `eq.${userCloudId}` };
    const userinfosFilter: Record<string, string> = { cloud_id: `eq.${userCloudId}` };
    if (hasUserCol) {
      pinsFilter.user_id = `eq.${user.id}`;
      userinfosFilter.user_id = `eq.${user.id}`;
    }

    const { data: pins } = await supabaseSelect("pins", {
      select: "pin",
      filters: pinsFilter,
    });
    const { data: existingUsers } = await supabaseSelect("userinfos", {
      select: "pin",
      filters: userinfosFilter,
    });
    const existingPins = new Set((existingUsers as { pin: string }[] || []).map((u) => u.pin));
    const missingPins = (pins as { pin: string }[] || []).filter((p) => !existingPins.has(p.pin)).map((p) => p.pin);

    let sent = 0, failed = 0;
    for (const pin of missingPins) {
      try {
        await sendFingerspotCommand("get_userinfo", {
          trans_id: String(Date.now()),
          cloud_id: userCloudId,
          pin,
          user_id: user.id,
        });
        sent++;
      } catch { failed++; }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return NextResponse.json({ success: true, sent, failed, total: missingPins.length, missing: missingPins });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Gagal sync pin" }, { status: 500 });
  }
}
