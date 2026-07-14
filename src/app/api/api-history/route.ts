import { NextRequest, NextResponse } from "next/server";
import { supabaseSelect, supabaseInsert, supabaseDelete } from "@/lib/supabase";
import { sendFingerspotCommand } from "@/lib/fingerspot";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("per_page") || "15");
  const search = searchParams.get("search") || "";
  const offset = (page - 1) * perPage;

  const filters: Record<string, string> = {};
  if (search) filters.or = `(cloud_id.ilike.*${search}*,trans_id.ilike.*${search}*,command_type.ilike.*${search}*)`;

  const { data, count } = await supabaseSelect("command_logs", {
    select: "*", order: { column: "created_at", ascending: false },
    limit: perPage, offset, count: true, filters,
  });

  const { count: total } = await supabaseSelect("command_logs", { count: true });
  const { count: success } = await supabaseSelect("command_logs", { count: true, filters: { status: "eq.success" } });
  const { count: failed } = await supabaseSelect("command_logs", { count: true, filters: { status: "eq.failed" } });
  const { count: pending } = await supabaseSelect("command_logs", { count: true, filters: { status: "eq.pending" } });

  return NextResponse.json({ data, total: count, lastPage: Math.ceil(count / perPage), page, perPage, stats: { total, success, failed, pending } });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { command, cloud_id, params: cmdParams } = body;
  if (!command || !cloud_id) return NextResponse.json({ error: "command dan cloud_id harus diisi" }, { status: 400 });

  const transId = "1";
  const endpoint = command === "register_online" ? "reg_online" : command;
  const apiParams: Record<string, unknown> = { trans_id: transId, cloud_id, ...cmdParams };

  try {
    const result = await sendFingerspotCommand(command, apiParams);
    await supabaseInsert("command_logs", {
      command_type: command, cloud_id, trans_id: transId, request_payload: apiParams,
      response_payload: result.data, status: result.success ? "pending" : "failed", endpoint,
    });
    return NextResponse.json({ success: true, trans_id: transId, message: result.success ? "Command berhasil dikirim" : "Command gagal", data: result.data });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE() {
  await supabaseDelete("command_logs", { id: "not.is.null" });
  return NextResponse.json({ success: true, message: "API history cleared" });
}
