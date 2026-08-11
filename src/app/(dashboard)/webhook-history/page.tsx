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

const TYPE_COLORS: Record<string, string> = {
  realtime_attlog: "#006e2b",
  attlog: "#006e2b",
  get_userinfo: "#004ccd",
  get_userid_list: "#004ccd",
  get_all_pin: "#004ccd",
  set_userinfo: "#b28600",
  delete_userinfo: "#da1e28",
  set_time: "#737687",
  register_online: "#006e2b",
};

export default function WebhookHistoryPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

  useEffect(() => { loadLogs(); }, [loadLogs]);
  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data?.cloud_id) setCloudIdFromSettings(data.cloud_id);
    } catch { /* ignore */ }
  }

  function handleFilter() { setPage(1); }
  function handleReset() { setSearch(""); setTypeFilter(""); setPage(1); }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  const startEntry = total === 0 ? 0 : (page - 1) * 20 + 1;
  const endEntry = Math.min(page * 20, total);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Webhook History</h1>
        <p className="text-xs mt-0.5" style={{ color: "#737687" }}>Data webhook yang diterima dari device Fingerspot</p>
      </div>

      {/* Filter */}
      <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>Cari</label>
            <input type="text" placeholder="Cloud ID, Trans ID, PIN..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleFilter()}
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
        <div className="space-y-2">
          {logs.map((log) => {
            const isExpanded = expandedId === log.id;
            const typeColor = TYPE_COLORS[log.webhook_type] || "#737687";
            const payload = log.raw_payload || {};
            const dataObj = payload.data && typeof payload.data === "object" ? payload.data as Record<string, unknown> : null;
            const pin = dataObj?.pin || dataObj?.PIN || "-";
            const scanTime = dataObj?.scan || dataObj?.scan_date || dataObj?.scan_time || null;

            return (
              <div key={log.id} className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
                {/* Summary Row */}
                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-black/[0.02] transition-colors" onClick={() => setExpandedId(isExpanded ? null : log.id)}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: typeColor }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold" style={{ fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>{log.webhook_type}</span>
                      {log.trans_id && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#dbe1ff", color: "#004ccd", fontFamily: "JetBrains Mono" }}>trans_id: {log.trans_id}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px]" style={{ color: "#737687", fontFamily: "JetBrains Mono" }}>
                      <span>{log.cloud_id}</span>
                      {scanTime && <span>{String(scanTime)}</span>}
                      {dataObj?.pin && <span>PIN: {String(dataObj.pin)}</span>}
                      {dataObj?.verify && <span>verify: {String(dataObj.verify)}</span>}
                    </div>
                  </div>
                  <span className="text-[10px] flex-shrink-0" style={{ color: "#737687" }}>{formatTime(log.received_at)}</span>
                  <span className="material-symbols-outlined text-[16px] transition-transform" style={{ color: "#737687", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>expand_more</span>
                </div>

                {/* Expanded Full Payload */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid rgba(195,198,216,0.2)" }}>
                    <div className="px-4 py-2 flex items-center justify-between" style={{ background: "#f3f3f3" }}>
                      <span className="text-[10px] font-medium" style={{ color: "#737687" }}>RAW PAYLOAD</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(log.raw_payload, null, 2));
                          const el = document.getElementById(`copy-${log.id}`);
                          if (el) { el.textContent = "Copied!"; setTimeout(() => el.textContent = "Copy", 1500); }
                        }}
                        className="text-[10px] px-2 py-0.5 rounded flex items-center gap-1"
                        style={{ background: "#dbe1ff", color: "#004ccd" }}
                      >
                        <span className="material-symbols-outlined text-[12px]">content_copy</span>
                        <span id={`copy-${log.id}`}>Copy</span>
                      </button>
                    </div>
                    <pre className="px-4 py-3 text-[11px] overflow-x-auto" style={{ background: "#1a1c1c", color: "#93f59e", fontFamily: "JetBrains Mono", maxHeight: "400px", margin: 0 }}>
                      {JSON.stringify(log.raw_payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {logs.length > 0 && (
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
      )}
    </div>
  );
}
