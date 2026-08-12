import { supabaseSelect, supabaseInsert, supabaseUpdate, type SupabaseTable } from "@/lib/supabase";

const SETTINGS_DEFAULTS: Record<string, string> = {
  api_token: "Z5B2BKUMQV4ED3G7",
  cloud_id: "C2697842930C1634",
  api_url: "https://developer.fingerspot.io/api",
  theme: "light",
  language: "id",
};

const _columnCache: Record<string, boolean> = {};

export async function columnExists(table: SupabaseTable, column: string): Promise<boolean> {
  const key = `${table}.${column}`;
  if (key in _columnCache) return _columnCache[key];

  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?select=${column}&limit=0`;
    const res = await fetch(url, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_KEY!}`,
      },
    });
    _columnCache[key] = res.ok;
  } catch {
    _columnCache[key] = false;
  }

  return _columnCache[key];
}

export async function getUserSettings(userId: string): Promise<Record<string, string>> {
  const hasUserCol = await columnExists("settings", "user_id");

  const { data } = await supabaseSelect("settings", {
    select: "key, value",
    filters: hasUserCol ? { user_id: `eq.${userId}` } : {},
  });

  const settings = { ...SETTINGS_DEFAULTS };
  if (data && data.length > 0) {
    for (const row of data as { key: string; value: string }[]) {
      settings[row.key] = row.value;
    }
  }
  return settings;
}

export async function getUserCloudId(userId: string): Promise<string> {
  const settings = await getUserSettings(userId);
  return (settings.cloud_id as string) || SETTINGS_DEFAULTS.cloud_id;
}

export async function updateUserSettings(userId: string, updates: Record<string, string>): Promise<void> {
  const hasUserCol = await columnExists("settings", "user_id");

  for (const [key, value] of Object.entries(updates)) {
    const filter: Record<string, string> = hasUserCol
      ? { user_id: `eq.${userId}`, key: `eq.${key}` }
      : { key: `eq.${key}` };

    const { data: existing } = await supabaseSelect("settings", {
      select: "id",
      filters: filter,
    });

    if (existing && existing.length > 0) {
      const patchData: Record<string, unknown> = {
        value,
        updated_at: new Date().toISOString(),
      };
      if (hasUserCol) patchData.user_id = userId;

      const updateFilter: Record<string, string> = hasUserCol
        ? { user_id: userId, key }
        : { key };

      await supabaseUpdate("settings", patchData, updateFilter);
    } else {
      const insertData: Record<string, unknown> = { key, value };
      if (hasUserCol) insertData.user_id = userId;
      await supabaseInsert("settings", insertData);
    }
  }
}

export async function ensureUserSettings(userId: string): Promise<void> {
  const hasUserCol = await columnExists("settings", "user_id");

  const { data } = await supabaseSelect("settings", {
    select: "id",
    filters: hasUserCol ? { user_id: `eq.${userId}` } : {},
    limit: 1,
  });

  if (!data || data.length === 0) {
    for (const [key, value] of Object.entries(SETTINGS_DEFAULTS)) {
      const insertData: Record<string, unknown> = { key, value };
      if (hasUserCol) insertData.user_id = userId;
      try {
        await supabaseInsert("settings", insertData);
      } catch (e) {
        console.error(`[ensureUserSettings] Failed to insert ${key}:`, e);
      }
    }
  }
}
