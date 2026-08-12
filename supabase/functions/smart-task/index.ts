import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}

function createSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const VALID_TYPES = [
  "realtime_attlog",
  "attlog",
  "get_userinfo",
  "get_userid_list",
  "set_userinfo",
  "delete_userinfo",
  "get_all_pin",
  "set_time",
  "register_online",
] as const;

type WebhookType = (typeof VALID_TYPES)[number];

interface WebhookPayload {
  type: WebhookType;
  cloud_id: string;
  machine_id?: string;
  trans_id?: string;
  data?: Record<string, unknown> | Record<string, unknown>[];
  status?: number;
  message?: string;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log("=== SMART-TASK WEBHOOK ===");
  console.log("Full payload:", JSON.stringify(payload));
  console.log("Payload keys:", Object.keys(payload));

  const { type, cloud_id, machine_id, trans_id, data } = payload;

  console.log("type:", type, "cloud_id:", cloud_id, "trans_id:", trans_id, "data type:", typeof data, "data:", JSON.stringify(data)?.substring(0, 1000));

  if (!type || !VALID_TYPES.includes(type)) {
    console.error("Invalid type:", type);
    return new Response(JSON.stringify({ error: `Invalid type: ${type}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!cloud_id) {
    console.error("Missing cloud_id");
    return new Response(JSON.stringify({ error: "cloud_id is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createSupabaseAdmin();

  const errors: string[] = [];

  // Map webhook_type to values allowed by DB CHECK constraint
  const dbType = type === "get_userid_list" ? "get_all_pin" : type === "attlog" ? "realtime_attlog" : type;

  // Validate trans_id + command_type against command_logs
  let commandTypeMatch = false;
  if (trans_id) {
    const { data: cmdLog } = await supabase
      .from("command_logs")
      .select("command_type")
      .eq("trans_id", trans_id)
      .eq("cloud_id", cloud_id)
      .maybeSingle();
    if (cmdLog) {
      commandTypeMatch = cmdLog.command_type === dbType;
      console.log(`Validation: trans_id=${trans_id} cmd_type=${cmdLog.command_type} vs webhook=${dbType} match=${commandTypeMatch}`);
    } else {
      console.log(`Validation: trans_id=${trans_id} not found in command_logs`);
    }
  }

  // Log every incoming webhook to webhook_logs
  const { data: whInserted, error: whLogError } = await supabase.from("webhook_logs").insert({
    webhook_type: dbType,
    cloud_id: cloud_id,
    trans_id: trans_id ?? null,
    raw_payload: payload,
    status: "success",
  }).select("id").maybeSingle();
  if (whLogError) {
    console.error("webhook_logs insert error:", whLogError.message, whLogError.details, whLogError.hint);
    errors.push(`webhook_logs: ${whLogError.message}`);
  } else {
    console.log("webhook_logs inserted OK, id:", whInserted?.id);
    // Try to update command_type_match if column exists
    if (whInserted?.id && trans_id) {
      const { error: updateErr } = await supabase
        .from("webhook_logs")
        .update({ command_type_match: commandTypeMatch })
        .eq("id", whInserted.id);
      if (updateErr) console.log("command_type_match update skipped:", updateErr.message);
    }
  }

  try {
    switch (type) {
      case "realtime_attlog":
      case "attlog":
        await processAttlog(supabase, cloud_id, machine_id, data, trans_id);
        break;
      case "get_userinfo":
        await processUserinfo(supabase, cloud_id, data);
        break;
      case "get_all_pin":
      case "get_userid_list":
        await processGetAllPin(supabase, cloud_id, data);
        break;
      default:
        console.log(`Type ${type} received but no handler needed`);
    }
  } catch (procErr) {
    console.error("Processing error:", procErr);
    errors.push(`processing: ${(procErr as Error).message}`);
  }

  if (errors.length > 0) {
    return new Response(JSON.stringify({ success: true, warnings: errors }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

async function processAttlog(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  cloudId: string,
  machineId: string | undefined,
  data?: Record<string, unknown> | Record<string, unknown>[],
  transId?: string
) {
  if (!data) {
    console.log("No data in attlog payload, skipping");
    return;
  }
  const records = Array.isArray(data) ? data : [data];

  console.log(`Processing ${records.length} attlog records for ${cloudId}`);

  for (const record of records) {
    const pin = String(record.pin || record.PIN || "");
    const scanTime = record.scan_time || record.ScanTime || record.scan || record.Scan || record.scan_date || record.ScanDate || record.att_time || record.AttTime;
    const verifyMethod = Number(record.verify_method || record.verifyMethod || record.VerifyMethod || record.verify || record.Verify || 0);
    const statusScan = Number(record.status_scan || record.statusScan || record.Status || record.status || 0);

    if (!pin || !scanTime) {
      console.error("Skipping attlog: missing pin or scan_time", JSON.stringify(record));
      continue;
    }

    let scanTimeISO: string;
    try {
      const cleaned = String(scanTime).replace(/(\+00:00|Z)$/g, "");
      const match = cleaned.match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
      if (match) {
        scanTimeISO = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6] || "00"}`;
      } else {
        const d = new Date(String(scanTime));
        if (isNaN(d.getTime())) {
          console.error("Invalid scan_time:", scanTime);
          continue;
        }
        scanTimeISO = d.toISOString().replace(/\.\d{3}Z$/, "");
      }
    } catch {
      console.error("Failed to parse scan_time:", scanTime);
      continue;
    }

    let userName = null;
    const { data: userInfo } = await supabase
      .from("userinfos")
      .select("name")
      .eq("cloud_id", cloudId)
      .eq("pin", pin)
      .single();
    if (userInfo?.name) {
      userName = userInfo.name;
    }

    const insertData = {
      cloud_id: cloudId,
      pin,
      name: userName,
      scan_time: scanTimeISO,
      verify_method: verifyMethod || null,
      status_scan: statusScan,
      source: "api_pull",
      trans_id: transId || null,
      raw_payload: record,
    };

    const { error } = await supabase.from("attlogs").insert(insertData);

    if (error) {
      console.error("attlogs insert error:", error.message, error.details, error.hint);
    } else {
      console.log("attlogs inserted:", pin, scanTimeISO);
    }
  }
}

async function processUserinfo(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  cloudId: string,
  data?: Record<string, unknown> | Record<string, unknown>[]
) {
  console.log("processUserinfo called, data type:", typeof data, "isArray:", Array.isArray(data));
  console.log("processUserinfo raw data:", JSON.stringify(data));

  if (!data) {
    console.log("No data in userinfo payload, skipping");
    return;
  }

  // Handle nested data: device may send {data: {pin, name, ...}} or {data: [{pin, name, ...}]}
  let records: Record<string, unknown>[];
  if (Array.isArray(data)) {
    records = data;
  } else if (data.data && typeof data.data === "object") {
    records = Array.isArray(data.data) ? data.data : [data.data as Record<string, unknown>];
  } else {
    records = [data];
  }

  console.log(`Processing ${records.length} userinfo records for ${cloudId}`);

  for (const record of records) {
    const pin = String(record.pin || record.PIN || record.PIN_NO || record.pin_no || "");
    if (!pin) {
      console.error("Skipping userinfo: no pin found in record:", JSON.stringify(record));
      continue;
    }

    const name = record.name || record.Name || record.USER_NAME || record.user_name || null;
    const privilege = Number(record.privilege || record.Privilege || record.PRIVILEGE || 0);
    const password = record.password || record.Password || record.PASSWORD || null;
    const rfid = record.rfid || record.RFID || record.rfid_card || record.RFID_CARD || null;
    const finger = record.finger || record.Finger || record.FINGER || null;
    const face = record.face || record.Face || record.FACE || null;
    const vein = record.vein || record.Vein || record.VEIN || null;
    const template = record.template || record.Template || record.TEMPLATE || null;

    const upsertData: Record<string, unknown> = {
      cloud_id: cloudId,
      pin,
      name,
      password,
      privilege,
      finger_count: Number(finger || 0),
      face_count: Number(face || 0),
      rfid_count: rfid ? 1 : 0,
      vein_count: Number(vein || 0),
      template,
      raw_payload: record,
      synced_at: new Date().toISOString(),
    };

    console.log("Upserting userinfo:", JSON.stringify(upsertData).substring(0, 500));

    // Try insert first, if duplicate (409) then update
    const { error: insertErr } = await supabase.from("userinfos").insert(upsertData);
    if (insertErr && insertErr.message?.includes("duplicate")) {
      const { error: updateErr } = await supabase
        .from("userinfos")
        .update({
          name,
          password,
          privilege,
          finger_count: Number(finger || 0),
          face_count: Number(face || 0),
          rfid_count: rfid ? 1 : 0,
          vein_count: Number(vein || 0),
          template,
          raw_payload: record,
          synced_at: new Date().toISOString(),
        })
        .eq("cloud_id", cloudId)
        .eq("pin", pin);
      if (updateErr) {
        console.error("userinfos update error:", updateErr.message, updateErr.details, updateErr.hint);
      } else {
        console.log("userinfo updated:", pin);
      }
    } else if (insertErr) {
      console.error("userinfos insert error:", insertErr.message, insertErr.details, insertErr.hint);
    } else {
      console.log("userinfo inserted:", pin);
    }

    if (name) {
      const { error: pinError } = await supabase
        .from("pins")
        .update({ name })
        .eq("cloud_id", cloudId)
        .eq("pin", pin);
      if (pinError) console.error("pins name update error:", pinError.message);
      else console.log("pins name updated:", pin, "->", name);
    }
  }
}

async function processGetAllPin(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  cloudId: string,
  data?: Record<string, unknown> | Record<string, unknown>[]
) {
  if (!data) {
    console.log("No data in get_all_pin payload, skipping");
    return;
  }

  console.log("processGetAllPin raw data:", JSON.stringify(data));

  let pinArr: string[] = [];

  if (Array.isArray(data)) {
    pinArr = data.map((r) => String(r.pin || r.PIN || "")).filter(Boolean);
  } else {
    const inner = data as Record<string, unknown>;
    const rawPinArr = inner.pin_arr || inner.pin || inner.PIN_ARR || inner.PIN;
    if (Array.isArray(rawPinArr)) {
      pinArr = rawPinArr.map((p) => String(p)).filter(Boolean);
    } else if (typeof rawPinArr === "string") {
      // Handle space-separated string: "1 10 11 13 2 5555"
      pinArr = rawPinArr.split(/\s+/).filter(Boolean);
    } else if (rawPinArr) {
      pinArr = [String(rawPinArr)];
    }
  }

  console.log(`Processing ${pinArr.length} pins for ${cloudId}:`, pinArr.join(", "));

  const { error: deleteError } = await supabase
    .from("pins")
    .delete()
    .eq("cloud_id", cloudId);
  if (deleteError) console.error("pins delete error:", deleteError.message);
  else console.log(`Old pins deleted for ${cloudId}`);

  const now = new Date().toISOString();

  const insertRows = pinArr.map((pin) => ({
    cloud_id: cloudId,
    pin,
    retrieved_at: now,
  }));

  const { error: insertError } = await supabase
    .from("pins")
    .insert(insertRows);

  if (insertError) {
    console.error("pins insert error:", insertError.message, insertError.details);
  } else {
    console.log(`pins inserted: ${pinArr.length} records for ${cloudId}`);
  }
}
