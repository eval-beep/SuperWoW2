"use client";

import { useState, useEffect, useRef } from "react";
import { useThemeLanguage } from "@/contexts/ThemeLanguageContext";
import { useAuth } from "@/lib/auth-browser";

interface Settings {
  supabase_url: string;
  supabase_anon_key: string;
  cloud_id: string;
  cloud_ids: string;
  api_url: string;
  api_token: string;
}

export default function SettingsPage() {
  const { theme, lang, setTheme, setLang, t } = useThemeLanguage();
  const { user, profile, refreshProfile } = useAuth();
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">(theme);
  const [previewLang, setPreviewLang] = useState<"id" | "en">(lang);
  const [nickname, setNickname] = useState("");
  const [uploading, setUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<Settings>({
    supabase_url: "",
    supabase_anon_key: "",
    cloud_id: "",
    cloud_ids: "",
    api_url: "",
    api_token: "",
  });
  const [newDeviceId, setNewDeviceId] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [fetchingDevice, setFetchingDevice] = useState(false);
  const [deviceResult, setDeviceResult] = useState<{ success: boolean; message: string; data?: Record<string, string> } | null>(null);
  const [showAnonKey, setShowAnonKey] = useState(false);
  const [showApiToken, setShowApiToken] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (profile) setNickname(profile.nickname || profile.full_name || "");
  }, [profile]);

  async function handleUploadAvatar(file: File) {
    setUploading(true);
    setProfileMsg(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/auth/avatar", { method: "POST", body: formData, credentials: "include" });
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshProfile();
        setProfileMsg({ type: "ok", text: "Foto profil berhasil diupdate" });
      } else {
        setProfileMsg({ type: "err", text: data.error || "Gagal upload foto" });
      }
    } catch {
      setProfileMsg({ type: "err", text: "Gagal upload foto" });
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveNickname() {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshProfile();
        setProfileMsg({ type: "ok", text: "Profil berhasil diupdate" });
      } else {
        setProfileMsg({ type: "err", text: data.error || "Gagal update profil" });
      }
    } catch {
      setProfileMsg({ type: "err", text: "Gagal update profil" });
    } finally {
      setSavingProfile(false);
    }
  }

  async function loadSettings() {
    try {
      const res = await fetch("/api/settings", { credentials: "include" });
      const data = await res.json();
      if (data) {
        setSettings({
          supabase_url: data.supabase_url || "",
          supabase_anon_key: data.supabase_anon_key || "",
          cloud_id: data.cloud_id || "",
          cloud_ids: data.cloud_ids || data.cloud_id || "",
          api_url: data.api_url || "",
          api_token: data.api_token || "",
        });
        if (data.theme) setPreviewTheme(data.theme);
        if (data.language) setPreviewLang(data.language);
      }
    } catch (err) {
      console.error("Load settings error:", err);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/test", { credentials: "include" });
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
      setTheme(previewTheme);
      setLang(previewLang);
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, theme: previewTheme, language: previewLang }),
        credentials: "include",
      });
      const toast = document.getElementById("settings-toast");
      if (toast) {
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2500);
      }
      setTimeout(() => window.location.reload(), 300);
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
          params: { trans_id: "1", cloud_id: settings.cloud_id },
        }),
        credentials: "include",
      });
      const result = await res.json();
      if (result.success && result.data) {
        const d = result.data.data || result.data;
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
          const list = (settings.cloud_ids || settings.cloud_id || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          if (!list.includes(d.cloud_id)) list.push(d.cloud_id);
          setSettings((prev) => ({
            ...prev,
            cloud_id: d.cloud_id,
            cloud_ids: list.join(", "),
          }));
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

  async function saveCloudSettings(updates: { cloud_id?: string; cloud_ids?: string }) {
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
    } catch { /* ignore */ }
  }

  function handleAddDevice() {
    const id = newDeviceId.trim();
    if (!id) return;
    const list = (settings.cloud_ids || settings.cloud_id || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.includes(id)) return;
    const updated = [...list, id];
    const newCloudIds = updated.join(", ");
    const newDefault = settings.cloud_id || id;
    setSettings((prev) => ({
      ...prev,
      cloud_ids: newCloudIds,
      cloud_id: newDefault,
    }));
    setNewDeviceId("");
    saveCloudSettings({ cloud_id: newDefault, cloud_ids: newCloudIds });
  }

  function handleRemoveDevice(id: string) {
    const list = (settings.cloud_ids || settings.cloud_id || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length <= 1) return;
    const updated = list.filter((d) => d !== id);
    const newCloudIds = updated.join(", ");
    const newDefault = settings.cloud_id === id ? (updated[0] || "") : settings.cloud_id;
    setSettings((prev) => ({
      ...prev,
      cloud_ids: newCloudIds,
      cloud_id: newDefault,
    }));
    saveCloudSettings({ cloud_id: newDefault, cloud_ids: newCloudIds });
  }

  function handleSetDefault(id: string) {
    setSettings((prev) => ({ ...prev, cloud_id: id }));
    saveCloudSettings({ cloud_id: id });
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  }

  function updateSetting(key: keyof Settings, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  const endpointUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pktrdpqbowptkatbinhf.supabase.co"}/functions/v1/smart-task`;
  const webhookUrl = deviceResult?.data?.webhook_url || endpointUrl;

  const cardStyle = { background: previewTheme === "dark" ? "rgba(31,31,39,0.7)" : "rgba(255,255,255,0.6)", border: `1px solid ${previewTheme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.3)"}` };
  const primaryText = previewTheme === "dark" ? "#e4e1ed" : "#1a1c1c";
  const secondaryText = previewTheme === "dark" ? "#908fa0" : "#737687";
  const tertiaryText = previewTheme === "dark" ? "#c7c4d7" : "#424656";
  const inputBg = previewTheme === "dark" ? "#292932" : "#f3f3f3";
  const inputBorder = `1px solid rgba(195,198,216,0.3)`;
  const cloudIdList = (settings.cloud_ids || settings.cloud_id || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="space-y-6 max-w-2xl" style={{ background: previewTheme === "dark" ? "#13131b" : "#f9f9f9", margin: "-2rem", padding: "2rem", borderRadius: "0", minHeight: "100vh" }}>
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "Hanken Grotesk", color: primaryText }}>{t("settings")}</h1>
        <p className="text-sm mt-1" style={{ color: secondaryText }}>Konfigurasi aplikasi dan profil Anda</p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
        <h3 className="font-semibold flex items-center gap-2" style={{ fontFamily: "Hanken Grotesk", color: primaryText }}>
          <span className="material-symbols-outlined text-[20px]" style={{ color: "#004ccd" }}>person</span>Profil Saya
        </h3>
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2" style={{ borderColor: "#004ccd" }} />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: "#93f59e" }}>
                {(profile?.nickname || profile?.full_name || profile?.email || "U").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl">{uploading ? "progress_activity" : "photo_camera"}</span>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadAvatar(f); }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: primaryText }}>{profile?.full_name || "Belum ada nama"}</p>
            <p className="text-xs" style={{ color: secondaryText }}>{profile?.email || user?.email || ""}</p>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: secondaryText }}>Nickname</label>
          <div className="flex gap-2">
            <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl text-sm"
              style={{ border: inputBorder, background: inputBg, color: primaryText }}
              placeholder="Masukkan nickname" />
            <button onClick={handleSaveNickname} disabled={savingProfile || !nickname.trim()}
              className="px-4 py-2 rounded-xl text-xs font-medium text-white disabled:opacity-50"
              style={{ background: "#004ccd" }}>
              {savingProfile ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
        {profileMsg && (
          <div className="rounded-xl p-3 text-xs" style={{ background: profileMsg.type === "ok" ? "#defbe6" : "#fff1f1", color: profileMsg.type === "ok" ? "#006e2b" : "#da1e28" }}>
            {profileMsg.text}
          </div>
        )}
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

      {/* Cloud ID & Devices */}
      <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
        <h3 className="font-semibold flex items-center gap-2" style={{ fontFamily: "Hanken Grotesk", color: primaryText }}>
          <span className="material-symbols-outlined text-[20px]" style={{ color: "#004ccd" }}>devices</span>Cloud ID Device
        </h3>
        <p className="text-xs" style={{ color: secondaryText }}>Kelola daftar device Fingerspot. Device pertama dijadikan device default.</p>

        <div className="space-y-2">
          {cloudIdList.map((id) => {
            const isDefault = id === settings.cloud_id;
            return (
              <div
                key={id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer"
                style={{
                  background: isDefault ? "rgba(0,76,205,0.08)" : inputBg,
                  border: isDefault ? "2px solid rgba(0,76,205,0.3)" : inputBorder,
                }}
                onClick={() => handleSetDefault(id)}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                  style={{
                    borderColor: isDefault ? "#004ccd" : secondaryText,
                    background: isDefault ? "#004ccd" : "transparent",
                  }}
                >
                  {isDefault && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className="flex-1 text-xs" style={{ fontFamily: "JetBrains Mono", color: primaryText }}>{id}</span>
                {isDefault && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#dbe1ff", color: "#004ccd" }}>
                    Default
                  </span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveDevice(id); }}
                  disabled={cloudIdList.length <= 1}
                  className="flex-shrink-0 p-1 rounded-lg disabled:opacity-30 transition-all"
                  style={{ color: "#da1e28" }}
                  title={cloudIdList.length <= 1 ? "Tidak bisa menghapus device terakhir" : "Hapus device"}
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newDeviceId}
            onChange={(e) => setNewDeviceId(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddDevice(); }}
            className="flex-1 px-3 py-2 rounded-xl text-sm"
            style={{ border: inputBorder, background: inputBg, fontFamily: "JetBrains Mono", color: primaryText }}
            placeholder="Masukkan Cloud ID baru"
          />
          <button
            onClick={handleAddDevice}
            disabled={!newDeviceId.trim()}
            className="px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 text-white"
            style={{ background: "#006e2b" }}
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Tambah
          </button>
        </div>

        <button
          onClick={handleFetchDeviceInfo}
          disabled={fetchingDevice}
          className="w-full px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 text-white"
          style={{ background: "#004ccd" }}
        >
          <span className={`material-symbols-outlined text-[16px] ${fetchingDevice ? "animate-spin" : ""}`}>
            {fetchingDevice ? "progress_activity" : "qr_code_scanner"}
          </span>
          {fetchingDevice ? "Mengambil..." : "Ambil dari Device"}
        </button>

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
          <div className="relative">
            <input
              type={showAnonKey ? "text" : "password"}
              value={settings.supabase_anon_key}
              onChange={(e) => updateSetting("supabase_anon_key", e.target.value)}
              className="w-full px-3 py-2 pr-10 rounded-xl text-sm"
              style={{ border: inputBorder, background: inputBg, fontFamily: "JetBrains Mono", color: primaryText }}
              placeholder="eyJhbGciOiJIUzI1NiIs..."
            />
            <button
              type="button"
              onClick={() => setShowAnonKey(!showAnonKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded"
              style={{ color: secondaryText }}
              tabIndex={-1}
            >
              <span className="material-symbols-outlined text-[18px]">{showAnonKey ? "visibility" : "visibility_off"}</span>
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: secondaryText }}>Fingerspot API URL</label>
          <input
            type="text"
            value={settings.api_url}
            onChange={(e) => updateSetting("api_url", e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm"
            style={{ border: inputBorder, background: inputBg, fontFamily: "JetBrains Mono", color: primaryText }}
            placeholder="https://developer.fingerspot.io/api"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: secondaryText }}>Fingerspot API Token</label>
          <div className="relative">
            <input
              type={showApiToken ? "text" : "password"}
              value={settings.api_token}
              onChange={(e) => updateSetting("api_token", e.target.value)}
              className="w-full px-3 py-2 pr-10 rounded-xl text-sm"
              style={{ border: inputBorder, background: inputBg, fontFamily: "JetBrains Mono", color: primaryText }}
              placeholder="Z5B2BKUMQV4ED3G7"
            />
            <button
              type="button"
              onClick={() => setShowApiToken(!showApiToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded"
              style={{ color: secondaryText }}
              tabIndex={-1}
            >
              <span className="material-symbols-outlined text-[18px]">{showApiToken ? "visibility" : "visibility_off"}</span>
            </button>
          </div>
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
                onClick={() => setPreviewTheme(th)}
                className="py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ border: previewTheme === th ? "2px solid #004ccd" : inputBorder, background: previewTheme === th ? "rgba(0,76,205,0.05)" : "transparent", color: previewTheme === th ? "#004ccd" : tertiaryText }}
              >
                {th === "light" ? "Terang" : "Gelap"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: secondaryText }}>Bahasa</label>
          <div className="grid grid-cols-2 gap-2">
            {(["id", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setPreviewLang(l)}
                className="py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ border: previewLang === l ? "2px solid #004ccd" : inputBorder, background: previewLang === l ? "rgba(0,76,205,0.05)" : "transparent", color: previewLang === l ? "#004ccd" : tertiaryText }}
              >
                {l === "id" ? "Indonesia" : "English"}
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
            <p className="text-sm font-medium" style={{ color: primaryText }}>{profile?.nickname || profile?.full_name || "User"}</p>
            <p className="text-xs" style={{ color: secondaryText }}>{user?.email || ""}</p>
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
