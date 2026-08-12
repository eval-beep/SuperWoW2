import { NextRequest, NextResponse } from "next/server";
import { supabaseSelect, supabaseInsert, supabaseUpdate } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth-server";
import { getUserCloudId } from "@/lib/user-settings";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const userCloudId = await getUserCloudId(user.id);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("per_page") || "15");
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * perPage;

    const filters: Record<string, string> = {};
    filters.cloud_id = `eq.${userCloudId}`;
    if (search) filters.or = `(pin.ilike.*${search}*,name.ilike.*${search}*)`;

    const { data, count } = await supabaseSelect("userinfos", {
      select: "*", order: { column: "created_at", ascending: false },
      limit: perPage, offset, count: true, filters,
    });

    return NextResponse.json({ data, total: count, lastPage: Math.ceil(count / perPage), page, perPage });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const userCloudId = await getUserCloudId(user.id);

    const body = await request.json();
    const { pin, name, privilege, password, rfid } = body;
    if (!pin || !name) return NextResponse.json({ error: "pin dan name harus diisi" }, { status: 400 });

    const { data: existing } = await supabaseSelect("userinfos", {
      select: "id", filters: { cloud_id: `eq.${userCloudId}`, pin: `eq.${pin}`, user_id: `eq.${user.id}` },
    });

    if (existing && existing.length > 0) {
      const result = await supabaseUpdate("userinfos", {
        name, privilege: privilege || 1, password: password || "", rfid: rfid || "", synced_at: new Date().toISOString(),
      }, { cloud_id: `eq.${userCloudId}`, pin: `eq.${pin}`, user_id: `eq.${user.id}` });
      return NextResponse.json({ success: true, data: result });
    }

    const result = await supabaseInsert("userinfos", {
      cloud_id: userCloudId, user_id: user.id, pin, name, privilege: privilege || 1, password: password || "", rfid: rfid || "",
      template: "", raw_payload: { source: "manual", cloud_id: userCloudId, pin, name }, synced_at: new Date().toISOString(),
    });
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Gagal menyimpan data" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const { id, pin, name, privilege } = body;
    if (!id && !pin) return NextResponse.json({ error: "id atau pin harus diisi" }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (privilege !== undefined) updateData.privilege = privilege;

    if (Object.keys(updateData).length === 0) return NextResponse.json({ error: "Minimal satu field harus diupdate" }, { status: 400 });

    const filters: Record<string, string> = id
      ? { id: `eq.${id}`, user_id: `eq.${user.id}` }
      : { pin: `eq.${pin}`, user_id: `eq.${user.id}` };

    const result = await supabaseUpdate("userinfos", updateData, filters);
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Gagal mengupdate data" }, { status: 500 });
  }
}
