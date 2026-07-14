"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDateTime } from "@/lib/utils";

interface WebhookLog {
  id: string;
  event_type: string;
  payload: Record<string, unknown> | null;
  status: string;
  response: unknown;
  created_at: string;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  SUCCESS: { bg: "#defbe6", color: "#006e2b" },
  ERROR: { bg: "#fff1f1", color: "#da1e28" },
  PENDING: { bg: "#fff8e1", color: "#b28600" },
};

const STATUS_LABELS: Record<string, string> = {
  SUCCESS: "Berhasil",
  ERROR: "Gagal",
  PENDING: "Menunggu",
};

export default function WebhookHistoryPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [detailModal, setDetailModal] = useState<{ open: boolean; log: WebhookLog | null }>({ open: false, log: null });

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: "15" });
    if (eventFilter) params.set("search", eventFilter);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/webhook-logs?${params.toString()}`);
    const data = await res.json();
    setLogs(data.data || []);
    setTotal(data.count || 0);
    setLastPage(data.lastPage || 1);
    setLoading(false);
  }, [page, eventFilter, statusFilter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const handleReset = () => {
    setEventFilter("");
    setStatusFilter("");
    setPage(1);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Riwayat Webhook</h1>
        <p className="text-xs sm:text-sm mt-1" style={{ color: "#737687" }}>Riwayat event webhook dari device fingerprint</p>
      </div>

      <div className="rounded-2xl p-3 sm:p-4" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-end gap-2 sm:gap-3">
          <div className="flex-1 min-w-0 sm:min-w-[180px]">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#737687" }}>Event</label>
            <input
              type="text"
              placeholder="Cari event..."
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setPage(1)}
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }}
            />
          </div>
          <div className="min-w-0 sm:min-w-[150px]">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#737687" }}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }}
            >
              <option value="">Semua Status</option>
              <option value="SUCCESS">Berhasil</option>
              <option value="ERROR">Gagal</option>
              <option value="PENDING">Menunggu</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPage(1)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90" style={{ background: "#004ccd" }}>Filter</button>
            <button onClick={handleReset} className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors" style={{ border: "1px solid rgba(195,198,216,0.3)", color: "#424656" }}>Reset</button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: "550px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(195,198,216,0.2)" }}>
                {["Event", "Waktu", "Status", "Detail"].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8" style={{ color: "#737687" }}><span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>Memuat...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8" style={{ color: "#737687" }}>Tidak ada data</td></tr>
              ) : (
                logs.map((log, i) => {
                  const st = STATUS_COLORS[log.status] || STATUS_COLORS.PENDING;
                  return (
                    <tr key={log.id} style={{ borderBottom: "1px solid rgba(195,198,216,0.1)", background: i % 2 === 0 ? "transparent" : "rgba(243,243,243,0.3)" }}>
                      <td className="py-3 px-3 font-medium whitespace-nowrap" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>{log.event_type}</td>
                      <td className="py-3 px-3 whitespace-nowrap" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{formatDateTime(log.created_at)}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style={{ background: st.bg, color: st.color }}>
                          {STATUS_LABELS[log.status]}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button onClick={() => setDetailModal({ open: true, log })} className="w-8 h-8 inline-flex items-center justify-center rounded-lg transition-colors hover:bg-[#dbe1ff]" title="Lihat Detail">
                          <span className="material-symbols-outlined text-[18px]" style={{ color: "#004ccd" }}>visibility</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 gap-2" style={{ borderTop: "1px solid rgba(195,198,216,0.2)" }}>
          <span className="text-xs sm:text-sm whitespace-nowrap" style={{ color: "#737687" }}>{Math.min((page - 1) * 15 + 1, total)}-{Math.min(page * 15, total)} dari {total.toLocaleString()}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40 hover:bg-[#f3f3f3]">&laquo;</button>
            {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page + i - 2;
              if (p < 1 || p > lastPage) return null;
              return <button key={p} onClick={() => setPage(p)} className="w-8 h-8 rounded-lg text-sm transition-colors" style={p === page ? { background: "#004ccd", color: "#ffffff" } : { color: "#424656" }}>{p}</button>;
            })}
            <button onClick={() => setPage(Math.min(lastPage, page + 1))} disabled={page === lastPage} className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40 hover:bg-[#f3f3f3]">&raquo;</button>
          </div>
        </div>
      </div>

      {detailModal.open && detailModal.log && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} onClick={() => setDetailModal({ open: false, log: null })}>
          <div className="w-full max-w-lg rounded-2xl p-5 sm:p-6" style={{ background: "#ffffff", border: "1px solid rgba(195,198,216,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Detail Webhook Log</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-4 py-2" style={{ borderBottom: "1px solid rgba(195,198,216,0.2)" }}>
                <span className="text-sm" style={{ color: "#737687" }}>Event</span>
                <span className="text-sm font-medium text-right" style={{ fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>{detailModal.log.event_type}</span>
              </div>
              <div className="flex justify-between items-start gap-4 py-2" style={{ borderBottom: "1px solid rgba(195,198,216,0.2)" }}>
                <span className="text-sm" style={{ color: "#737687" }}>Waktu</span>
                <span className="text-sm font-medium text-right" style={{ fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>{formatDateTime(detailModal.log.created_at)}</span>
              </div>
              <div className="flex justify-between items-start gap-4 py-2" style={{ borderBottom: "1px solid rgba(195,198,216,0.2)" }}>
                <span className="text-sm" style={{ color: "#737687" }}>Status</span>
                <span className="text-sm font-medium text-right" style={{ color: "#1a1c1c" }}>{STATUS_LABELS[detailModal.log.status]}</span>
              </div>
            </div>
            {detailModal.log.payload != null && (
              <div className="mt-4">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#737687" }}>Payload</label>
                <pre className="p-3 rounded-xl text-xs overflow-x-auto" style={{ background: "#f3f3f3", fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>{JSON.stringify(detailModal.log.payload, null, 2)}</pre>
              </div>
            )}
            {detailModal.log.response != null && (
              <div className="mt-3">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#737687" }}>Response</label>
                <pre className="p-3 rounded-xl text-xs overflow-x-auto" style={{ background: "#f3f3f3", fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>{String(JSON.stringify(detailModal.log.response, null, 2))}</pre>
              </div>
            )}
            <button onClick={() => setDetailModal({ open: false, log: null })} className="w-full mt-4 py-2.5 text-sm rounded-xl transition-colors" style={{ color: "#424656", background: "#f3f3f3" }}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
