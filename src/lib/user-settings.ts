import { supabaseSelect, supabaseInsert, supabaseUpdate } from "@/lib/supabase";

const SETTINGS_DEFAULTS: Record<string, string> = {
  api_token: "Z5B2BKUMQV4ED3G7",
  cloud_id: "C2697842930C1634",
  cloud_ids: "C2697842930C1634",
  api_url: "https://developer.fingerspot.io/api",
  theme: "light",
  language: "id",
};

export async function getUserSettings(userId: string): Promise<Record<string, string>> {
  const { data } = await supabaseSelect("settings", {
    select: "key, value",
    filters: { user_id: `eq.${userId}` },
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

export async function getUserCloudIds(userId: string): Promise<string[]> {
  const settings = await getUserSettings(userId);
  const raw = settings.cloud_ids || SETTINGS_DEFAULTS.cloud_ids;
  const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const defaultId = settings.cloud_id || SETTINGS_DEFAULTS.cloud_id;
  if (ids.length === 0 && defaultId) {
    return [defaultId];
  }
  return ids;
}

export async function addUserCloudId(userId: string, cloudId: string): Promise<void> {
  const ids = await getUserCloudIds(userId);
  if (!ids.includes(cloudId)) {
    ids.push(cloudId);
    await updateUserSettings(userId, { cloud_ids: ids.join(",") });
  }
}

export async function removeUserCloudId(userId: string, cloudId: string): Promise<void> {
  const ids = await getUserCloudIds(userId);
  const filtered = ids.filter((id) => id !== cloudId);
  const updates: Record<string, string> = { cloud_ids: filtered.join(",") };

  const settings = await getUserSettings(userId);
  if (settings.cloud_id === cloudId && filtered.length > 0) {
    updates.cloud_id = filtered[0];
  }

  await updateUserSettings(userId, updates);
}

export async function setDefaultCloudId(userId: string, cloudId: string): Promise<void> {
  const ids = await getUserCloudIds(userId);
  if (!ids.includes(cloudId)) {
    ids.push(cloudId);
  }
  await updateUserSettings(userId, {
    cloud_id: cloudId,
    cloud_ids: ids.join(","),
  });
}

export async function updateUserSettings(userId: string, updates: Record<string, string>): Promise<void> {
  for (const [key, value] of Object.entries(updates)) {
    const { data: existing } = await supabaseSelect("settings", {
      select: "id",
      filters: { user_id: `eq.${userId}`, key: `eq.${key}` },
    });

    if (existing && existing.length > 0) {
      await supabaseUpdate("settings", { value, updated_at: new Date().toISOString() }, {
        user_id: userId,
        key,
      });
    } else {
      await supabaseInsert("settings", {
        user_id: userId,
        key,
        value,
      });
    }
  }
}

export async function ensureUserSettings(userId: string): Promise<void> {
  const { data } = await supabaseSelect("settings", {
    select: "id",
    filters: { user_id: `eq.${userId}` },
    limit: 1,
  });

  if (!data || data.length === 0) {
    for (const [key, value] of Object.entries(SETTINGS_DEFAULTS)) {
      await supabaseInsert("settings", {
        user_id: userId,
        key,
        value,
      });
    }
  }
}
