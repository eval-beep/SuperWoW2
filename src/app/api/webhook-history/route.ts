import { NextRequest, NextResponse } from "next/server";
import { supabaseSelect, supabaseDelete } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("per_page") || "15");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const offset = (page - 1) * perPage;

  const filters: Record<string, string> = {};
  filters.command_type = "not.eq.restart_device";
  if (search) filters.or = `(cloud_id.ilike.*${search}*,command_type.ilike.*${search}*)`;
  if (status) filters.status = `eq.${status}`;

  const { data, count } = await supabaseSelect("command_logs", {
    select: "*",
    order: { column: "created_at", ascending: false },
    limit: perPage, offset, count: true, filters,
  });

  return NextResponse.json({ data, total: count, lastPage: Math.ceil(count / perPage), page, perPage });
}

export async function DELETE() {
  await supabaseDelete("command_logs", { id: "not.is.null" });
  return NextResponse.json({ success: true, message: "Webhook history cleared" });
}
