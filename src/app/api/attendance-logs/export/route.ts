import { NextRequest, NextResponse } from "next/server";
import { supabaseSelect } from "@/lib/supabase";

function getWIBDateStr(date: Date): string {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const wib = new Date(utc + 7 * 3600000);
  const y = wib.getFullYear();
  const m = String(wib.getMonth() + 1).padStart(2, "0");
  const d = String(wib.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const filters: Record<string, string | string[]> = {};
  if (from && to) {
    const toDate = new Date(to + "T00:00:00");
    toDate.setDate(toDate.getDate() + 1);
    const toStr = getWIBDateStr(toDate);
    filters.scan_time = [`gte.${from}T00:00:00`, `lt.${toStr}T00:00:00`];
  } else if (from) {
    filters.scan_time = `gte.${from}T00:00:00`;
  } else if (to) {
    const toDate = new Date(to + "T00:00:00");
    toDate.setDate(toDate.getDate() + 1);
    const toStr = getWIBDateStr(toDate);
    filters.scan_time = `lt.${toStr}T00:00:00`;
  }

  const { data } = await supabaseSelect("attlogs", {
    select: "*",
    order: { column: "scan_time", ascending: false },
    limit: 1000,
    filters,
  });

  const verifyMap: Record<number, string> = { 0: "Password", 1: "Fingerprint", 2: "Face", 3: "Card", 4: "Face", 5: "QR" };
  const csvRows = ["Timestamp,Cloud ID,PIN,Name,Verify Method,Source,Trans ID".split(",").join(",")];

  for (const row of (data || []) as Record<string, unknown>[]) {
    csvRows.push([
      `"${row.scan_time}"`, `"${row.cloud_id}"`, `"${row.pin}"`, `"${row.name || ""}"`,
      `"${verifyMap[row.verify as number] || "Unknown"}"`, `"${row.source || ""}"`, `"${row.trans_id || ""}"`,
    ].join(","));
  }

  const filename = `attendance-logs-${getWIBDateStr(new Date())}.csv`;
  return new NextResponse(csvRows.join("\n"), {
    headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="${filename}"` },
  });
}
