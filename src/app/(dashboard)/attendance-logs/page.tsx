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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Log Absensi</h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: "#737687" }}>Riwayat kehadiran dan aktivitas karyawan</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setGetAttlogModal(true)} className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 text-white" style={{ background: "#004ccd" }}>
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">download</span>
            <span className="hidden xs:inline">Ambil Log dari Device</span>
            <span className="xs:hidden">Ambil Log</span>
          </button>
          <button onClick={handleExport} className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2" style={{ border: "1px solid rgba(195,198,216,0.3)", color: "#424656" }}>
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">file_download</span>
            Export
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="rounded-2xl p-3 sm:p-4" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-end gap-2 sm:gap-3">
          <div className="flex-1 min-w-0 sm:min-w-[180px]">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#737687" }}>PIN</label>
            <input
              type="text"
              placeholder="Cari PIN..."
              value={pinSearch}
              onChange={(e) => setPinSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFilter()}
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", fontFamily: "JetBrains Mono", color: "#1a1c1c" }}
            />
          </div>
          <div className="min-w-0 sm:min-w-[160px]">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#737687" }}>Tanggal Mulai</label>
            <LgDatepicker id="dpFrom" value={dateFrom} onChange={setDateFrom} placeholder="Tanggal Mulai" />
          </div>
          <div className="min-w-0 sm:min-w-[160px]">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#737687" }}>Tanggal Akhir</label>
            <LgDatepicker id="dpTo" value={dateTo} onChange={setDateTo} placeholder="Tanggal Akhir" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleFilter}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: "#004ccd" }}
            >
              Filter
            </button>
            <button
              onClick={handleReset}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ border: "1px solid rgba(195,198,216,0.3)", color: "#424656" }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: "700px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(195,198,216,0.2)" }}>
                {["PIN", "User ID", "Device", "Waktu Scan", "Verifikasi", "Status", "Aksi"].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8" style={{ color: "#737687" }}>
                    <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>Memuat...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8" style={{ color: "#737687" }}>
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                logs.map((log, i) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid rgba(195,198,216,0.1)", background: i % 2 === 0 ? "transparent" : "rgba(243,243,243,0.3)" }}>
                    <td className="py-3 px-3 font-medium whitespace-nowrap" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>{log.pin}</td>
                    <td className="py-3 px-3 whitespace-nowrap" style={{ color: "#1a1c1c" }}>{log.name || "-"}</td>
                    <td className="py-3 px-3 whitespace-nowrap" style={{ color: "#737687" }}>{log.cloud_id}</td>
                    <td className="py-3 px-3 whitespace-nowrap" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{formatDateTime(log.scan_time)}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style={{ background: "#dbe1ff", color: "#004ccd" }}>
                        {getVerifyLabel(log.verify)}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: log.status_scan === 0 ? "#defbe6" : "#fff1f1",
                          color: log.status_scan === 0 ? "#006e2b" : "#da1e28",
                        }}
                      >
                        {log.status_scan === 0 ? "MASUK" : "GAGAL"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setDetailModal({ open: true, log })}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg transition-colors hover:bg-[#dbe1ff]"
                        title="Lihat Detail"
                      >
                        <span className="material-symbols-outlined text-[18px]" style={{ color: "#004ccd" }}>visibility</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 gap-2" style={{ borderTop: "1px solid rgba(195,198,216,0.2)" }}>
          <span className="text-xs sm:text-sm whitespace-nowrap" style={{ color: "#737687" }}>
            {startEntry}-{endEntry} dari {total.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40 hover:bg-[#f3f3f3]"
            >
              &laquo;
            </button>
            {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page + i - 2;
              if (p < 1 || p > lastPage) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-8 h-8 rounded-lg text-sm transition-colors"
                  style={p === page ? { background: "#004ccd", color: "#ffffff" } : { color: "#424656" }}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(lastPage, page + 1))}
              disabled={page === lastPage}
              className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40 hover:bg-[#f3f3f3]"
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {detailModal.open && detailModal.log && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} onClick={() => setDetailModal({ open: false, log: null })}>
          <div className="w-full max-w-lg rounded-2xl p-5 sm:p-6" style={{ background: "#ffffff", border: "1px solid rgba(195,198,216,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Detail Log</h3>
            <div className="space-y-3">
              {[
                ["PIN", detailModal.log.pin],
                ["Nama", detailModal.log.name || "-"],
                ["Cloud ID", detailModal.log.cloud_id],
                ["Waktu Scan", formatDateTime(detailModal.log.scan_time)],
                ["Verifikasi", getVerifyLabel(detailModal.log.verify)],
                ["Status", detailModal.log.status_scan === 0 ? "MASUK" : "GAGAL"],
                ["Sumber", detailModal.log.source || "-"],
                ["Trans ID", detailModal.log.trans_id || "-"],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between items-start gap-4 py-2" style={{ borderBottom: "1px solid rgba(195,198,216,0.2)" }}>
                  <span className="text-sm shrink-0" style={{ color: "#737687" }}>{label}</span>
                  <span className="text-sm font-medium text-right break-all" style={{ color: "#1a1c1c" }}>{value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setDetailModal({ open: false, log: null })}
              className="w-full mt-4 py-2.5 text-sm rounded-xl transition-colors"
              style={{ color: "#424656", background: "#f3f3f3" }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Get Attlog Modal */}
      {getAttlogModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} onClick={() => setGetAttlogModal(false)}>
          <div className="w-full max-w-xl rounded-2xl p-5 sm:p-6" style={{ background: "#ffffff", border: "1px solid rgba(195,198,216,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Ambil Log dari Device</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: "#737687" }}>Cloud ID</label>
                <select
                  value={getForm.cloud_id}
                  onChange={(e) => setGetForm({ ...getForm, cloud_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }}
                >
                  {allCloudIds.map((id) => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#737687" }}>PIN (Opsional)</label>
                <input
                  value={getForm.pin}
                  onChange={(e) => setGetForm({ ...getForm, pin: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }}
                  placeholder="Semua PIN"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#737687" }}>Tanggal Mulai</label>
                <input
                  type="date"
                  value={getForm.start_date}
                  onChange={(e) => setGetForm({ ...getForm, start_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#737687" }}>Tanggal Akhir</label>
                <input
                  type="date"
                  value={getForm.end_date}
                  onChange={(e) => setGetForm({ ...getForm, end_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <a
                href={`/api-tester?command=get_attlog&cloud_id=${getForm.cloud_id}`}
                className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                style={{ border: "1px solid rgba(195,198,216,0.3)", color: "#424656" }}
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>API Tester
              </a>
              <div className="flex-1" />
              <button
                onClick={() => setGetAttlogModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm"
                style={{ color: "#737687" }}
              >
                Batal
              </button>
              <button
                onClick={handleGetAttlog}
                className="px-6 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: "#004ccd" }}
              >
                Kirim ke Device
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
