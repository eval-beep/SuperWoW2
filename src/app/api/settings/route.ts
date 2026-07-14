import { NextRequest, NextResponse } from "next/server";
import { supabaseSelect, supabaseUpdate } from "@/lib/supabase";

const SETTINGS_DEFAULTS = {
  api_token: "Z5B2BKUMQV4ED3G7",
  cloud_id: "C2697842930C1634",
  api_url: "https://developer.fingerspot.io/api",
  theme: "light",
  language: "id",
};

async function getSettings(): Promise<Record<string, unknown>> {
  try {
    const { data } = await supabaseSelect("settings", { select: "key, value" });
    if (data && data.length > 0) {
      const settings: Record<string, unknown> = { ...SETTINGS_DEFAULTS };
      for (const row of data as { key: string; value: unknown }[]) {
        settings[row.key] = row.value;
      }
      return settings;
    }
  } catch { /* fallback */ }
  return { ...SETTINGS_DEFAULTS };
}

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  try {
    for (const [key, value] of Object.entries(body)) {
      await supabaseUpdate("settings", { value, updated_at: new Date().toISOString() }, { key });
    }
  } catch { /* ignore */ }
  return NextResponse.json({ success: true, ...body });
}
