import { NextRequest, NextResponse } from "next/server";
import { sendFingerspotCommand, COMMAND_TYPES } from "@/lib/fingerspot";
import { supabaseInsert } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { command, params, logToHistory = true } = body;

  if (!command || !COMMAND_TYPES.includes(command)) {
    return NextResponse.json({ error: "Command tidak valid" }, { status: 400 });
  }

  try {
    const result = await sendFingerspotCommand(command, params);

    if (logToHistory) {
      const endpoint = command === "register_online" ? "reg_online" : command;
      try {
        await supabaseInsert("command_logs", {
          command_type: command,
          cloud_id: params.cloud_id || "",
          trans_id: params.trans_id || "1",
          request_payload: params,
          response_payload: { ...((typeof result.data === "object" && result.data !== null) ? result.data : {}), _command_sent: command, _endpoint: endpoint, _status_code: result.status_code },
          status: result.success ? "success" : "failed",
          endpoint,
        });
      } catch { /* don't fail */ }
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, status_code: 500, data: { error: (error as Error).message } }, { status: 500 });
  }
}
