import { NextRequest, NextResponse } from "next/server";
import { sendFingerspotCommand } from "@/lib/fingerspot";
import { supabaseInsert, supabaseSelect } from "@/lib/supabase";

export async function GET() {
  try {
    const result = await sendFingerspotCommand("get_all_pin", { trans_id: "1", cloud_id: "C2697842930C1634" });
    await supabaseInsert("command_logs", {
      command_type: "get_all_pin", cloud_id: "C2697842930C1634", trans_id: "1",
      request_payload: { trans_id: "1", cloud_id: "C2697842930C1634" },
      response_payload: result.data, status: result.success ? "pending" : "failed", endpoint: "get_all_pin",
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, data: { error: (error as Error).message } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { cloud_id } = body;
  if (!cloud_id) return NextResponse.json({ error: "cloud_id harus diisi" }, { status: 400 });

  const { data: pins } = await supabaseSelect("pins", { select: "pin", filters: { cloud_id: `eq.${cloud_id}` } });
  const { data: existingUsers } = await supabaseSelect("userinfos", { select: "pin", filters: { cloud_id: `eq.${cloud_id}` } });
  const existingPins = new Set((existingUsers as { pin: string }[] || []).map((u) => u.pin));
  const missingPins = (pins as { pin: string }[] || []).filter((p) => !existingPins.has(p.pin)).map((p) => p.pin);

  let sent = 0, failed = 0;
  for (const pin of missingPins) {
    try { await sendFingerspotCommand("get_userinfo", { trans_id: "1", cloud_id, pin }); sent++; } catch { failed++; }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return NextResponse.json({ success: true, sent, failed, total: missingPins.length, missing: missingPins });
}
