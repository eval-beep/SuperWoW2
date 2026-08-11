import { NextRequest, NextResponse } from "next/server";
import { supabaseSelect } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("per_page") || "20");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const cloudId = searchParams.get("cloud_id") || "";
  const commandType = searchParams.get("command_type") || "";

  const offset = (page - 1) * perPage;

  const filters: Record<string, string | string[]> = {};
  if (search) filters.or = `(command_type.ilike.*${search}*,cloud_id.ilike.*${search}*,trans_id.ilike.*${search}*)`;
  if (status) filters.status = `eq.${status}`;
  if (cloudId) filters.cloud_id = `eq.${cloudId}`;
  if (commandType) filters.command_type = `eq.${commandType}`;

  const { data: commandLogs, count } = await supabaseSelect("command_logs", {
    select: "*",
    order: { column: "created_at", ascending: false },
    limit: perPage,
    offset,
    count: true,
    filters,
  });

  const data = (commandLogs || []) as { id: string; command_type: string; cloud_id: string; trans_id: string | null; endpoint: string; request_payload: Record<string, unknown>; response_payload: Record<string, unknown>; status: string; http_status_code: number | null; error_message: string | null; created_at: string }[];

  const transIds = [...new Set(data.filter((l) => l.trans_id).map((l) => l.trans_id as string))];
  const cloudIds = [...new Set(data.map((l) => l.cloud_id))];

  let webhookLogs: { trans_id: string; cloud_id: string; raw_payload: Record<string, unknown> }[] = [];
  if (transIds.length > 0 && cloudIds.length > 0) {
    const { data: wh } = await supabaseSelect("webhook_logs", {
      select: "trans_id,cloud_id,raw_payload",
      filters: {
        trans_id: transIds.map((t) => `eq.${t}`),
        cloud_id: cloudIds.map((c) => `eq.${c}`),
      },
    });
    webhookLogs = (wh || []) as { trans_id: string; cloud_id: string; raw_payload: Record<string, unknown> }[];
  }

  const merged = data.map((log) => {
    const isAsyncPlaceholder = log.response_payload
      && Object.keys(log.response_payload).length === 2
      && (log.response_payload as { success?: boolean }).success === true
      && (log.response_payload as { trans_id?: string }).trans_id;

    if (isAsyncPlaceholder && log.trans_id) {
      const match = webhookLogs.find(
        (wh) => wh.trans_id === log.trans_id && wh.cloud_id === log.cloud_id
      );
      if (match) {
        return { ...log, webhook_payload: match.raw_payload };
      }
    }
    return log;
  });

  return NextResponse.json({
    data: merged,
    total: count,
    lastPage: Math.ceil(count / perPage) || 1,
    page,
    perPage,
  });
}
