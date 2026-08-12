"use client";

import { useState, useEffect } from "react";
import { useThemeLanguage } from "@/contexts/ThemeLanguageContext";

interface Settings {
  supabase_url: string;
  supabase_anon_key: string;
  cloud_id: string;
  fingerspot_api_url: string;
  theme: "light" | "dark";
  language: "id" | "en";
}

export default function SettingsPage() {
  const { theme, t } = useThemeLanguage();
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
  const [copied, setCopied] = useState<string | null>(null);
  const [fetchingDevice, setFetchingDevice] = useState(false);
  const [deviceResult, setDeviceResult] = useState<{ success: boolean; message: string; data?: Record<string, string> } | null>(null);

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
    } catch {
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

  async function handleFetchDeviceInfo() {
    setFetchingDevice(true);
    setDeviceResult(null);
    try {
      const res = await fetch("/api/fingerspot/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "get_device",
          params: { cloud_id: settings.cloud_id || "C2697842930C1634" },
        }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        const d = result.data;
        setDeviceResult({
          success: true,
          message: "Device ditemukan!",
          data: {
            cloud_id: d.cloud_id || "-",
            device_name: d.device_name || "-",
            webhook_url: d.webhook_url || "-",
            last_activity: d.last_activity || "N/A",
          },
        });
        if (d.cloud_id) {
          setSettings((prev) => ({ ...prev, cloud_id: d.cloud_id }));
        }
      } else {
        setDeviceResult({ success: false, message: result.data?.error || "Device tidak ditemukan" });
      }
    } catch {
      setDeviceResult({ success: false, message: "Gagal mengambil info device" });
    } finally {
      setFetchingDevice(false);
    }
  }

  async function handleCopy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function updateSetting(key: keyof Settings, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  const endpointUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pktrdpqbowptkatbinhf.supabase.co"}/functions/v1/smart-task`;
  const webhookUrl = deviceResult?.data?.webhook_url || endpointUrl;

  const cardStyle = { background: theme === "dark" ? "rgba(31,31,39,0.7)" : "rgba(255,255,255,0.6)", border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.3)"}` };
  const primaryText = theme === "dark" ? "#e4e1ed" : "#1a1c1c";
  const secondaryText = theme === "dark" ? "#908fa0" : "#737687";
  const tertiaryText = theme === "dark" ? "#c7c4d7" : "#424656";
  const inputBg = theme === "dark" ? "#292932" : "#f3f3f3";
  const inputBorder = `1px solid rgba(195,198,216,0.3)`;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "Hanken Grotesk", color: primaryText }}>{t("settings")}</h1>
        <p className="text-sm mt-1" style={{ color: secondaryText }}>Konfigurasi aplikasi dan device</p>
      </div>

      {/* Endpoint URL Card */}
      <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2" style={{ fontFamily: "Hanken Grotesk", color: primaryText }}>
            <span className="material-symbols-outlined text-[20px]" style={{ color: "#006e2b" }}>link</span>Endpoint Webhook
          </h3>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "#defbe6", color: "#006e2b" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#006e2b" }} />
            Aktif
          </span>
        </div>
        <p className="text-xs" style={{ color: secondaryText }}>URL endpoint untuk menerima data scan dari device Fingerspot secara real-time. Atur URL ini di portal Fingerspot Customer.</p>
        <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: inputBg, border: "1px solid rgba(195,198,216,0.2)" }}>
          <span className="material-symbols-outlined text-[16px] flex-shrink-0" style={{ color: "#004ccd" }}>terminal</span>
          <code className="flex-1 text-xs break-all" style={{ fontFamily: "JetBrains Mono", color: primaryText }}>{webhookUrl}</code>
          <button
            onClick={() => handleCopy(webhookUrl, "endpoint")}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-medium flex items-center gap-1 transition-all"
            style={{
              background: copied === "endpoint" ? "#defbe6" : "#dbe1ff",
              color: copied === "endpoint" ? "#006e2b" : "#004ccd",
            }}
          >
            <span className="material-symbols-outlined text-[14px]">{copied === "endpoint" ? "check" : "content_copy"}</span>
            {copied === "endpoint" ? "Tersalin!" : "Copy"}
          </button>
        </div>
        <div className="rounded-xl p-3" style={{ background: "#fff8e1", border: "1px solid rgba(178,134,0,0.15)" }}>
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] mt-0.5" style={{ color: "#b28600" }}>info</span>
            <div className="text-[11px] space-y-1" style={{ color: tertiaryText }}>
              <p className="font-medium">Cara mengatur:</p>
              <ol className="list-decimal list-inside space-y-0.5" style={{ color: secondaryText }}>
                <li>Buka <span className="font-medium" style={{ color: tertiaryText }}>Fingerspot Customer Portal</span></li>
                <li>Pilih device yang ingin diatur</li>
                <li>Masukkan URL endpoint di atas ke kolom <span className="font-medium" style={{ color: tertiaryText }}>Webhook URL</span></li>
                <li>Simpan pengaturan di portal Fingerspot</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud ID & Device */}
      <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
        <h3 className="font-semibold flex items-center gap-2" style={{ fontFamily: "Hanken Grotesk", color: primaryText }}>
          <span className="material-symbols-outlined text-[20px]" style={{ color: "#004ccd" }}>devices</span>Cloud ID Device
        </h3>
        <p className="text-xs" style={{ color: secondaryText }}>Cloud ID digunakan untuk mengidentifikasi device Fingerspot. Bisa diambil otomatis dari device atau diisi manual.</p>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: secondaryText }}>Cloud ID</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={settings.cloud_id}
              onChange={(e) => updateSetting("cloud_id", e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl text-sm"
              style={{ border: inputBorder, background: inputBg, fontFamily: "JetBrains Mono", color: primaryText }}
              placeholder="C2697842930C1634"
            />
            <button
              onClick={handleFetchDeviceInfo}
              disabled={fetchingDevice}
              className="px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 text-white"
              style={{ background: "#004ccd" }}
            >
              <span className={`material-symbols-outlined text-[16px] ${fetchingDevice ? "animate-spin" : ""}`}>
                {fetchingDevice ? "progress_activity" : "qr_code_scanner"}
              </span>
              {fetchingDevice ? "Mengambil..." : "Ambil dari Device"}
            </button>
          </div>
        </div>
        {deviceResult && (
          <div
            className="rounded-xl p-3 text-xs"
            style={{ background: deviceResult.success ? "#defbe6" : "#fff1f1", color: deviceResult.success ? "#006e2b" : "#da1e28" }}
          >
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px]">{deviceResult.success ? "check_circle" : "error"}</span>
              <div>
                <p className="font-medium">{deviceResult.message}</p>
                {deviceResult.data && (
                  <div className="mt-2 space-y-1" style={{ color: tertiaryText }}>
                    <div className="flex gap-2">
                      <span style={{ color: secondaryText }}>Nama:</span>
                      <span className="font-medium">{deviceResult.data.device_name}</span>
                    </div>
                    <div className="flex gap-2">
                      <span style={{ color: secondaryText }}>Cloud ID:</span>
                      <span className="font-medium" style={{ fontFamily: "JetBrains Mono" }}>{deviceResult.data.cloud_id}</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span style={{ color: secondaryText }}>Webhook:</span>
                      <span className="font-medium break-all" style={{ fontFamily: "JetBrains Mono", fontSize: "10px" }}>{deviceResult.data.webhook_url}</span>
                    </div>
                    <div className="flex gap-2">
                      <span style={{ color: secondaryText }}>Last Activity:</span>
                      <span className="font-medium">{deviceResult.data.last_activity}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* API Configuration */}
      <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
        <h3 className="font-semibold flex items-center gap-2" style={{ fontFamily: "Hanken Grotesk", color: primaryText }}>
          <span className="material-symbols-outlined text-[20px]" style={{ color: "#004ccd" }}>api</span>Konfigurasi API
        </h3>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: secondaryText }}>Supabase URL</label>
          <input
            type="text"
            value={settings.supabase_url}
            onChange={(e) => updateSetting("supabase_url", e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm"
            style={{ border: inputBorder, background: inputBg, fontFamily: "JetBrains Mono", color: primaryText }}
            placeholder="https://xxx.supabase.co"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: secondaryText }}>Supabase Anon Key</label>
          <input
            type="password"
            value={settings.supabase_anon_key}
            onChange={(e) => updateSetting("supabase_anon_key", e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm"
            style={{ border: inputBorder, background: inputBg, fontFamily: "JetBrains Mono", color: primaryText }}
            placeholder="eyJhbGciOiJIUzI1NiIs..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: secondaryText }}>Fingerspot API URL</label>
          <input
            type="text"
            value={settings.fingerspot_api_url}
            onChange={(e) => updateSetting("fingerspot_api_url", e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm"
            style={{ border: inputBorder, background: inputBg, fontFamily: "JetBrains Mono", color: primaryText }}
            placeholder="https://developer.fingerspot.io/api"
          />
        </div>
        <button
          onClick={handleTestConnection}
          disabled={testing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
          style={{ border: inputBorder, color: tertiaryText }}
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
      <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
        <h3 className="font-semibold flex items-center gap-2" style={{ fontFamily: "Hanken Grotesk", color: primaryText }}>
          <span className="material-symbols-outlined text-[20px]" style={{ color: "#004ccd" }}>palette</span>Tampilan
        </h3>
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: secondaryText }}>Tema</label>
          <div className="grid grid-cols-2 gap-2">
            {(["light", "dark"] as const).map((th) => (
              <button
                key={th}
                onClick={() => updateSetting("theme", th)}
                className="py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ border: settings.theme === th ? "2px solid #004ccd" : inputBorder, background: settings.theme === th ? "rgba(0,76,205,0.05)" : "transparent", color: settings.theme === th ? "#004ccd" : tertiaryText }}
              >
                {th === "light" ? "Terang" : "Gelap"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: secondaryText }}>Bahasa</label>
          <div className="grid grid-cols-2 gap-2">
            {(["id", "en"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => updateSetting("language", lang)}
                className="py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ border: settings.language === lang ? "2px solid #004ccd" : inputBorder, background: settings.language === lang ? "rgba(0,76,205,0.05)" : "transparent", color: settings.language === lang ? "#004ccd" : tertiaryText }}
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
      <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
        <h3 className="font-semibold flex items-center gap-2" style={{ fontFamily: "Hanken Grotesk", color: primaryText }}>
          <span className="material-symbols-outlined text-[20px]" style={{ color: "#004ccd" }}>person</span>Akun
        </h3>
        <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(195,198,216,0.2)" }}>
          <div>
            <p className="text-sm font-medium" style={{ color: primaryText }}>Admin Fingerspot</p>
            <p className="text-xs" style={{ color: secondaryText }}>fingerspot@gmail.com</p>
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
