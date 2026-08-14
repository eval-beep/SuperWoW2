import { NextRequest, NextResponse } from "next/server";
import { sendFingerspotCommand } from "@/lib/fingerspot";
import { supabaseSelect } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth-server";
import { getUserCloudId, getUserCloudIds } from "@/lib/user-settings";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const defaultCloudId = await getUserCloudId(user.id);

    const { searchParams } = new URL(request.url);
    const requestedCloudId = searchParams.get("cloud_id");

    let userCloudId = defaultCloudId;
    if (requestedCloudId) {
      const allowedIds = await getUserCloudIds(user.id);
      if (allowedIds.includes(requestedCloudId)) {
        userCloudId = requestedCloudId;
      }
    }

    const { data: pins } = await supabaseSelect("pins", {
      select: "*",
      order: { column: "pin", ascending: true },
      filters: { cloud_id: `eq.${userCloudId}` },
    });

    return NextResponse.json({ success: true, data: pins || [], cloud_id: userCloudId });
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
    const defaultCloudId = await getUserCloudId(user.id);

    const body = await request.json().catch(() => ({}));
    const { cloud_id } = body;

    let targetCloudId = defaultCloudId;
    if (cloud_id) {
      const allowedIds = await getUserCloudIds(user.id);
      if (allowedIds.includes(cloud_id)) {
        targetCloudId = cloud_id;
      }
    }

    const { data: pins } = await supabaseSelect("pins", {
      select: "pin",
      filters: { cloud_id: `eq.${targetCloudId}` },
    });
    const { data: existingUsers } = await supabaseSelect("userinfos", {
      select: "pin",
      filters: { cloud_id: `eq.${targetCloudId}` },
    });
    const existingPins = new Set((existingUsers as { pin: string }[] || []).map((u) => u.pin));
    const missingPins = (pins as { pin: string }[] || []).filter((p) => !existingPins.has(p.pin)).map((p) => p.pin);

    let sent = 0, failed = 0;
    for (const pin of missingPins) {
      try {
        await sendFingerspotCommand("get_userinfo", {
          trans_id: String(Date.now()),
          cloud_id: targetCloudId,
          pin,
          user_id: user.id,
        });
        sent++;
      } catch { failed++; }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return NextResponse.json({ success: true, sent, failed, total: missingPins.length, missing: missingPins, cloud_id: targetCloudId });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Gagal sync pin" }, { status: 500 });
  }
}
