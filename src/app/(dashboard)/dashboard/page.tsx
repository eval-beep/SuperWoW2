"use client";

import { useEffect, useState } from "react";
import { formatFingerspotDate, formatFingerspotTime, parseFingerspotTimestamp } from "@/lib/utils";

interface Stats {
  totalUsers: number;
  totalAttlogs: number;
  totalWebhooks: number;
}

interface TopCommand {
  type: string;
  label: string;
  count: number;
  maxCount: number;
}

interface RecentAttlog {
  pin: string;
  name: string;
  date: string;
  time: string;
  status: string;
}

interface LatestPayload {
  payload: Record<string, unknown>;
  command: string;
  createdAt: string;
}

interface DeviceStatus {
  status: "online" | "idle" | "offline";
  lastActivity: string | null;
  lastCommand: string | null;
  cloudId: string;
}

const COMMAND_LABELS: Record<string, string> = {
  get_attlog: "Get Attendance Log",
  get_userinfo: "Get User Info",
  get_all_pin: "Get All PIN",
  set_userinfo: "Set User Info",
  delete_userinfo: "Delete User Info",
  set_time: "Set Time",
  register_online: "Register Online",
  restart_device: "Restart Device",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalAttlogs: 0, totalWebhooks: 0 });
  const [topCommands, setTopCommands] = useState<TopCommand[]>([]);
  const [recentAttlogs, setRecentAttlogs] = useState<RecentAttlog[]>([]);
  const [latestPayload, setLatestPayload] = useState<LatestPayload | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({ status: "offline", lastActivity: null, lastCommand: null, cloudId: "" });
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(0);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  async function loadDashboard() {
    try {
      const [usersRes, attlogsRes, webhooksRes, commandsRes, attlogsListRes, latestRes, latestAttlogRes, latestCmdRes] = await Promise.all([
        fetch("/api/supabase?table=userinfos&count=true&limit=1"),
        fetch("/api/supabase?table=attlogs&count=true&limit=1"),
        fetch("/api/supabase?table=webhook_logs&count=true&limit=1"),
        fetch("/api/supabase?table=command_logs&select=command_type&order=created_at.desc&limit=500"),
        fetch("/api/supabase?table=attlogs&select=pin,name,scan_time,status_scan&order=scan_time.desc&limit=6"),
        fetch("/api/supabase?table=command_logs&select=command_type,response_payload,created_at&order=created_at.desc&limit=1"),
        fetch("/api/supabase?table=attlogs&select=cloud_id,scan_time&order=scan_time.desc&limit=1"),
        fetch("/api/supabase?table=command_logs&select=cloud_id,command_type,created_at,status&order=created_at.desc&limit=10"),
      ]);

      const [users, attlogs, webhooks, commandsData, attlogsList, latestData, latestAttlog, latestCmds] = await Promise.all([
        usersRes.json(),
        attlogsRes.json(),
        webhooksRes.json(),
        commandsRes.json(),
        attlogsListRes.json(),
        latestRes.json(),
        latestAttlogRes.json(),
        latestCmdRes.json(),
      ]);

      setStats({
        totalUsers: users.count || 0,
        totalAttlogs: attlogs.count || 0,
        totalWebhooks: webhooks.count || 0,
      });

      const commandCounts: Record<string, number> = {};
      for (const row of commandsData.data || []) {
        commandCounts[row.command_type] = (commandCounts[row.command_type] || 0) + 1;
      }
      const maxCount = Math.max(...Object.values(commandCounts), 1);
      const sorted = Object.entries(commandCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([type, count]) => ({
          type,
          count,
          label: COMMAND_LABELS[type] || type,
          maxCount,
        }));
      setTopCommands(sorted);

      const attlogsFormatted = (attlogsList.data || []).map((row: Record<string, unknown>) => ({
        pin: row.pin as string,
        name: (row.name as string) || "-",
        date: formatFingerspotDate(row.scan_time as string),
        time: formatFingerspotTime(row.scan_time as string),
        status: (row.status_scan as number) === 0 ? "MASUK" : "KELUAR",
      }));
      setRecentAttlogs(attlogsFormatted);

      if (latestData.data?.[0]) {
        setLatestPayload({
          payload: latestData.data[0].response_payload || {},
          command: latestData.data[0].command_type,
          createdAt: latestData.data[0].created_at,
        });
      }

      // Device status logic
      const lastAttlog = latestAttlog.data?.[0];
      const lastSuccessfulCmd = (latestCmds.data || []).find((c: Record<string, unknown>) => c.status === "success");
      const now = Date.now();
      const FIVE_MIN = 5 * 60 * 1000;
      const ONE_HOUR = 60 * 60 * 1000;

      const lastAttlogTime = lastAttlog?.scan_time ? parseFingerspotTimestamp(lastAttlog.scan_time).getTime() : 0;
      const lastCmdTime = lastSuccessfulCmd?.created_at ? new Date(lastSuccessfulCmd.created_at).getTime() : 0;
      const lastActivityTime = Math.max(lastAttlogTime, lastCmdTime);

      let status: "online" | "idle" | "offline" = "offline";
      if (lastActivityTime > 0) {
        const elapsed = now - lastActivityTime;
        if (elapsed < FIVE_MIN) status = "online";
        else if (elapsed < ONE_HOUR) status = "idle";
        else status = "offline";
      }

      setDeviceStatus({
        status,
        lastActivity: lastActivityTime > 0 ? new Date(lastActivityTime).toISOString() : null,
        lastCommand: lastSuccessfulCmd?.command_type || null,
        cloudId: lastAttlog?.cloud_id || lastSuccessfulCmd?.cloud_id || "",
      });
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3" style={{ color: "#737687" }}>
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          <span style={{ fontFamily: "JetBrains Mono" }}>Memuat dashboard...</span>
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
      <div className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: sc.bg }}>
            <span className="material-symbols-outlined text-xl" style={{ color: sc.color }}>{sc.icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Status Mesin</h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: sc.bg, color: sc.color }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: sc.dot }} />
                {sc.label}
              </span>
            </div>
            <p className="text-[10px] mt-0.5" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>
              {deviceStatus.cloudId ? `Cloud ID: ${deviceStatus.cloudId}` : "Tidak ada device terdeteksi"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px]" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>
          {deviceStatus.lastActivity && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              Aktivitas terakhir: {formatTimeAgo(deviceStatus.lastActivity, now)}
            </span>
          )}
          {deviceStatus.lastCommand && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">terminal</span>
              {COMMAND_LABELS[deviceStatus.lastCommand] || deviceStatus.lastCommand}
            </span>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ fontFamily: "JetBrains Mono", color: "#737687", letterSpacing: "0.05em" }}>Pengguna Total</p>
              <p className="text-3xl font-bold mt-2" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>{stats.totalUsers.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#dbe1ff" }}>
              <span className="material-symbols-outlined text-xl" style={{ color: "#004ccd" }}>group</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ fontFamily: "JetBrains Mono", color: "#737687", letterSpacing: "0.05em" }}>Total Absensi</p>
              <p className="text-3xl font-bold mt-2" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>{stats.totalAttlogs.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#defbe6" }}>
              <span className="material-symbols-outlined text-xl" style={{ color: "#006e2b" }}>fact_check</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ fontFamily: "JetBrains Mono", color: "#737687", letterSpacing: "0.05em" }}>Total Webhook</p>
              <p className="text-3xl font-bold mt-2" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>{stats.totalWebhooks.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#fff1f1" }}>
              <span className="material-symbols-outlined text-xl" style={{ color: "#da1e28" }}>webhook</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ fontFamily: "JetBrains Mono", color: "#737687", letterSpacing: "0.05em" }}>Status Mesin</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ background: sc.bg, color: sc.color }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                  {sc.label}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: sc.bg }}>
              <span className="material-symbols-outlined text-xl" style={{ color: sc.color }}>{sc.icon}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Commands - Bar Chart */}
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
          <h3 className="text-base font-bold mb-4" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Permintaan API Teratas</h3>
          {topCommands.length > 0 ? (
            <div className="space-y-3">
              {topCommands.map((cmd, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs w-36 truncate" style={{ fontFamily: "Inter", color: "#737687" }}>{cmd.label}</span>
                  <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: "#f3f3f3" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(cmd.count / cmd.maxCount) * 100}%`,
                        background: "#004ccd",
                        minWidth: "24px",
                      }}
                    />
                  </div>
                  <span className="text-xs w-8 text-right" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{cmd.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "#737687" }}>Belum ada data</p>
          )}
        </div>

        {/* System Health */}
        <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
          <h3 className="text-base font-bold mb-4" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Kesehatan Sistem</h3>
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ background: "#f3f3f3" }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-lg" style={{ color: "#004ccd" }}>speed</span>
                <span className="text-xs font-medium" style={{ color: "#424656" }}>Tingkat Respons</span>
              </div>
              <p className="text-2xl font-bold" style={{ fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>240</p>
              <p className="text-[10px] mt-1" style={{ color: "#737687" }}>ms average</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "#f3f3f3" }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-lg" style={{ color: "#006e2b" }}>timer</span>
                <span className="text-xs font-medium" style={{ color: "#424656" }}>Latensi</span>
              </div>
              <p className="text-2xl font-bold" style={{ fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>0.338</p>
              <p className="text-[10px] mt-1" style={{ color: "#737687" }}>seconds / 400</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Absensi Terbaru</h3>
            <a href="/attendance-logs" className="text-xs font-medium hover:underline" style={{ color: "#004ccd" }}>Lihat Semua</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(195,198,216,0.2)" }}>
                  <th className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>PIN</th>
                  <th className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>Nama</th>
                  <th className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>Tanggal</th>
                  <th className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>Waktu</th>
                  <th className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAttlogs.length > 0 ? (
                  recentAttlogs.map((log, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(195,198,216,0.1)", background: i % 2 === 0 ? "transparent" : "rgba(243,243,243,0.3)" }}>
                      <td className="py-3 px-3 font-medium" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>{log.pin}</td>
                      <td className="py-3 px-3" style={{ color: "#1a1c1c" }}>{log.name}</td>
                      <td className="py-3 px-3" style={{ color: "#737687" }}>{log.date}</td>
                      <td className="py-3 px-3" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{log.time}</td>
                      <td className="py-3 px-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            background: log.status === "MASUK" ? "#defbe6" : "#dbe1ff",
                            color: log.status === "MASUK" ? "#006e2b" : "#004ccd",
                          }}
                        >
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="py-6 text-center" style={{ color: "#737687" }}>Belum ada data absensi</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Console Payload */}
        <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Payload Terbaru</h3>
            {latestPayload && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ background: "#defbe6", color: "#006e2b" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#006e2b" }} />
                API Online
              </span>
            )}
          </div>
          {latestPayload ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style={{ background: "#dbe1ff", color: "#004ccd" }}>{latestPayload.command}</span>
                <span className="text-xs" style={{ color: "#737687" }}>{formatTimeAgo(latestPayload.createdAt, now)}</span>
              </div>
              <div className="rounded-xl p-4 overflow-auto max-h-48" style={{ background: "#1a1c1c", fontFamily: "JetBrains Mono" }}>
                <pre className="text-xs text-[#a6e3a1] whitespace-pre-wrap">{JSON.stringify(latestPayload.payload, null, 2)}</pre>
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "#737687" }}>Belum ada data</p>
          )}
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
