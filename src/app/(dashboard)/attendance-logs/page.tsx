"use client";

import { useEffect, useState, useCallback } from "react";
import { LgDatepicker } from "@/components/ui/LgComponents";
import { formatDateTime } from "@/lib/utils";

interface Attlog {
  id: string;
  cloud_id: string;
  pin: string;
  name: string | null;
  scan_time: string;
  status_scan: number;
  verify: number;
  source: string;
  trans_id: string;
  created_at: string;
}

const VERIFY_MAP: Record<number, string> = {
  1: "Finger",
  2: "Password",
  3: "Card",
  4: "Face",
  6: "Vein",
  7: "QR",
};

function getVerifyLabel(v: number | undefined | null): string {
  if (v == null) return "-";
  if (VERIFY_MAP[v]) return VERIFY_MAP[v];
  return `Verify (${v})`;
}

export default function AttendanceLogsPage() {
  const [logs, setLogs] = useState<Attlog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [lastPage, setLastPage] = useState(1);
  const [pinSearch, setPinSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState<{ open: boolean; log: Attlog | null }>({ open: false, log: null });
  const [getAttlogModal, setGetAttlogModal] = useState(false);
  const [allCloudIds, setAllCloudIds] = useState<string[]>([]);
  const [getForm, setGetForm] = useState({ cloud_id: "C2697842930C1634", pin: "", start_date: "", end_date: "" });

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    if (pinSearch) params.set("search", pinSearch);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    const res = await fetch(`/api/attendance-logs?${params.toString()}`);
    const data = await res.json();
    setLogs(data.data || []);
    setTotal(data.count || 0);
    setLastPage(data.lastPage || 1);
    setLoading(false);
  }, [page, perPage, pinSearch, dateFrom, dateTo]);

  useEffect(() => {
    loadLogs();
    loadCloudIds();
  }, [loadLogs]);

  async function loadCloudIds() {
    const res = await fetch("/api/supabase?table=attlogs&select=cloud_id");
    const data = await res.json();
    const raw: { cloud_id: string }[] = data.data || [];
    const ids = [...new Set(raw.map((r) => r.cloud_id))];
    setAllCloudIds(ids.filter(Boolean) as string[]);
  }

  async function handleExport() {
    const params = new URLSearchParams();
    if (pinSearch) params.set("search", pinSearch);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    window.open(`/api/attendance-logs/export?${params.toString()}`, "_blank");
  }

  async function handleGetAttlog() {
    if (!getForm.cloud_id) return alert("Cloud ID harus diisi");
    try {
      const params: Record<string, string> = { trans_id: "1", cloud_id: getForm.cloud_id };
      if (getForm.pin) params.pin = getForm.pin;
      if (getForm.start_date) params.start_date = getForm.start_date;
      if (getForm.end_date) params.end_date = getForm.end_date;
      await fetch("/api/fingerspot/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: "get_attlog", params, logToHistory: true }),
      });
      setGetAttlogModal(false);
    } catch (err) {
      console.error("Get attlog error:", err);
    }
  }

  function handleFilter() {
    setPage(1);
  }

  function handleReset() {
    setPinSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  const startEntry = total === 0 ? 0 : (page - 1) * perPage + 1;
  const endEntry = Math.min(page * perPage, total);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Log Absensi</h1>
          <p className="text-xs mt-0.5" style={{ color: "#737687" }}>Riwayat kehadiran karyawan</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setGetAttlogModal(true)} className="flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 text-white" style={{ background: "#004ccd" }}>
            <span className="material-symbols-outlined text-sm">download</span>Ambil Log
          </button>
          <button onClick={handleExport} className="flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5" style={{ border: "1px solid rgba(195,198,216,0.3)", color: "#424656" }}>
            <span className="material-symbols-outlined text-sm">file_download</span>Export
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>PIN</label>
            <input
              type="text"
              placeholder="Cari PIN..."
              value={pinSearch}
              onChange={(e) => setPinSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFilter()}
              className="w-full px-3 py-2 rounded-lg text-xs"
              style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", fontFamily: "JetBrains Mono", color: "#1a1c1c" }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>Dari</label>
            <LgDatepicker id="dpFrom" value={dateFrom} onChange={setDateFrom} placeholder="Tanggal Mulai" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>Sampai</label>
            <LgDatepicker id="dpTo" value={dateTo} onChange={setDateTo} placeholder="Tanggal Akhir" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleFilter} className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-medium text-white" style={{ background: "#004ccd" }}>Filter</button>
            <button onClick={handleReset} className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-medium" style={{ border: "1px solid rgba(195,198,216,0.3)", color: "#424656" }}>Reset</button>
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
                    {["PIN", "Nama", "Cloud ID", "Waktu", "Verifikasi", "Status"].map((h) => (
                      <th key={h} className="text-left py-2.5 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={log.id} className="cursor-pointer" onClick={() => setDetailModal({ open: true, log })} style={{ borderBottom: "1px solid rgba(195,198,216,0.1)", background: i % 2 === 0 ? "transparent" : "rgba(243,243,243,0.3)" }}>
                      <td className="py-2.5 px-3 font-medium" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>{log.pin}</td>
                      <td className="py-2.5 px-3" style={{ color: "#1a1c1c" }}>{log.name || "-"}</td>
                      <td className="py-2.5 px-3" style={{ color: "#737687", fontFamily: "JetBrains Mono" }}>{log.cloud_id}</td>
                      <td className="py-2.5 px-3" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{formatDateTime(log.scan_time)}</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "#dbe1ff", color: "#004ccd" }}>{getVerifyLabel(log.verify)}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: log.status_scan === 0 ? "#defbe6" : "#fff1f1", color: log.status_scan === 0 ? "#006e2b" : "#da1e28" }}>
                          {log.status_scan === 0 ? "MASUK" : "GAGAL"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }} onClick={() => setDetailModal({ open: true, log })}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>{log.pin}</span>
                    <span className="text-[11px]" style={{ color: "#1a1c1c" }}>{log.name || "-"}</span>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: log.status_scan === 0 ? "#defbe6" : "#fff1f1", color: log.status_scan === 0 ? "#006e2b" : "#da1e28" }}>
                    {log.status_scan === 0 ? "MASUK" : "GAGAL"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px]" style={{ color: "#737687" }}>
                  <span style={{ fontFamily: "JetBrains Mono" }}>{formatDateTime(log.scan_time)}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium" style={{ background: "#dbe1ff", color: "#004ccd" }}>{getVerifyLabel(log.verify)}</span>
                </div>
              </div>
            ))}
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
          <div className="w-full max-w-md rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid rgba(195,198,216,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold mb-3" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Detail Log</h3>
            <div className="space-y-2">
              {[
                ["PIN", detailModal.log.pin],
                ["Nama", detailModal.log.name || "-"],
                ["Cloud ID", detailModal.log.cloud_id],
                ["Waktu", formatDateTime(detailModal.log.scan_time)],
                ["Verifikasi", getVerifyLabel(detailModal.log.verify)],
                ["Status", detailModal.log.status_scan === 0 ? "MASUK" : "GAGAL"],
                ["Sumber", detailModal.log.source || "-"],
                ["Trans ID", detailModal.log.trans_id || "-"],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between items-center gap-3 py-1.5 text-xs" style={{ borderBottom: "1px solid rgba(195,198,216,0.15)" }}>
                  <span style={{ color: "#737687" }}>{label}</span>
                  <span className="font-medium text-right break-all" style={{ color: "#1a1c1c" }}>{value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setDetailModal({ open: false, log: null })} className="w-full mt-3 py-2 text-xs rounded-lg" style={{ color: "#424656", background: "#f3f3f3" }}>Tutup</button>
          </div>
        </div>
      )}

      {/* Get Attlog Modal */}
      {getAttlogModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} onClick={() => setGetAttlogModal(false)}>
          <div className="w-full max-w-md rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid rgba(195,198,216,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold mb-3" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Ambil Log dari Device</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>Cloud ID</label>
                <select value={getForm.cloud_id} onChange={(e) => setGetForm({ ...getForm, cloud_id: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }}>
                  {allCloudIds.map((id) => <option key={id} value={id}>{id}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>PIN (Opsional)</label>
                <input value={getForm.pin} onChange={(e) => setGetForm({ ...getForm, pin: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }} placeholder="Semua PIN" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>Dari</label>
                  <input type="date" value={getForm.start_date} onChange={(e) => setGetForm({ ...getForm, start_date: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>Sampai</label>
                  <input type="date" value={getForm.end_date} onChange={(e) => setGetForm({ ...getForm, end_date: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setGetAttlogModal(false)} className="flex-1 py-2 text-xs rounded-lg" style={{ color: "#737687" }}>Batal</button>
              <button onClick={handleGetAttlog} className="flex-1 py-2 text-xs font-medium text-white rounded-lg" style={{ background: "#004ccd" }}>Kirim</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
