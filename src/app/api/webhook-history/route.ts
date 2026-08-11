import { NextRequest, NextResponse } from "next/server";
import { supabaseSelect } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("per_page") || "20");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const cloudId = searchParams.get("cloud_id") || "";
  const webhookType = searchParams.get("webhook_type") || "";

  const offset = (page - 1) * perPage;

  const filters: Record<string, string | string[]> = {};
  if (search) filters.or = `(webhook_type.ilike.*${search}*,cloud_id.ilike.*${search}*,trans_id.ilike.*${search}*)`;
  if (status) filters.status = `eq.${status}`;
  if (cloudId) filters.cloud_id = `eq.${cloudId}`;
  if (webhookType) filters.webhook_type = `eq.${webhookType}`;

  const { data, count } = await supabaseSelect("webhook_logs", {
    select: "*",
    order: { column: "received_at", ascending: false },
    limit: perPage,
    offset,
    count: true,
    filters,
  });

  return NextResponse.json({
    data,
    total: count,
    lastPage: Math.ceil(count / perPage) || 1,
    page,
    perPage,
  });
}
