import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type SupabaseTable = "pins" | "userinfos" | "attlogs" | "command_logs" | "webhook_logs" | "settings";

export interface SupabaseQueryParams {
  select?: string;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
  filters?: Record<string, string | string[]>;
  count?: boolean;
}

function buildQuery(params: SupabaseQueryParams): string {
  const parts: string[] = [];

  if (params.select) {
    parts.push(`select=${encodeURIComponent(params.select)}`);
  }

  if (params.order) {
    parts.push(`order=${params.order.column}.${params.order.ascending ? "asc" : "desc"}`);
  }

  if (params.limit) {
    parts.push(`limit=${params.limit}`);
  }

  if (params.offset) {
    parts.push(`offset=${params.offset}`);
  }

  if (params.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      if (Array.isArray(value)) {
        for (const v of value) {
          parts.push(`${key}=${encodeURIComponent(v)}`);
        }
      } else {
        parts.push(`${key}=${encodeURIComponent(value)}`);
      }
    }
  }

  return parts.join("&");
}

export async function supabaseSelect(
  table: SupabaseTable,
  params: SupabaseQueryParams = {}
): Promise<{ data: unknown[]; count: number }> {
  const query = buildQuery(params);
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?${query}`;

  const headers: Record<string, string> = {
    apikey: process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_KEY!}`,
    "Content-Type": "application/json",
  };

  if (params.count) {
    headers["Prefer"] = "count=exact";
  }

  const res = await fetch(url, { headers, next: { revalidate: 0 } });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Supabase query error [${table}]: ${res.status} ${err}`);
    return { data: [], count: 0 };
  }

  const data = await res.json();
  let count = 0;

  if (params.count) {
    const contentRange = res.headers.get("Content-Range");
    if (contentRange) {
      const match = contentRange.match(/\/(\d+)$/);
      if (match) count = parseInt(match[1], 10);
    }
  }

  return { data, count };
}

export async function supabaseInsert(
  table: SupabaseTable,
  data: Record<string, unknown>
): Promise<unknown> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_KEY!,
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_KEY!}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase insert error: ${err}`);
  }

  return res.json();
}

export async function supabaseUpdate(
  table: SupabaseTable,
  data: Record<string, unknown>,
  filters: Record<string, string>
): Promise<unknown> {
  const filterStr = Object.entries(filters)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?${filterStr}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_KEY!,
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_KEY!}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase update error: ${err}`);
  }

  return res.json();
}

export async function supabaseDelete(
  table: SupabaseTable,
  filters: Record<string, string>
): Promise<boolean> {
  const filterStr = Object.entries(filters)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?${filterStr}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_KEY!,
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_KEY!}`,
    },
  });

  return res.ok;
}

export async function supabaseRpc(
  fn: string,
  params: Record<string, unknown> = {}
): Promise<unknown> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/${fn}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_KEY!,
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_KEY!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase RPC error: ${err}`);
  }

  return res.json();
}
