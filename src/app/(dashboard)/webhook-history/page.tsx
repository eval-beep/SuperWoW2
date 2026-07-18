"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDateTime } from "@/lib/utils";

interface WebhookLog {
  id: string;
  webhook_type: string;
  cloud_id: string;
  payload: Record<string, unknown> | null;
  status_code: number | null;
  created_at: string;
  received_at: string;
}

const STATUS_COLORS: Record<number, { bg: string; color: string }> = {
  200: { bg: "#defbe6", color: "#006e2b" },
  201: { bg: "#defbe6", color: "#006e2b" },
  400: { bg: "#fff8e1", color: "#b28600" },
  500: { bg: "#fff1f1", color: "#da1e28" },
};

function getStatusInfo(code: number | null): { label: string; bg: string; color: string } {
  if (code == null) return { label: "-", bg: "#f3f3f3", color: "#737687" };
  const st = STATUS_COLORS[code];
  if (st) return { label: String(code), ...st };
  if (code >= 200 && code < 300) return { label: String(code), bg: "#defbe6", color: "#006e2b" };
  if (code >= 400 && code < 500) return { label: String(code), bg: "#fff8e1", color: "#b28600" };
  return { label: String(code), bg: "#fff1f1", color: "#da1e28" };
}

export default function WebhookHistoryPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState("");
  const [detailModal, setDetailModal] = useState<{ open: boolean; log: WebhookLog | null }>({ open: false, log: null });

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: "15" });
    if (eventFilter) params.set("search", eventFilter);
    const res = await fetch(`/api/webhook-history?${params.toString()}`);
    const data = await res.json();
    setLogs(data.data || []);
    setTotal(data.total || 0);
    setLastPage(data.lastPage || 1);
    setLoading(false);
  }, [page, eventFilter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const handleReset = () => {
    setEventFilter("");
    setPage(1);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <h1 className="text-lg sm:text-xl font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Riwayat Webhook</h1>
        <p className="text-xs mt-0.5" style={{ color: "#737687" }}>Histori response dari Fingerspot API</p>
      </div>

      <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>Event</label>
            <input
              type="text"
              placeholder="Cari event..."
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setPage(1)}
              className="w-full px-3 py-2 rounded-lg text-xs"
              style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPage(1)} className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-medium text-white" style={{ background: "#004ccd" }}>Filter</button>
            <button onClick={handleReset} className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-medium" style={{ border: "1px solid rgba(195,198,216,0.3)", color: "#424656" }}>Reset</button>
          </div>
        </div>
      </div>

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
          <div className="hidden md:block rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(195,198,216,0.2)" }}>
                  {["Event", "Cloud ID", "Waktu", "Status"].map((h) => (
                    <th key={h} className="text-left py-2.5 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const st = getStatusInfo(log.status_code);
                  return (
                    <tr key={log.id} style={{ borderBottom: "1px solid rgba(195,198,216,0.1)", background: i % 2 === 0 ? "transparent" : "rgba(243,243,243,0.3)" }} className="cursor-pointer" onClick={() => setDetailModal({ open: true, log })}>
                      <td className="py-2.5 px-3 font-medium" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>{log.webhook_type}</td>
                      <td className="py-2.5 px-3" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{log.cloud_id}</td>
                      <td className="py-2.5 px-3" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{formatDateTime(log.received_at || log.created_at)}</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {logs.map((log) => {
              const st = getStatusInfo(log.status_code);
              return (
                <div key={log.id} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }} onClick={() => setDetailModal({ open: true, log })}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-xs" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>{log.webhook_type}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]" style={{ color: "#737687" }}>
                    <span style={{ fontFamily: "JetBrains Mono" }}>{log.cloud_id}</span>
                    <span style={{ fontFamily: "JetBrains Mono" }}>{formatDateTime(log.received_at || log.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
            <span className="text-[10px]" style={{ color: "#737687" }}>{Math.min((page - 1) * 15 + 1, total)}-{Math.min(page * 15, total)} dari {total}</span>
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

      {detailModal.open && detailModal.log && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} onClick={() => setDetailModal({ open: false, log: null })}>
          <div className="w-full max-w-md rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid rgba(195,198,216,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold mb-3" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Detail Webhook</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-start gap-3 py-1.5 text-xs" style={{ borderBottom: "1px solid rgba(195,198,216,0.15)" }}>
                <span className="shrink-0" style={{ color: "#737687" }}>Event</span>
                <span className="font-medium text-right break-all" style={{ fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>{detailModal.log.webhook_type}</span>
              </div>
              <div className="flex justify-between items-start gap-3 py-1.5 text-xs" style={{ borderBottom: "1px solid rgba(195,198,216,0.15)" }}>
                <span className="shrink-0" style={{ color: "#737687" }}>Cloud ID</span>
                <span className="font-medium text-right break-all" style={{ fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>{detailModal.log.cloud_id}</span>
              </div>
              <div className="flex justify-between items-start gap-3 py-1.5 text-xs" style={{ borderBottom: "1px solid rgba(195,198,216,0.15)" }}>
                <span className="shrink-0" style={{ color: "#737687" }}>Waktu</span>
                <span className="font-medium text-right" style={{ fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>{formatDateTime(detailModal.log.received_at || detailModal.log.created_at)}</span>
              </div>
              <div className="flex justify-between items-start gap-3 py-1.5 text-xs" style={{ borderBottom: "1px solid rgba(195,198,216,0.15)" }}>
                <span className="shrink-0" style={{ color: "#737687" }}>Status</span>
                <span className="font-medium" style={{ color: "#1a1c1c" }}>{detailModal.log.status_code || "-"}</span>
              </div>
            </div>
            {detailModal.log.payload != null && (
              <div className="mt-3">
                <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>Payload</label>
                <pre className="p-2 rounded-lg text-[10px] overflow-x-auto max-h-32" style={{ background: "#f3f3f3", fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>{String(JSON.stringify(detailModal.log.payload, null, 2))}</pre>
              </div>
            )}
            <button onClick={() => setDetailModal({ open: false, log: null })} className="w-full mt-3 py-2 text-xs rounded-lg" style={{ color: "#424656", background: "#f3f3f3" }}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
