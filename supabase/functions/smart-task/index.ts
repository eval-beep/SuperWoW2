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

  const { type, cloud_id, machine_id, trans_id, data } = payload;

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

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
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
      const d = new Date(scanTime as string);
      if (isNaN(d.getTime())) {
        console.error("Invalid scan_time:", scanTime);
        continue;
      }
      scanTimeISO = d.toISOString();
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

    console.log("Inserting attlog:", JSON.stringify(insertData).substring(0, 500));

    const { data: inserted, error } = await supabase.from("attlogs").insert(insertData).select();

    if (error) {
      console.error("attlogs insert error:", error.message, error.details, error.hint);
    } else {
      console.log("attlogs inserted:", inserted?.length);
    }
  }
}

async function processUserinfo(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  cloudId: string,
  data?: Record<string, unknown> | Record<string, unknown>[]
) {
  if (!data) {
    console.log("No data in userinfo payload, skipping");
    return;
  }
  const records = Array.isArray(data) ? data : [data];

  console.log(`Processing ${records.length} userinfo records for ${cloudId}`);

  for (const record of records) {
    const pin = String(record.pin || record.PIN || "");
    if (!pin) continue;

    const upsertData: Record<string, unknown> = {
      cloud_id: cloudId,
      pin,
      name: record.name || record.Name || null,
      password: record.password || record.Password || null,
      privilege: Number(record.privilege || record.Privilege || 0),
      finger_count: Number(record.finger_count || record.FingerCount || 0),
      face_count: Number(record.face_count || record.FaceCount || 0),
      rfid_count: Number(record.rfid_count || record.RFIDCount || 0),
      vein_count: Number(record.vein_count || record.VeinCount || 0),
      template: record.template || record.Template || null,
      raw_payload: record,
      synced_at: new Date().toISOString(),
    };

    console.log("Upserting userinfo:", JSON.stringify(upsertData).substring(0, 500));

    const { error } = await supabase.from("userinfos").upsert(upsertData, {
      onConflict: "cloud_id,pin",
    });
    if (error) {
      console.error("userinfos upsert error:", error.message, error.details, error.hint);
    } else {
      console.log("userinfo upserted:", pin);
    }

    const userName = record.name || record.Name || null;
    if (userName) {
      const { error: pinError } = await supabase
        .from("pins")
        .update({ name: userName })
        .eq("cloud_id", cloudId)
        .eq("pin", pin);
      if (pinError) console.error("pins name update error:", pinError.message);
      else console.log("pins name updated:", pin, "->", userName);
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

  let pinArr: string[] = [];

  if (Array.isArray(data)) {
    pinArr = data.map((r) => String(r.pin || r.PIN || "")).filter(Boolean);
  } else if (Array.isArray((data as Record<string, unknown>).pin_arr)) {
    pinArr = ((data as Record<string, unknown>).pin_arr as unknown[])
      .map((p) => String(p))
      .filter(Boolean);
  } else {
    const singlePin = String((data as Record<string, unknown>).pin || (data as Record<string, unknown>).PIN || "");
    if (singlePin) pinArr = [singlePin];
  }

  console.log(`Processing ${pinArr.length} pins for ${cloudId}`);

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

  const { data: inserted, error: insertError } = await supabase
    .from("pins")
    .insert(insertRows)
    .select();

  if (insertError) {
    console.error("pins insert error:", insertError.message, insertError.details);
  } else {
    console.log(`pins inserted: ${inserted?.length || 0} records for ${cloudId}`);
  }
}
