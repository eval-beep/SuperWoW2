import { NextRequest, NextResponse } from "next/server";
import { sendFingerspotCommand, COMMAND_TYPES } from "@/lib/fingerspot";
import { supabaseInsert, supabaseDelete } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { command, params } = body;

  if (!command || !COMMAND_TYPES.includes(command)) {
    return NextResponse.json({ error: "Command tidak valid" }, { status: 400 });
  }

  try {
    const result = await sendFingerspotCommand(command, params);

    if (result.success && result.data) {
      const cloudId = params.cloud_id || "C2697842930C1634";
      const transId = params.trans_id || "1";

      if (command === "get_attlog") {
        await saveAttlogs(cloudId, transId, result.data);
      } else if (command === "get_userinfo") {
        await saveUserinfo(cloudId, result.data);
      } else if (command === "get_all_pin") {
        await savePins(cloudId, result.data);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, status_code: 500, data: { error: (error as Error).message } }, { status: 500 });
  }
}

async function saveAttlogs(cloudId: string, transId: string, data: Record<string, unknown>) {
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

async function saveUserinfo(cloudId: string, data: Record<string, unknown>) {
  const userData = data.data && typeof data.data === "object" && !Array.isArray(data.data)
    ? data.data as Record<string, unknown>
    : data;

  const pin = String(userData.pin || "");
  if (!pin) return;

  try {
    await supabaseInsert("userinfos", {
      cloud_id: cloudId,
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

async function savePins(cloudId: string, data: Record<string, unknown>) {
  let pinArr: string[] = [];
  const inner = data.data && typeof data.data === "object" ? data.data : data;

  if (Array.isArray(inner)) {
    pinArr = inner.map((r: Record<string, unknown>) => String(r.pin || "")).filter(Boolean);
  } else if (Array.isArray((inner as Record<string, unknown>).pin_arr)) {
    pinArr = ((inner as Record<string, unknown>).pin_arr as unknown[]).map(String).filter(Boolean);
  }

  if (pinArr.length === 0) return;

  await supabaseDelete("pins", { cloud_id: `eq.${cloudId}` });

  for (const pin of pinArr) {
    try {
      await supabaseInsert("pins", {
        cloud_id: cloudId,
        pin,
      });
    } catch { /* skip duplicate */ }
  }
}
