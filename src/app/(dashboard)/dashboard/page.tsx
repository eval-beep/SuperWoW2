"use client";

import { useEffect, useState } from "react";
import { formatFingerspotDate, formatFingerspotTime, parseFingerspotTimestamp } from "@/lib/utils";
import { useThemeLanguage } from "@/contexts/ThemeLanguageContext";

interface Stats {
  totalUsers: number;
  totalAttlogs: number;
  totalWebhooks: number;
}

interface RecentAttlog {
  pin: string;
  name: string;
  date: string;
  time: string;
  status: string;
}

interface DeviceStatus {
  status: "online" | "idle" | "offline";
  lastActivity: string | null;
  cloudId: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalAttlogs: 0, totalWebhooks: 0 });
  const [recentAttlogs, setRecentAttlogs] = useState<RecentAttlog[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({ status: "offline", lastActivity: null, cloudId: "" });
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [now, setNow] = useState(0);
  const [allCloudIds, setAllCloudIds] = useState<string[]>([]);
  const [selectedDeviceFilter, setSelectedDeviceFilter] = useState("");
  const { theme, t } = useThemeLanguage();

  useEffect(() => {
    loadCloudIds();
    loadDashboard();
    const interval = setInterval(loadDashboard, 60000);
    return () => clearInterval(interval);
  }, [selectedDeviceFilter]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  async function loadCloudIds() {
    try {
      const res = await fetch("/api/settings", { credentials: "include" });
      const data = await res.json();
      if (data?.cloud_ids) {
        const ids = data.cloud_ids.split(",").map((s: string) => s.trim()).filter(Boolean);
        setAllCloudIds(ids);
      } else if (data?.cloud_id) {
        setAllCloudIds([data.cloud_id]);
      }
    } catch { /* ignore */ }
  }

  async function loadDashboard() {
    try {
      const url = selectedDeviceFilter ? `/api/dashboard?cloud_id=${encodeURIComponent(selectedDeviceFilter)}` : "/api/dashboard";
      const res = await fetch(url, { credentials: "include" });
      const json = await res.json();

      if (json.error === "Unauthorized") {
        setAuthError(true);
        return;
      }

      setStats(json.stats || { totalUsers: 0, totalAttlogs: 0, totalWebhooks: 0 });
      setDeviceStatus({
        status: "offline",
        lastActivity: null,
        cloudId: json.cloudId || "",
      });

      const attlogsFormatted = (json.recentAttlogs || []).map((row: Record<string, unknown>) => ({
        pin: row.pin as string,
        name: (row.name as string) || "-",
        date: formatFingerspotDate(row.scan_time as string),
        time: formatFingerspotTime(row.scan_time as string),
        status: (row.status_scan as number) === 0 ? "MASUK" : "KELUAR",
      }));
      setRecentAttlogs(attlogsFormatted);

      const lastAttlog = json.latestAttlog;
      const lastActivityTime = lastAttlog?.scan_time ? parseFingerspotTimestamp(lastAttlog.scan_time).getTime() : 0;

      let status: "online" | "idle" | "offline" = "offline";
      if (lastActivityTime > 0) {
        const elapsed = Date.now() - lastActivityTime;
        if (elapsed < 5 * 60 * 1000) status = "online";
        else if (elapsed < 60 * 60 * 1000) status = "idle";
        else status = "offline";
      }

      setDeviceStatus({
        status,
        lastActivity: lastActivityTime > 0 ? new Date(lastActivityTime).toISOString() : null,
        cloudId: json.cloudId || "",
      });
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }

  const cardStyle = { background: theme === "dark" ? "rgba(31,31,39,0.7)" : "rgba(255,255,255,0.6)", border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.3)"}` };
  const headingColor = theme === "dark" ? "#e4e1ed" : "#1a1c1c";
  const mutedColor = theme === "dark" ? "#908fa0" : "#737687";
  const subtleColor = theme === "dark" ? "#c7c4d7" : "#424656";
  const altBorderColor = theme === "dark" ? "rgba(70,69,84,0.5)" : "rgba(195,198,216,0.2)";
  const altBgBorder = theme === "dark" ? "rgba(70,69,84,0.5)" : "rgba(195,198,216,0.1)";
  const rowAltBg = theme === "dark" ? "rgba(41,41,50,0.3)" : "rgba(243,243,243,0.3)";
  const infoBg = theme === "dark" ? "#292932" : "#f3f3f3";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3" style={{ color: mutedColor }}>
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          <span style={{ fontFamily: "JetBrains Mono" }}>{t("loading")}</span>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-5xl" style={{ color: "#da1e28" }}>error</span>
          <p className="text-lg font-semibold" style={{ fontFamily: "Hanken Grotesk", color: headingColor }}>Sesi telah berakhir</p>
          <p className="text-sm" style={{ color: mutedColor }}>Silakan login ulang untuk melanjutkan.</p>
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
              window.location.href = "/login";
            }}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "#004ccd", fontFamily: "Inter" }}
          >
            Login Ulang
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = {
    online: { bg: "#defbe6", color: "#006e2b", dot: "#006e2b", label: "Online", icon: "check_circle" as const },
    idle: { bg: "#fff8e1", color: "#b28600", dot: "#b28600", label: "Idle", icon: "schedule" as const },
    offline: { bg: "#fff1f1", color: "#da1e28", dot: "#da1e28", label: "Offline", icon: "cloud_off" as const },
  };
  const sc = statusConfig[deviceStatus.status];

  return (
    <div className="space-y-6">
      {/* Device Status Header */}
      <div className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={cardStyle}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: sc.bg }}>
            <span className="material-symbols-outlined text-xl" style={{ color: sc.color }}>{sc.icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold" style={{ fontFamily: "Hanken Grotesk", color: headingColor }}>{t("deviceStatus")}</h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: sc.bg, color: sc.color }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: sc.dot }} />
                {sc.label}
              </span>
            </div>
            <p className="text-[10px] mt-0.5" style={{ fontFamily: "JetBrains Mono", color: mutedColor }}>
              {deviceStatus.cloudId ? `${t("cloudId")}: ${deviceStatus.cloudId}` : "Tidak ada device terdeteksi"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {allCloudIds.length > 1 && (
            <select value={selectedDeviceFilter} onChange={(e) => setSelectedDeviceFilter(e.target.value)} className="px-3 py-2 rounded-xl text-xs font-medium" style={{ border: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195,198,216,0.3)"}`, background: theme === "dark" ? "#292932" : "#f3f3f3", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c", fontFamily: "JetBrains Mono" }}>
              <option value="">Semua</option>
              {allCloudIds.map((id) => <option key={id} value={id}>{id}</option>)}
            </select>
          )}
          <div className="flex items-center gap-4 text-[10px]" style={{ fontFamily: "JetBrains Mono", color: mutedColor }}>
            {deviceStatus.lastActivity && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {t("lastActivity")}: {formatTimeAgo(deviceStatus.lastActivity, now)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl p-5" style={cardStyle}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ fontFamily: "JetBrains Mono", color: mutedColor, letterSpacing: "0.05em" }}>{t("totalUsers")}</p>
              <p className="text-3xl font-bold mt-2" style={{ fontFamily: "Hanken Grotesk", color: headingColor }}>{stats.totalUsers.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#dbe1ff" }}>
              <span className="material-symbols-outlined text-xl" style={{ color: "#004ccd" }}>group</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-5" style={cardStyle}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ fontFamily: "JetBrains Mono", color: mutedColor, letterSpacing: "0.05em" }}>{t("totalAttlogs")}</p>
              <p className="text-3xl font-bold mt-2" style={{ fontFamily: "Hanken Grotesk", color: headingColor }}>{stats.totalAttlogs.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#defbe6" }}>
              <span className="material-symbols-outlined text-xl" style={{ color: "#006e2b" }}>fact_check</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-5" style={cardStyle}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ fontFamily: "JetBrains Mono", color: mutedColor, letterSpacing: "0.05em" }}>{t("totalWebhooks")}</p>
              <p className="text-3xl font-bold mt-2" style={{ fontFamily: "Hanken Grotesk", color: headingColor }}>{stats.totalWebhooks.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#fff1f1" }}>
              <span className="material-symbols-outlined text-xl" style={{ color: "#da1e28" }}>webhook</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <div className="rounded-2xl p-5" style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold" style={{ fontFamily: "Hanken Grotesk", color: headingColor }}>{t("recentScans")}</h3>
            <a href="/attendance-logs" className="text-xs font-medium hover:underline" style={{ color: "#004ccd" }}>{t("viewAll")}</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${altBorderColor}` }}>
                  <th className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ fontFamily: "JetBrains Mono", color: mutedColor }}>PIN</th>
                  <th className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ fontFamily: "JetBrains Mono", color: mutedColor }}>{t("name")}</th>
                  <th className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ fontFamily: "JetBrains Mono", color: mutedColor }}>{t("date")}</th>
                  <th className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ fontFamily: "JetBrains Mono", color: mutedColor }}>{t("time")}</th>
                  <th className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ fontFamily: "JetBrains Mono", color: mutedColor }}>{t("status")}</th>
                </tr>
              </thead>
              <tbody>
                {recentAttlogs.length > 0 ? (
                  recentAttlogs.map((log, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${altBgBorder}`, background: i % 2 === 0 ? "transparent" : rowAltBg }}>
                      <td className="py-3 px-3 font-medium" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>{log.pin}</td>
                      <td className="py-3 px-3" style={{ color: headingColor }}>{log.name}</td>
                      <td className="py-3 px-3" style={{ color: mutedColor }}>{log.date}</td>
                      <td className="py-3 px-3" style={{ fontFamily: "JetBrains Mono", color: mutedColor }}>{log.time}</td>
                      <td className="py-3 px-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            background: log.status === "MASUK" ? "#defbe6" : "#dbe1ff",
                            color: log.status === "MASUK" ? "#006e2b" : "#004ccd",
                          }}
                        >
                          {log.status === "MASUK" ? t("scanIn") : t("scanOut")}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="py-6 text-center" style={{ color: mutedColor }}>{t("noActivity")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Health */}
        <div className="rounded-2xl p-5" style={cardStyle}>
          <h3 className="text-base font-bold mb-4" style={{ fontFamily: "Hanken Grotesk", color: headingColor }}>{t("dataHealth")}</h3>
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ background: infoBg }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-lg" style={{ color: "#004ccd" }}>speed</span>
                <span className="text-xs font-medium" style={{ color: subtleColor }}>{t("responseRate")}</span>
              </div>
              <p className="text-2xl font-bold" style={{ fontFamily: "JetBrains Mono", color: headingColor }}>240</p>
              <p className="text-[10px] mt-1" style={{ color: mutedColor }}>ms average</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: infoBg }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-lg" style={{ color: "#006e2b" }}>timer</span>
                <span className="text-xs font-medium" style={{ color: subtleColor }}>{t("latency")}</span>
              </div>
              <p className="text-2xl font-bold" style={{ fontFamily: "JetBrains Mono", color: headingColor }}>0.338</p>
              <p className="text-[10px] mt-1" style={{ color: mutedColor }}>seconds / 400</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr: string, nowMs: number): string {
  const d = new Date(dateStr);
  const seconds = Math.floor((nowMs - d.getTime()) / 1000);
  if (seconds < 60) return `${seconds}d lalu`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  return `${days}h lalu`;
}
