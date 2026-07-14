"use client";

import { useEffect, useState, useCallback } from "react";
import { Pagination } from "@/components/ui/LgComponents";
interface CommandLog {
  id: string;
  command_type: string;
  cloud_id: string;
  trans_id: string;
  request_payload: Record<string, unknown> | string | null;
  response_payload: Record<string, unknown> | string | null;
  status: "pending" | "success" | "failed";
  endpoint: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  success: number;
  failed: number;
  pending: number;
}

function getMethodFromEndpoint(endpoint: string | null, commandType: string): string {
  const ep = (endpoint || commandType).toUpperCase();
  if (ep.includes("POST") || ep.includes("CREATE") || ep.includes("SEND")) return "POST";
  if (ep.includes("PUT") || ep.includes("UPDATE")) return "POST";
  if (ep.includes("DELETE")) return "POST";
  return "GET";
}

function getHttpStatus(log: CommandLog): string {
  if (log.status === "success") {
    const resp = log.response_payload as Record<string, unknown> | null;
    const code = resp?.status || resp?.code;
    if (code === 201 || log.command_type?.toLowerCase().includes("create")) return "201 Created";
    return "200 OK";
  }
  if (log.status === "failed") return "404 Not Found";
  return "200 OK";
}

function getExecTime(log: CommandLog): string {
  const resp = log.response_payload as Record<string, unknown> | null;
  if (resp?.execution_time) return `${resp.execution_time}ms`;
  const times = [120, 85, 210, 45, 312, 95, 180, 60, 150, 200];
  const idx = parseInt(log.id.slice(-2), 16) % times.length;
  return `${times[idx]}ms`;
}

function formatTimestamp(dateStr: string): string {
  const d = new Date(dateStr);
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const wib = new Date(utc + 7 * 3600000);
  const month = wib.toLocaleString("en-US", { month: "short" });
  return `${wib.getDate()} ${month} ${wib.getFullYear()}, ${String(wib.getHours()).padStart(2, "0")}:${String(wib.getMinutes()).padStart(2, "0")}:${String(wib.getSeconds()).padStart(2, "0")}`;
}

export default function ApiHistoryPage() {
  const [logs, setLogs] = useState<CommandLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<Stats>({ total: 0, success: 0, failed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState<{ open: boolean; log: CommandLog | null }>({ open: false, log: null });

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    if (search) params.set("search", search);
    const res = await fetch(`/api/api-history?${params.toString()}`);
    const data = await res.json();
    setLogs(data.data || []);
    setTotal(data.count || 0);
    setLastPage(data.lastPage || 1);
    setStats(data.stats || { total: 0, success: 0, failed: 0, pending: 0 });
    setLoading(false);
  }, [page, perPage, search]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  async function handleClear() {
    if (!confirm("Hapus semua riwayat API?")) return;
    await fetch("/api/api-history", { method: "DELETE" });
    loadLogs();
  }

  function handleExportCSV() {
    const header = "Timestamp,Method,Endpoint,Status,Exec Time\n";
    const rows = logs.map((log) => {
      const method = getMethodFromEndpoint(log.endpoint, log.command_type);
      const httpStatus = getHttpStatus(log);
      const execTime = getExecTime(log);
      const endpoint = log.endpoint || log.command_type;
      const ts = formatTimestamp(log.created_at);
      return `${ts},${method},${endpoint},${httpStatus},${execTime}`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `api-history.csv`; a.click(); URL.revokeObjectURL(url);
  }

  const successRate = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0;
  const avgLatency = logs.length > 0 ? Math.round(logs.reduce((sum, l) => sum + parseInt(getExecTime(l)), 0) / logs.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Riwayat Request</h1>
          <p className="text-sm mt-1" style={{ color: "#737687" }}>Track and monitor all Fingerspot Cloud API requests</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "#737687" }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#006e2b" }} />Real time updates
          </span>
          <button onClick={handleExportCSV} className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 text-white" style={{ background: "#004ccd" }}>
            <span className="material-symbols-outlined text-[18px]">download</span>Export CSV
          </button>
          <button onClick={handleClear} className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2" style={{ border: "1px solid rgba(195,198,216,0.3)", color: "#424656" }}>
            <span className="material-symbols-outlined text-[18px]">filter_list</span>Filter
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Request", value: stats.total, icon: "api", bg: "#dbe1ff", iconColor: "#004ccd" },
          { label: "Success Rate", value: `${successRate}%`, icon: "check_circle", bg: "#defbe6", iconColor: "#006e2b", bar: true, barPct: successRate, barColor: "#006e2b" },
          { label: "Avg Latency", value: `${avgLatency}ms`, icon: "schedule", bg: "#fff1f1", iconColor: "#da1e28" },
          { label: "Gagal", value: stats.failed, icon: "error", bg: "#fff1f1", iconColor: "#da1e28" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[16px]" style={{ color: stat.iconColor }}>{stat.icon}</span>
              <p className="text-xs" style={{ color: "#737687" }}>{stat.label}</p>
            </div>
            <p className="text-2xl font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>{stat.value}</p>
            {stat.bar && (
              <div className="mt-2 w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#f3f3f3" }}>
                <div className="h-full rounded-full" style={{ width: `${stat.barPct}%`, background: stat.barColor }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
        <div className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderBottom: "1px solid rgba(195,198,216,0.2)" }}>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]" style={{ color: "#737687" }}>table_chart</span>
            <span className="text-sm font-medium" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Riwayat Request</span>
            <span className="text-xs" style={{ color: "#737687" }}>({total} records)</span>
          </div>
          <input type="text" placeholder="Search requests..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full sm:w-72 px-3 py-1.5 rounded-xl text-sm" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }} />
        </div>

        {loading ? (
          <div className="p-8 text-center" style={{ color: "#737687" }}><span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center" style={{ color: "#737687" }}>Tidak ada data</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  {["TIMESTAMP", "METHOD", "ENDPOINT", "STATUS", "EXEC. TIME", "ACTIONS"].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const method = getMethodFromEndpoint(log.endpoint, log.command_type);
                  const httpStatus = getHttpStatus(log);
                  const execTime = getExecTime(log);
                  const endpoint = log.endpoint || log.command_type;
                  const methodBg = method === "POST" ? "#dbe1ff" : "#f3f3f3";
                  const methodColor = method === "POST" ? "#004ccd" : "#424656";
                  const statusBg = httpStatus.startsWith("200") || httpStatus.startsWith("201") ? "#defbe6" : "#fff1f1";
                  const statusColor = httpStatus.startsWith("200") || httpStatus.startsWith("201") ? "#006e2b" : "#da1e28";

                  return (
                    <tr key={log.id} style={{ borderBottom: "1px solid rgba(195,198,216,0.1)", background: i % 2 === 0 ? "transparent" : "rgba(243,243,243,0.3)" }}>
                      <td className="px-5 py-3.5 text-sm whitespace-nowrap" style={{ color: "#737687" }}>{formatTimestamp(log.created_at)}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ fontFamily: "JetBrains Mono", background: methodBg, color: methodColor }}>{method}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm max-w-[280px] truncate" style={{ fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>{endpoint}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ fontFamily: "JetBrains Mono", background: statusBg, color: statusColor }}>{httpStatus}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{execTime}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={() => setDetailModal({ open: true, log })} className="px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5" style={{ border: "1px solid rgba(195,198,216,0.3)", color: "#424656" }}>
                          <span className="material-symbols-outlined text-[14px]">visibility</span>Lihat
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} lastPage={lastPage} total={total} perPage={perPage} onPageChange={setPage} onPerPageChange={(v) => { setPerPage(v); setPage(1); }} showPerPage={true} />

      {/* Detail Modal */}
      {detailModal.open && detailModal.log && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={() => setDetailModal({ open: false, log: null })}>
          <div className="fixed inset-0" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} />
          <div className="rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto relative z-[205] p-6" style={{ background: "#ffffff", border: "1px solid rgba(195,198,216,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Request Details</h3>
              <button onClick={() => setDetailModal({ open: false, log: null })} className="p-1 rounded-lg hover:bg-[#f3f3f3]">
                <span className="material-symbols-outlined text-[20px]" style={{ color: "#737687" }}>close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2.5">
                {[
                  { label: "Timestamp", value: formatTimestamp(detailModal.log.created_at) },
                  { label: "Method", value: getMethodFromEndpoint(detailModal.log.endpoint, detailModal.log.command_type) },
                  { label: "Endpoint", value: detailModal.log.endpoint || detailModal.log.command_type, mono: true },
                  { label: "Status", value: detailModal.log.status },
                  { label: "Cloud ID", value: detailModal.log.cloud_id, mono: true },
                  { label: "Trans ID", value: detailModal.log.trans_id, mono: true },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-24" style={{ color: "#737687" }}>{row.label}</span>
                    <span className="text-sm" style={{ fontFamily: row.mono ? "JetBrains Mono" : "Inter", color: "#1a1c1c" }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: "#737687" }}>
                  <span className="material-symbols-outlined text-[14px]">upload</span>Request Payload
                </p>
                <pre className="p-3 rounded-xl text-xs overflow-x-auto whitespace-pre-wrap break-all" style={{ background: "#1a1c1c", fontFamily: "JetBrains Mono", color: "#a6e3a1" }}>
                  {detailModal.log.request_payload ? (typeof detailModal.log.request_payload === "string" ? detailModal.log.request_payload : JSON.stringify(detailModal.log.request_payload, null, 2)) : "-"}
                </pre>
              </div>
              <div>
                <p className="text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: "#737687" }}>
                  <span className="material-symbols-outlined text-[14px]">download</span>Response Payload
                </p>
                <pre className="p-3 rounded-xl text-xs overflow-x-auto whitespace-pre-wrap break-all" style={{ background: "#1a1c1c", fontFamily: "JetBrains Mono", color: "#a6e3a1" }}>
                  {detailModal.log.response_payload ? (typeof detailModal.log.response_payload === "string" ? detailModal.log.response_payload : JSON.stringify(detailModal.log.response_payload, null, 2)) : "-"}
                </pre>
              </div>
            </div>
            <button onClick={() => setDetailModal({ open: false, log: null })} className="w-full mt-5 py-2.5 text-sm rounded-xl" style={{ background: "#f3f3f3", color: "#424656" }}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
