import { NextRequest, NextResponse } from "next/server";
import { sendFingerspotCommand, COMMAND_TYPES } from "@/lib/fingerspot";
import { supabaseInsert, supabaseDelete, supabaseSelect } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth-server";
import { getUserCloudId, getUserCloudIds } from "@/lib/user-settings";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const defaultCloudId = await getUserCloudId(user.id);

    const body = await request.json();
    const { command, params } = body;

    if (!command || !COMMAND_TYPES.includes(command)) {
      return NextResponse.json({ error: "Command tidak valid" }, { status: 400 });
    }

    let targetCloudId = defaultCloudId;
    if (params?.cloud_id) {
      const allowedIds = await getUserCloudIds(user.id);
      if (allowedIds.includes(params.cloud_id)) {
        targetCloudId = params.cloud_id;
      }
    }

    const { data: maxRow } = await supabaseSelect("command_logs", {
      select: "trans_id",
      order: { column: "trans_id", ascending: false },
      limit: 1,
      filters: { cloud_id: `eq.${targetCloudId}`, user_id: `eq.${user.id}` },
    });
    const transId = Number((maxRow?.[0] as { trans_id?: string | number } | undefined)?.trans_id || 0) + 1;

    const result = await sendFingerspotCommand(command, { ...params, cloud_id: targetCloudId, trans_id: String(transId) });

    try {
      await supabaseInsert("command_logs", {
        command_type: command,
        cloud_id: targetCloudId,
        user_id: user.id,
        trans_id: transId,
        endpoint: command,
        request_payload: params,
        response_payload: result.data || result,
        status: result.success ? "success" : "failed",
        error_message: result.data?.error || result.data?.message || null,
      });
    } catch { /* ignore log errors */ }

    if (result.success && result.data) {
      if (command === "get_attlog") {
        await saveAttlogs(targetCloudId, user.id, transId, result.data);
      } else if (command === "get_userinfo") {
        await saveUserinfo(targetCloudId, user.id, result.data);
      } else if (command === "get_all_pin") {
        await savePins(targetCloudId, user.id, result.data);
      }
    }

    return NextResponse.json({ ...result, trans_id: transId, cloud_id: targetCloudId });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const user = await requireAuth(request);
      const defaultCloudId = await getUserCloudId(user.id);
      const body = await request.json();
      const { command, params } = body;

      let targetCloudId = defaultCloudId;
      if (params?.cloud_id) {
        const allowedIds = await getUserCloudIds(user.id);
        if (allowedIds.includes(params.cloud_id)) {
          targetCloudId = params.cloud_id;
        }
      }

      const { data: maxRow } = await supabaseSelect("command_logs", {
        select: "trans_id",
        order: { column: "trans_id", ascending: false },
        limit: 1,
        filters: { cloud_id: `eq.${targetCloudId}`, user_id: `eq.${user.id}` },
      });
      const transId = Number((maxRow?.[0] as { trans_id?: string | number } | undefined)?.trans_id || 0) + 1;

      await supabaseInsert("command_logs", {
        command_type: command,
        cloud_id: targetCloudId,
        user_id: user.id,
        trans_id: transId,
        endpoint: command,
        request_payload: params,
        response_payload: { error: (e as Error).message },
        status: "failed",
        error_message: (e as Error).message,
      });
    } catch { /* ignore */ }

    return NextResponse.json({ success: false, status_code: 500, data: { error: (e as Error).message } }, { status: 500 });
  }
}

async function saveAttlogs(cloudId: string, userId: string, transId: number, data: Record<string, unknown>) {
  const records = Array.isArray(data) ? data : data.data;
  if (!Array.isArray(records)) return;

  for (const rec of records) {
    const pin = String(rec.pin || "");
    const scanTime = rec.scan_time || rec.scan || rec.scan_date || "";
    if (!pin || !scanTime) continue;

    const scanTimeStr = String(scanTime);
    const cleaned = scanTimeStr.replace(/(\+00:00|Z)$/g, "");
    const match = cleaned.match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!match) continue;
    const scanTimeISO = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6] || "00"}`;

    const verifyMethod = Number(rec.verify_method || rec.verify || 0);
    const statusScan = Number(rec.status_scan ?? 0);

    try {
      await supabaseInsert("attlogs", {
        cloud_id: cloudId,
        user_id: userId,
        pin,
        scan_time: scanTimeISO,
        verify_method: verifyMethod || null,
        status_scan: statusScan,
        source: "api_pull",
        trans_id: transId || null,
        raw_payload: rec,
      });
    } catch { /* skip duplicate */ }
  }
}

async function saveUserinfo(cloudId: string, userId: string, data: Record<string, unknown>) {
  const userData = data.data && typeof data.data === "object" && !Array.isArray(data.data)
    ? data.data as Record<string, unknown>
    : data;

  const pin = String(userData.pin || "");
  if (!pin) return;

  try {
    await supabaseInsert("userinfos", {
      cloud_id: cloudId,
      user_id: userId,
      pin,
      name: userData.name || null,
      privilege: Number(userData.privilege || 0),
      password: userData.password || null,
      rfid: userData.rfid || null,
      template: userData.template || null,
      raw_payload: userData,
      synced_at: new Date().toISOString(),
    });
  } catch { /* skip */ }
}

async function savePins(cloudId: string, userId: string, data: Record<string, unknown>) {
  let pinArr: string[] = [];
  const inner = data.data && typeof data.data === "object" ? data.data : data;

  if (Array.isArray(inner)) {
    pinArr = inner.map((r: Record<string, unknown>) => String(r.pin || "")).filter(Boolean);
  } else {
    const rawPinArr = (inner as Record<string, unknown>)?.pin_arr || (inner as Record<string, unknown>)?.pin || (inner as Record<string, unknown>)?.PIN_ARR;
    if (Array.isArray(rawPinArr)) {
      pinArr = rawPinArr.map(String).filter(Boolean);
    } else if (typeof rawPinArr === "string") {
      pinArr = rawPinArr.split(/\s+/).filter(Boolean);
    } else if (rawPinArr) {
      pinArr = [String(rawPinArr)];
    }
  }

  if (pinArr.length === 0) return;

  await supabaseDelete("pins", { cloud_id: `eq.${cloudId}`, user_id: `eq.${userId}` });

  for (const pin of pinArr) {
    try {
      await supabaseInsert("pins", {
        cloud_id: cloudId,
        user_id: userId,
        pin,
      });
    } catch { /* skip duplicate */ }
  }
}
