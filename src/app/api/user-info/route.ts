import { NextRequest, NextResponse } from "next/server";
import { supabaseSelect, supabaseInsert, supabaseUpdate } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("per_page") || "15");
  const search = searchParams.get("search") || "";
  const cloudId = searchParams.get("cloud_id") || "";
  const offset = (page - 1) * perPage;

  const filters: Record<string, string> = {};
  if (search) filters.or = `(pin.ilike.*${search}*,name.ilike.*${search}*,cloud_id.ilike.*${search}*)`;
  if (cloudId) filters.cloud_id = `eq.${cloudId}`;

  const { data, count } = await supabaseSelect("userinfos", {
    select: "*", order: { column: "created_at", ascending: false },
    limit: perPage, offset, count: true, filters,
  });

  return NextResponse.json({ data, total: count, lastPage: Math.ceil(count / perPage), page, perPage });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { cloud_id, pin, name, privilege, password, rfid } = body;
  if (!cloud_id || !pin || !name) return NextResponse.json({ error: "cloud_id, pin, dan name harus diisi" }, { status: 400 });

  const { data: existing } = await supabaseSelect("userinfos", {
    select: "id", filters: { cloud_id: `eq.${cloud_id}`, pin: `eq.${pin}` },
  });

  if (existing && existing.length > 0) {
    const result = await supabaseUpdate("userinfos", {
      name, privilege: privilege || 1, password: password || "", rfid: rfid || "", synced_at: new Date().toISOString(),
    }, { cloud_id: `eq.${cloud_id}`, pin: `eq.${pin}` });
    return NextResponse.json({ success: true, data: result });
  }

  const result = await supabaseInsert("userinfos", {
    cloud_id, pin, name, privilege: privilege || 1, password: password || "", rfid: rfid || "",
    template: "", raw_payload: { source: "manual", cloud_id, pin, name }, synced_at: new Date().toISOString(),
  });
  return NextResponse.json({ success: true, data: result });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, cloud_id, pin, name, privilege } = body;
  if (!id && (!cloud_id || !pin)) return NextResponse.json({ error: "id atau (cloud_id + pin) harus diisi" }, { status: 400 });

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (privilege !== undefined) updateData.privilege = privilege;

  if (Object.keys(updateData).length === 0) return NextResponse.json({ error: "Minimal satu field harus diupdate" }, { status: 400 });

  const filters: Record<string, string> = id
    ? { id: `eq.${id}` }
    : { cloud_id: `eq.${cloud_id}`, pin: `eq.${pin}` };

  const result = await supabaseUpdate("userinfos", updateData, filters);
  return NextResponse.json({ success: true, data: result });
}
