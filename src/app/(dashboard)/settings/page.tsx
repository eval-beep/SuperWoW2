"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Settings {
  supabase_url: string;
  supabase_anon_key: string;
  cloud_id: string;
  fingerspot_api_url: string;
  theme: "light" | "dark";
  language: "id" | "en";
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>({
    supabase_url: "",
    supabase_anon_key: "",
    cloud_id: "",
    fingerspot_api_url: "",
    theme: "light",
    language: "id",
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data) {
        setSettings({
          supabase_url: data.supabase_url || "",
          supabase_anon_key: data.supabase_anon_key || "",
          cloud_id: data.cloud_id || "",
          fingerspot_api_url: data.fingerspot_api_url || "",
          theme: data.theme || "light",
          language: data.language || "id",
        });
      }
    } catch (err) {
      console.error("Load settings error:", err);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/test");
      const data = await res.json();
      setTestResult({ success: data.success, message: data.message });
    } catch (err) {
      setTestResult({ success: false, message: "Gagal menghubungkan" });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const toast = document.getElementById("settings-toast");
      if (toast) {
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2500);
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function updateSetting(key: keyof Settings, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Pengaturan</h1>
        <p className="text-sm mt-1" style={{ color: "#737687" }}>Konfigurasi aplikasi dan akun</p>
      </div>

      {/* API Configuration */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
        <h3 className="font-semibold flex items-center gap-2" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>
          <span className="material-symbols-outlined text-[20px]" style={{ color: "#004ccd" }}>api</span>Konfigurasi API
        </h3>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#737687" }}>Supabase URL</label>
          <input
            type="text"
            value={settings.supabase_url}
            onChange={(e) => updateSetting("supabase_url", e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm"
            style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", fontFamily: "JetBrains Mono", color: "#1a1c1c" }}
            placeholder="https://xxx.supabase.co"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#737687" }}>Supabase Anon Key</label>
          <input
            type="password"
            value={settings.supabase_anon_key}
            onChange={(e) => updateSetting("supabase_anon_key", e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm"
            style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", fontFamily: "JetBrains Mono", color: "#1a1c1c" }}
            placeholder="eyJhbGciOiJIUzI1NiIs..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#737687" }}>Cloud ID</label>
          <input
            type="text"
            value={settings.cloud_id}
            onChange={(e) => updateSetting("cloud_id", e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm"
            style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", fontFamily: "JetBrains Mono", color: "#1a1c1c" }}
            placeholder="C2697842930C1634"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#737687" }}>Fingerspot API URL</label>
          <input
            type="text"
            value={settings.fingerspot_api_url}
            onChange={(e) => updateSetting("fingerspot_api_url", e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm"
            style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", fontFamily: "JetBrains Mono", color: "#1a1c1c" }}
            placeholder="https://api.fingerspot.io/v2"
          />
        </div>
        <button
          onClick={handleTestConnection}
          disabled={testing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
          style={{ border: "1px solid rgba(195,198,216,0.3)", color: "#424656" }}
        >
          <span className={`material-symbols-outlined text-[18px] ${testing ? "animate-spin" : ""}`}>{testing ? "progress_activity" : "wifi"}</span>
          {testing ? "Menguji..." : "Test Koneksi"}
        </button>
        {testResult && (
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{ background: testResult.success ? "#defbe6" : "#fff1f1", color: testResult.success ? "#006e2b" : "#da1e28" }}
          >
            <span className="material-symbols-outlined text-[18px]">{testResult.success ? "check_circle" : "error"}</span>
            {testResult.message}
          </div>
        )}
      </div>

      {/* Appearance */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
        <h3 className="font-semibold flex items-center gap-2" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>
          <span className="material-symbols-outlined text-[20px]" style={{ color: "#004ccd" }}>palette</span>Tampilan
        </h3>
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: "#737687" }}>Tema</label>
          <div className="grid grid-cols-2 gap-2">
            {(["light", "dark"] as const).map((th) => (
              <button
                key={th}
                onClick={() => updateSetting("theme", th)}
                className="py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ border: settings.theme === th ? "2px solid #004ccd" : "1px solid rgba(195,198,216,0.3)", background: settings.theme === th ? "rgba(0,76,205,0.05)" : "transparent", color: settings.theme === th ? "#004ccd" : "#424656" }}
              >
                {th === "light" ? "Terang" : "Gelap"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: "#737687" }}>Bahasa</label>
          <div className="grid grid-cols-2 gap-2">
            {(["id", "en"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => updateSetting("language", lang)}
                className="py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ border: settings.language === lang ? "2px solid #004ccd" : "1px solid rgba(195,198,216,0.3)", background: settings.language === lang ? "rgba(0,76,205,0.05)" : "transparent", color: settings.language === lang ? "#004ccd" : "#424656" }}
              >
                {lang === "id" ? "Indonesia" : "English"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2.5 rounded-xl text-white font-medium text-sm flex items-center gap-2 disabled:opacity-50"
        style={{ background: "#004ccd" }}
      >
        <span className={`material-symbols-outlined text-[18px] ${saving ? "animate-spin" : ""}`}>{saving ? "progress_activity" : "save"}</span>
        {saving ? "Menyimpan..." : "Simpan Pengaturan"}
      </button>

      {/* Account */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
        <h3 className="font-semibold flex items-center gap-2" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>
          <span className="material-symbols-outlined text-[20px]" style={{ color: "#004ccd" }}>person</span>Akun
        </h3>
        <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(195,198,216,0.2)" }}>
          <div>
            <p className="text-sm font-medium" style={{ color: "#1a1c1c" }}>Admin Fingerspot</p>
            <p className="text-xs" style={{ color: "#737687" }}>fingerspot@gmail.com</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ background: "#defbe6", color: "#006e2b" }}>Aktif</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium" style={{ color: "#da1e28" }}>
          <span className="material-symbols-outlined text-[18px]">logout</span>Keluar
        </button>
      </div>

      {/* Toast */}
      <div id="settings-toast" className="lg-toast">
        <span className="material-symbols-outlined text-[18px]" style={{ color: "#006e2b" }}>check_circle</span>
        <span>Pengaturan tersimpan</span>
      </div>
    </div>
  );
}
