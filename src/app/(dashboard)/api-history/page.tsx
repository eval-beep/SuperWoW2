"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDateTime } from "@/lib/utils";

interface ApiLog {
  id: string;
  command_type: string;
  cloud_id: string;
  trans_id: string;
  request_payload: Record<string, unknown> | null;
  response_payload: unknown;
  status: string;
  endpoint: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  success: { bg: "#defbe6", color: "#006e2b" },
  pending: { bg: "#fff8e1", color: "#b28600" },
  failed: { bg: "#fff1f1", color: "#da1e28" },
};

const STATUS_LABELS: Record<string, string> = {
  success: "Berhasil",
  pending: "Menunggu",
  failed: "Gagal",
};

export default function ApiHistoryPage() {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [commandFilter, setCommandFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [detailModal, setDetailModal] = useState<{ open: boolean; log: ApiLog | null }>({ open: false, log: null });

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: "15" });
    if (commandFilter) params.set("search", commandFilter);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/api-history?${params.toString()}`);
    const data = await res.json();
    setLogs(data.data || []);
    setTotal(data.total || 0);
    setLastPage(data.lastPage || 1);
    setLoading(false);
  }, [page, commandFilter, statusFilter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const handleReset = () => {
    setCommandFilter("");
    setStatusFilter("");
    setPage(1);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <h1 className="text-lg sm:text-xl font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Riwayat API</h1>
        <p className="text-xs mt-0.5" style={{ color: "#737687" }}>Riwayat pemanggilan API ke device</p>
      </div>

      <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>Command</label>
            <input
              type="text"
              placeholder="Cari command..."
              value={commandFilter}
              onChange={(e) => setCommandFilter(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setPage(1)}
              className="w-full px-3 py-2 rounded-lg text-xs"
              style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-lg text-xs"
              style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }}
            >
              <option value="">Semua</option>
              <option value="success">Berhasil</option>
              <option value="failed">Gagal</option>
              <option value="pending">Menunggu</option>
            </select>
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
                  {["Command", "Cloud ID", "Waktu", "Status"].map((h) => (
                    <th key={h} className="text-left py-2.5 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const st = STATUS_COLORS[log.status] || STATUS_COLORS.pending;
                  return (
                    <tr key={log.id} style={{ borderBottom: "1px solid rgba(195,198,216,0.1)", background: i % 2 === 0 ? "transparent" : "rgba(243,243,243,0.3)" }} className="cursor-pointer" onClick={() => setDetailModal({ open: true, log })}>
                      <td className="py-2.5 px-3 font-medium" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>{log.command_type}</td>
                      <td className="py-2.5 px-3" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{log.cloud_id}</td>
                      <td className="py-2.5 px-3" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{formatDateTime(log.created_at)}</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: st.bg, color: st.color }}>{STATUS_LABELS[log.status]}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {logs.map((log) => {
              const st = STATUS_COLORS[log.status] || STATUS_COLORS.pending;
              return (
                <div key={log.id} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }} onClick={() => setDetailModal({ open: true, log })}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-xs" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>{log.command_type}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: st.bg, color: st.color }}>{STATUS_LABELS[log.status]}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]" style={{ color: "#737687" }}>
                    <span style={{ fontFamily: "JetBrains Mono" }}>{log.cloud_id}</span>
                    <span style={{ fontFamily: "JetBrains Mono" }}>{formatDateTime(log.created_at)}</span>
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
            <h3 className="text-sm font-bold mb-3" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Detail API Log</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-start gap-3 py-1.5 text-xs" style={{ borderBottom: "1px solid rgba(195,198,216,0.15)" }}>
                <span className="shrink-0" style={{ color: "#737687" }}>Command</span>
                <span className="font-medium text-right break-all" style={{ fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>{detailModal.log.command_type}</span>
              </div>
              <div className="flex justify-between items-start gap-3 py-1.5 text-xs" style={{ borderBottom: "1px solid rgba(195,198,216,0.15)" }}>
                <span className="shrink-0" style={{ color: "#737687" }}>Cloud ID</span>
                <span className="font-medium text-right break-all" style={{ fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>{detailModal.log.cloud_id}</span>
              </div>
              <div className="flex justify-between items-start gap-3 py-1.5 text-xs" style={{ borderBottom: "1px solid rgba(195,198,216,0.15)" }}>
                <span className="shrink-0" style={{ color: "#737687" }}>Waktu</span>
                <span className="font-medium text-right" style={{ fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>{formatDateTime(detailModal.log.created_at)}</span>
              </div>
              <div className="flex justify-between items-start gap-3 py-1.5 text-xs" style={{ borderBottom: "1px solid rgba(195,198,216,0.15)" }}>
                <span className="shrink-0" style={{ color: "#737687" }}>Status</span>
                <span className="font-medium" style={{ color: "#1a1c1c" }}>{STATUS_LABELS[detailModal.log.status]}</span>
              </div>
            </div>
            {detailModal.log.request_payload != null && (
              <div className="mt-3">
                <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>Request</label>
                <pre className="p-2 rounded-lg text-[10px] overflow-x-auto max-h-32" style={{ background: "#f3f3f3", fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>{String(JSON.stringify(detailModal.log.request_payload, null, 2))}</pre>
              </div>
            )}
            {detailModal.log.response_payload != null && (
              <div className="mt-2">
                <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>Response</label>
                <pre className="p-2 rounded-lg text-[10px] overflow-x-auto max-h-32" style={{ background: "#f3f3f3", fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>{String(JSON.stringify(detailModal.log.response_payload, null, 2))}</pre>
              </div>
            )}
            <button onClick={() => setDetailModal({ open: false, log: null })} className="w-full mt-3 py-2 text-xs rounded-lg" style={{ color: "#424656", background: "#f3f3f3" }}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
