"use client";

import { useEffect, useState, useCallback } from "react";

interface WebhookLog {
  id: string;
  webhook_type: string;
  cloud_id: string;
  trans_id: string | null;
  raw_payload: Record<string, unknown>;
  status: string;
  related_command_id: string | null;
  received_at: string;
}

const TYPE_MAP: Record<string, { icon: string; label: string; color: string }> = {
  realtime_attlog: { icon: "fingerprint", label: "Realtime Attlog", color: "#006e2b" },
  attlog: { icon: "fingerprint", label: "Attlog", color: "#006e2b" },
  get_userinfo: { icon: "person_search", label: "Get Userinfo", color: "#004ccd" },
  get_userid_list: { icon: "pin", label: "Get User ID List", color: "#004ccd" },
  get_all_pin: { icon: "pin", label: "Get All PIN", color: "#004ccd" },
  set_userinfo: { icon: "person_add", label: "Set Userinfo", color: "#b28600" },
  delete_userinfo: { icon: "person_remove", label: "Delete Userinfo", color: "#da1e28" },
  set_time: { icon: "schedule", label: "Set Time", color: "#737687" },
  register_online: { icon: "wifi", label: "Register Online", color: "#006e2b" },
};

export default function WebhookHistoryPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState<{ open: boolean; log: WebhookLog | null }>({ open: false, log: null });
  const [cloudIdFromSettings, setCloudIdFromSettings] = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: "20" });
    if (search) params.set("search", search);
    if (typeFilter) params.set("webhook_type", typeFilter);
    if (cloudIdFromSettings) params.set("cloud_id", cloudIdFromSettings);
    const res = await fetch(`/api/webhook-history?${params.toString()}`);
    const data = await res.json();
    setLogs(data.data || []);
    setTotal(data.total || 0);
    setLastPage(data.lastPage || 1);
    setLoading(false);
  }, [page, search, typeFilter, cloudIdFromSettings]);

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
    setTypeFilter("");
    setPage(1);
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function getPayloadSummary(payload: Record<string, unknown>): string {
    if (!payload) return "-";
    if (payload.data && typeof payload.data === "object") {
      const data = payload.data as Record<string, unknown>;
      if (data.pin) return `PIN: ${data.pin}`;
      if (data.total) return `Total: ${data.total}`;
    }
    return JSON.stringify(payload).substring(0, 50);
  }

  const startEntry = total === 0 ? 0 : (page - 1) * 20 + 1;
  const endEntry = Math.min(page * 20, total);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Webhook History</h1>
        <p className="text-xs mt-0.5" style={{ color: "#737687" }}>Data yang diterima dari device Fingerspot via webhook</p>
      </div>

      {/* Filter */}
      <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>Cari</label>
            <input type="text" placeholder="Type, Cloud ID, Trans ID..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleFilter()}
              className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", fontFamily: "JetBrains Mono", color: "#1a1c1c" }} />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>Webhook Type</label>
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }}>
              <option value="">Semua</option>
              <option value="realtime_attlog">Realtime Attlog</option>
              <option value="attlog">Attlog</option>
              <option value="get_userinfo">Get Userinfo</option>
              <option value="get_userid_list">Get User ID List</option>
              <option value="get_all_pin">Get All PIN</option>
              <option value="set_userinfo">Set Userinfo</option>
              <option value="delete_userinfo">Delete Userinfo</option>
              <option value="set_time">Set Time</option>
              <option value="register_online">Register Online</option>
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
                    {["Waktu", "Type", "Cloud ID", "Trans ID", "Payload Summary"].map((h) => (
                      <th key={h} className="text-left py-2.5 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => {
                    const typeInfo = TYPE_MAP[log.webhook_type] || { icon: "webhook", label: log.webhook_type, color: "#737687" };
                    return (
                      <tr key={log.id} className="cursor-pointer" onClick={() => setDetailModal({ open: true, log })}
                        style={{ borderBottom: "1px solid rgba(195,198,216,0.1)", background: i % 2 === 0 ? "transparent" : "rgba(243,243,243,0.3)" }}>
                        <td className="py-2.5 px-3 whitespace-nowrap" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{formatTime(log.received_at)}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]" style={{ color: typeInfo.color }}>{typeInfo.icon}</span>
                            <span className="font-medium" style={{ color: "#1a1c1c" }}>{typeInfo.label}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-medium" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>{log.cloud_id}</td>
                        <td className="py-2.5 px-3" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{log.trans_id || <span style={{ color: "#c3c6d8" }}>-</span>}</td>
                        <td className="py-2.5 px-3 max-w-[250px] truncate" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{getPayloadSummary(log.raw_payload)}</td>
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
              const typeInfo = TYPE_MAP[log.webhook_type] || { icon: "webhook", label: log.webhook_type, color: "#737687" };
              return (
                <div key={log.id} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}
                  onClick={() => setDetailModal({ open: true, log })}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]" style={{ color: typeInfo.color }}>{typeInfo.icon}</span>
                      <span className="font-medium text-xs" style={{ color: "#1a1c1c" }}>{typeInfo.label}</span>
                    </div>
                    <span className="text-[10px]" style={{ color: "#737687" }}>{formatTime(log.received_at)}</span>
                  </div>
                  <div className="text-[10px]" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>
                    {log.cloud_id} {log.trans_id ? `| trans: ${log.trans_id}` : ""}
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
              <h3 className="text-sm font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Detail Webhook</h3>
              <span className="material-symbols-outlined text-[14px] cursor-pointer" style={{ color: "#737687" }} onClick={() => setDetailModal({ open: false, log: null })}>close</span>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg p-2" style={{ background: "#f3f3f3" }}>
                  <span className="block text-[10px]" style={{ color: "#737687" }}>Type</span>
                  <span className="font-medium" style={{ color: "#1a1c1c", fontFamily: "JetBrains Mono" }}>{detailModal.log.webhook_type}</span>
                </div>
                <div className="rounded-lg p-2" style={{ background: "#f3f3f3" }}>
                  <span className="block text-[10px]" style={{ color: "#737687" }}>Status</span>
                  <span className="font-medium" style={{ color: detailModal.log.status === "success" ? "#006e2b" : "#da1e28" }}>{detailModal.log.status}</span>
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
                  <span className="block text-[10px]" style={{ color: "#737687" }}>Waktu Diterima</span>
                  <span className="font-medium" style={{ color: "#1a1c1c" }}>{formatTime(detailModal.log.received_at)}</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>Raw Payload</label>
                <pre className="rounded-lg p-3 text-[10px] overflow-x-auto" style={{ background: "#1a1c1c", color: "#93f59e", fontFamily: "JetBrains Mono", maxHeight: "300px" }}>
                  {JSON.stringify(detailModal.log.raw_payload, null, 2)}
                </pre>
              </div>
            </div>
            <button onClick={() => setDetailModal({ open: false, log: null })} className="w-full mt-3 py-2 text-xs rounded-lg" style={{ color: "#424656", background: "#f3f3f3" }}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
