"use client";

import { useEffect, useState, useCallback } from "react";

interface CommandLog {
  id: string;
  command_type: string;
  cloud_id: string;
  trans_id: string;
  endpoint: string;
  request_payload: Record<string, unknown>;
  response_payload: Record<string, unknown>;
  webhook_payload?: Record<string, unknown>;
  status: string;
  http_status_code: number | null;
  error_message: string | null;
  created_at: string;
}

const STATUS_MAP: Record<string, { bg: string; color: string; label: string }> = {
  success: { bg: "#defbe6", color: "#006e2b", label: "Berhasil" },
  failed: { bg: "#fff1f1", color: "#da1e28", label: "Gagal" },
  pending: { bg: "#fff8e1", color: "#b28600", label: "Pending" },
  updated: { bg: "#defbe6", color: "#006e2b", label: "Updated" },
};

const COMMAND_ICONS: Record<string, string> = {
  get_attlog: "history",
  get_userinfo: "person_search",
  get_all_pin: "pin",
  set_userinfo: "person_add",
  delete_userinfo: "person_remove",
  set_time: "schedule",
  register_online: "wifi",
  restart_device: "restart_alt",
  get_device: "devices",
};

export default function ApiHistoryPage() {
  const [logs, setLogs] = useState<CommandLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [commandFilter, setCommandFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState<{ open: boolean; log: CommandLog | null }>({ open: false, log: null });
  const [cloudIdFromSettings, setCloudIdFromSettings] = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: "20" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (commandFilter) params.set("command_type", commandFilter);
    if (cloudIdFromSettings) params.set("cloud_id", cloudIdFromSettings);
    const res = await fetch(`/api/api-history?${params.toString()}`);
    const data = await res.json();
    setLogs(data.data || []);
    setTotal(data.total || 0);
    setLastPage(data.lastPage || 1);
    setLoading(false);
  }, [page, search, statusFilter, commandFilter, cloudIdFromSettings]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data?.cloud_id) setCloudIdFromSettings(data.cloud_id);
    } catch { /* ignore */ }
  }

  function handleFilter() {
    setPage(1);
  }

  function handleReset() {
    setSearch("");
    setStatusFilter("");
    setCommandFilter("");
    setPage(1);
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  const startEntry = total === 0 ? 0 : (page - 1) * 20 + 1;
  const endEntry = Math.min(page * 20, total);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>API History</h1>
        <p className="text-xs mt-0.5" style={{ color: "#737687" }}>Riwayat request & response HTTP ke Fingerspot API</p>
      </div>

      {/* Filter */}
      <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>Cari</label>
            <input type="text" placeholder="Command, Cloud ID, Trans ID..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleFilter()}
              className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", fontFamily: "JetBrains Mono", color: "#1a1c1c" }} />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>Command</label>
            <select value={commandFilter} onChange={(e) => { setCommandFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }}>
              <option value="">Semua</option>
              <option value="get_attlog">Get Attlog</option>
              <option value="get_userinfo">Get Userinfo</option>
              <option value="get_all_pin">Get All PIN</option>
              <option value="set_userinfo">Set Userinfo</option>
              <option value="delete_userinfo">Delete Userinfo</option>
              <option value="set_time">Set Time</option>
              <option value="register_online">Register Online</option>
              <option value="restart_device">Restart Device</option>
              <option value="get_device">Get Device</option>
            </select>
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>Status</label>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }}>
              <option value="">Semua</option>
              <option value="success">Berhasil</option>
              <option value="failed">Gagal</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleFilter} className="px-4 py-2 rounded-lg text-xs font-medium text-white" style={{ background: "#004ccd" }}>Filter</button>
            <button onClick={handleReset} className="px-4 py-2 rounded-lg text-xs font-medium" style={{ border: "1px solid rgba(195,198,216,0.3)", color: "#424656" }}>Reset</button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
          <span className="material-symbols-outlined animate-spin text-2xl" style={{ color: "#004ccd" }}>progress_activity</span>
          <p className="text-xs mt-2" style={{ color: "#737687" }}>Memuat data...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
          <span className="material-symbols-outlined text-3xl" style={{ color: "#c3c6d8" }}>inbox</span>
          <p className="text-xs mt-2" style={{ color: "#737687" }}>Tidak ada data</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(195,198,216,0.2)" }}>
                    {["Waktu", "Command", "Cloud ID", "Trans ID", "Status", "Response"].map((h) => (
                      <th key={h} className="text-left py-2.5 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => {
                    const st = log.webhook_payload ? STATUS_MAP.updated : STATUS_MAP[log.status] || STATUS_MAP.pending;
                    return (
                      <tr key={log.id} className="cursor-pointer" onClick={() => setDetailModal({ open: true, log })}
                        style={{ borderBottom: "1px solid rgba(195,198,216,0.1)", background: i % 2 === 0 ? "transparent" : "rgba(243,243,243,0.3)" }}>
                        <td className="py-2.5 px-3 whitespace-nowrap" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{formatTime(log.created_at)}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]" style={{ color: "#004ccd" }}>{COMMAND_ICONS[log.command_type] || "terminal"}</span>
                            <span className="font-medium" style={{ color: "#1a1c1c" }}>{log.command_type}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-medium" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>{log.cloud_id}</td>
                        <td className="py-2.5 px-3" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{log.trans_id || "-"}</td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                        </td>
                        <td className="py-2.5 px-3 max-w-[200px] truncate" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>
                          {log.webhook_payload ? "✓ updated via webhook" : log.response_payload?.success ? "✓ success" : log.response_payload?.error ? "✗ error" : JSON.stringify(log.response_payload || {}).substring(0, 40)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {logs.map((log) => {
              const st = log.webhook_payload ? STATUS_MAP.updated : STATUS_MAP[log.status] || STATUS_MAP.pending;
              return (
                <div key={log.id} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}
                  onClick={() => setDetailModal({ open: true, log })}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]" style={{ color: "#004ccd" }}>{COMMAND_ICONS[log.command_type] || "terminal"}</span>
                      <span className="font-medium text-xs" style={{ color: "#1a1c1c" }}>{log.command_type}</span>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]" style={{ color: "#737687" }}>
                    <span style={{ fontFamily: "JetBrains Mono" }}>{log.cloud_id}</span>
                    <span>{formatTime(log.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
            <span className="text-[10px]" style={{ color: "#737687" }}>{startEntry}-{endEntry} dari {total}</span>
            <div className="flex items-center gap-0.5">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="w-7 h-7 rounded-lg text-xs disabled:opacity-40">&laquo;</button>
              {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page + i - 2;
                if (p < 1 || p > lastPage) return null;
                return <button key={p} onClick={() => setPage(p)} className="w-7 h-7 rounded-lg text-[11px] font-medium" style={p === page ? { background: "#004ccd", color: "#fff" } : { color: "#424656" }}>{p}</button>;
              })}
              <button onClick={() => setPage(Math.min(lastPage, page + 1))} disabled={page === lastPage} className="w-7 h-7 rounded-lg text-xs disabled:opacity-40">&raquo;</button>
            </div>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {detailModal.open && detailModal.log && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} onClick={() => setDetailModal({ open: false, log: null })}>
          <div className="w-full max-w-lg rounded-xl p-4 max-h-[80vh] overflow-y-auto" style={{ background: "#ffffff", border: "1px solid rgba(195,198,216,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Detail API Request</h3>
              <span className="material-symbols-outlined text-[14px] cursor-pointer" style={{ color: "#737687" }} onClick={() => setDetailModal({ open: false, log: null })}>close</span>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg p-2" style={{ background: "#f3f3f3" }}>
                  <span className="block text-[10px]" style={{ color: "#737687" }}>Command</span>
                  <span className="font-medium" style={{ color: "#1a1c1c", fontFamily: "JetBrains Mono" }}>{detailModal.log.command_type}</span>
                </div>
                <div className="rounded-lg p-2" style={{ background: "#f3f3f3" }}>
                  <span className="block text-[10px]" style={{ color: "#737687" }}>Status</span>
                  <span className="font-medium" style={{ color: (detailModal.log.webhook_payload ? STATUS_MAP.updated : STATUS_MAP[detailModal.log.status])?.color || "#737687" }}>{(detailModal.log.webhook_payload ? STATUS_MAP.updated : STATUS_MAP[detailModal.log.status])?.label || detailModal.log.status}</span>
                </div>
                <div className="rounded-lg p-2" style={{ background: "#f3f3f3" }}>
                  <span className="block text-[10px]" style={{ color: "#737687" }}>Cloud ID</span>
                  <span className="font-medium" style={{ color: "#004ccd", fontFamily: "JetBrains Mono" }}>{detailModal.log.cloud_id}</span>
                </div>
                <div className="rounded-lg p-2" style={{ background: "#f3f3f3" }}>
                  <span className="block text-[10px]" style={{ color: "#737687" }}>Trans ID</span>
                  <span className="font-medium" style={{ color: "#1a1c1c", fontFamily: "JetBrains Mono" }}>{detailModal.log.trans_id || "-"}</span>
                </div>
                <div className="rounded-lg p-2 col-span-2" style={{ background: "#f3f3f3" }}>
                  <span className="block text-[10px]" style={{ color: "#737687" }}>Endpoint</span>
                  <span className="font-medium" style={{ color: "#1a1c1c", fontFamily: "JetBrains Mono" }}>POST /api/{detailModal.log.endpoint}</span>
                </div>
                <div className="rounded-lg p-2 col-span-2" style={{ background: "#f3f3f3" }}>
                  <span className="block text-[10px]" style={{ color: "#737687" }}>Waktu</span>
                  <span className="font-medium" style={{ color: "#1a1c1c" }}>{formatTime(detailModal.log.created_at)}</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>Request Body</label>
                <pre className="rounded-lg p-3 text-[10px] overflow-x-auto" style={{ background: "#1a1c1c", color: "#93f59e", fontFamily: "JetBrains Mono", maxHeight: "150px" }}>
                  {JSON.stringify(detailModal.log.request_payload, null, 2)}
                </pre>
              </div>
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>Response Body</label>
                <pre className="rounded-lg p-3 text-[10px] overflow-x-auto" style={{ background: "#1a1c1c", color: detailModal.log.status === "success" ? "#93f59e" : "#ff6b6b", fontFamily: "JetBrains Mono", maxHeight: "200px" }}>
                  {JSON.stringify(detailModal.log.response_payload, null, 2)}
                </pre>
              </div>
              {detailModal.log.webhook_payload && (
                <div>
                  <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>Webhook Response (dari Device)</label>
                  <pre className="rounded-lg p-3 text-[10px] overflow-x-auto" style={{ background: "#1a1c1c", color: "#93f59e", fontFamily: "JetBrains Mono", maxHeight: "200px" }}>
                    {JSON.stringify(detailModal.log.webhook_payload, null, 2)}
                  </pre>
                </div>
              )}
              {detailModal.log.error_message && (
                <div className="rounded-lg p-2 text-xs" style={{ background: "#fff1f1", color: "#da1e28" }}>
                  Error: {detailModal.log.error_message}
                </div>
              )}
            </div>
            <button onClick={() => setDetailModal({ open: false, log: null })} className="w-full mt-3 py-2 text-xs rounded-lg" style={{ color: "#424656", background: "#f3f3f3" }}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
