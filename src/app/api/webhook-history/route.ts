import { NextRequest, NextResponse } from "next/server";
import { supabaseSelect, supabaseDelete } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("per_page") || "15");
  const search = searchParams.get("search") || "";
  const offset = (page - 1) * perPage;

  const filters: Record<string, string> = {};
  if (search) filters.or = `(cloud_id.ilike.*${search}*,webhook_type.ilike.*${search}*)`;

  // Single query: data + count combined
  const { data, count } = await supabaseSelect("webhook_logs", {
    select: "id,cloud_id,webhook_type,status_code,received_at",
    order: { column: "received_at", ascending: false },
    limit: perPage, offset, count: true, filters,
  });

  // Compute type counts from current page data
  const typeCounts: Record<string, number> = {};
  for (const row of (data || []) as { webhook_type: string }[]) {
    typeCounts[row.webhook_type] = (typeCounts[row.webhook_type] || 0) + 1;
  }

  return NextResponse.json({ data, total: count, lastPage: Math.ceil(count / perPage), page, perPage, stats: { total: count, types: typeCounts } });
}

export async function DELETE() {
  await supabaseDelete("webhook_logs", { id: "not.is.null" });
  return NextResponse.json({ success: true, message: "Webhook history cleared" });
}
