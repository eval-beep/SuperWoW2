"use client";

import { create } from "zustand";
import type { AppSettings } from "@/types/database";

interface SettingsState {
  settings: AppSettings;
  setSettings: (settings: Partial<AppSettings>) => void;
  loadSettings: () => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
}

const defaultSettings: AppSettings = {
  api_token: "Z5B2BKUMQV4ED3G7",
  cloud_id: "C2697842930C1634",
  api_url: "https://developer.fingerspot.io/api",
  theme: "light",
  language: "id",
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
  setSettings: (partial) =>
    set((state) => ({ settings: { ...state.settings, ...partial } })),
  loadSettings: async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        set({ settings: data });
      }
    } catch {
      // use defaults
    }
  },
  saveSettings: async (settings) => {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    set({ settings });
  },
}));
