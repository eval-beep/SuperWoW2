import { NextRequest, NextResponse } from "next/server";
import { supabaseSelect } from "@/lib/supabase";
import type { SupabaseTable } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table") as SupabaseTable;

  if (!table) {
    return NextResponse.json({ error: "table param required" }, { status: 400 });
  }

  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("per_page") || "15");
  const limit = searchParams.has("limit") ? parseInt(searchParams.get("limit")!) : perPage;
  const offset = searchParams.has("offset") ? parseInt(searchParams.get("offset")!) : (page - 1) * perPage;
  const search = searchParams.get("search") || "";

  const params = {
    select: searchParams.get("select") || "*",
    limit,
    offset,
    count: searchParams.get("count") === "true",
    order: searchParams.get("order")
      ? (() => {
          const [col, dir] = searchParams.get("order")!.split(".");
          return { column: col, ascending: dir !== "desc" };
        })()
      : undefined,
    filters: {} as Record<string, string | string[]>,
  };

  if (search) {
    params.filters.or = `(pin.ilike.*${search}*,name.ilike.*${search}*,cloud_id.ilike.*${search}*)`;
  }

  const knownParams = ["table", "select", "limit", "offset", "count", "order", "search", "page", "per_page"];
  for (const [key, value] of searchParams.entries()) {
    if (!knownParams.includes(key)) {
      if (!value.startsWith("eq.") && !value.startsWith("neq.") && !value.startsWith("gt.") && !value.startsWith("gte.") && !value.startsWith("lt.") && !value.startsWith("lte.") && !value.startsWith("like.") && !value.startsWith("ilike.") && !value.startsWith("or.") && !value.startsWith("and.")) {
        params.filters[key] = `eq.${value}`;
      } else {
        params.filters[key] = value;
      }
    }
  }

  const { data, count } = await supabaseSelect(table, params);

  return NextResponse.json({
    data,
    count,
    lastPage: limit ? Math.ceil(count / limit) : 1,
    page,
    perPage: limit,
  });
}
