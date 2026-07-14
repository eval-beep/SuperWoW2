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
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("per_page") || "15");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const verifyMethod = searchParams.get("verify_method") || "";
  const cloudId = searchParams.get("cloud_id") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const offset = (page - 1) * perPage;

  const filters: Record<string, string | string[]> = {};
  if (search) filters.or = `(pin.ilike.*${search}*,name.ilike.*${search}*,cloud_id.ilike.*${search}*)`;
  if (status) filters.status_scan = `eq.${status}`;
  if (verifyMethod) filters.verify = `eq.${verifyMethod}`;
  if (cloudId) filters.cloud_id = `eq.${cloudId}`;
  if (from && to) {
    const toDate = new Date(to + "T00:00:00");
    toDate.setDate(toDate.getDate() + 1);
    const toStr = getWIBDateStr(toDate);
    filters.and = `(scan_time.gte.${from}T00:00:00,scan_time.lt.${toStr}T00:00:00)`;
  } else if (from) {
    filters.scan_time = `gte.${from}T00:00:00`;
  } else if (to) {
    const toDate = new Date(to + "T00:00:00");
    toDate.setDate(toDate.getDate() + 1);
    const toStr = getWIBDateStr(toDate);
    filters.scan_time = `lt.${toStr}T00:00:00`;
  }

  const { data, count } = await supabaseSelect("attlogs", {
    select: "*",
    order: { column: "scan_time", ascending: false },
    limit: perPage, offset, count: true, filters,
  });

  const { count: total } = await supabaseSelect("attlogs", { count: true });
  const { count: success } = await supabaseSelect("attlogs", { count: true, filters: { status_scan: "eq.0" } });
  const { count: failed } = await supabaseSelect("attlogs", { count: true, filters: { status_scan: "eq.1" } });

  const todayStr = getWIBDateStr(new Date());
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = getWIBDateStr(tomorrowDate);
  const { count: todayCount } = await supabaseSelect("attlogs", {
    count: true, filters: { scan_time: [`gte.${todayStr}T00:00:00`, `lt.${tomorrowStr}T00:00:00`] },
  });

  const { data: allPins } = await supabaseSelect("attlogs", { select: "pin" });
  const uniqueEmployees = new Set((allPins as { pin: string }[] || []).map((r) => r.pin)).size;

  return NextResponse.json({
    data, total: count, lastPage: Math.ceil(count / perPage), page, perPage,
    stats: { total, success, failed, today: todayCount, unique_employees: uniqueEmployees },
  });
}
