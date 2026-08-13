import { NextRequest, NextResponse } from "next/server";
import { supabaseSelect } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth-server";
import { getUserCloudId } from "@/lib/user-settings";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const cloudId = await getUserCloudId(user.id);
    const userId = user.id;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("per_page") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const commandType = searchParams.get("command_type") || "";

    const offset = (page - 1) * perPage;

    const filters: Record<string, string | string[]> = {};
    filters.cloud_id = `eq.${cloudId}`;
    if (search) filters.or = `(command_type.ilike.*${search}*,trans_id.ilike.*${search}*)`;
    if (status) filters.status = `eq.${status}`;
    if (commandType) filters.command_type = `eq.${commandType}`;

    const { data, count } = await supabaseSelect("command_logs", {
      select: "*",
      order: { column: "created_at", ascending: false },
      limit: perPage,
      offset,
      count: true,
      filters,
    });

    return NextResponse.json({
      data: data || [],
      total: count,
      lastPage: Math.ceil(count / perPage) || 1,
      page,
      perPage,
    });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}
