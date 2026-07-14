"use client";

import { useEffect, useState, useCallback } from "react";
import { Pagination } from "@/components/ui/LgComponents";
import { formatDateTime } from "@/lib/utils";

interface Pin {
  id: string;
  cloud_id: string;
  pin: string;
  name: string | null;
  raw_payload: Record<string, unknown> | null;
  retrieved_at: string | null;
}

type TabFilter = "all" | "active" | "inactive";

export default function PinListPage() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const [cloudIdFilter, setCloudIdFilter] = useState("");
  const [allCloudIds, setAllCloudIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; pin: Pin | null }>({ open: false, pin: null });
  const [detailModal, setDetailModal] = useState<{ open: boolean; pin: Pin | null }>({ open: false, pin: null });

  const loadPins = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    if (search) params.set("search", search);
    if (cloudIdFilter) params.set("cloud_id", cloudIdFilter);
    const res = await fetch(`/api/supabase?table=pins&count=true&${params.toString()}`);
    const data = await res.json();
    setPins(data.data || []);
    setTotal(data.count || 0);
    setLastPage(data.lastPage || 1);
    setLoading(false);
  }, [page, perPage, search, cloudIdFilter]);

  useEffect(() => {
    loadPins();
    loadCloudIds();
  }, [loadPins]);

  async function loadCloudIds() {
    const res = await fetch("/api/supabase?table=pins&select=cloud_id&per_page=1000");
    const data = await res.json();
    const raw: { cloud_id: string }[] = data.data || [];
    const ids = [...new Set(raw.map((r) => r.cloud_id))];
    setAllCloudIds(ids.filter(Boolean) as string[]);
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch("/api/pin-list", { method: "GET" });
      setTimeout(() => { loadPins(); setSyncing(false); }, 3000);
    } catch { setSyncing(false); }
  }

  async function handleDelete(mode: "web" | "device") {
    if (!deleteModal.pin) return;
    const { cloud_id, pin } = deleteModal.pin;
    try {
      await fetch("/api/user-info/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cloud_id, pin, mode }) });
      setDeleteModal({ open: false, pin: null });
      loadPins();
    } catch (err) { console.error("Delete error:", err); }
  }

  function handleExport() {
    const headers = ["PIN CODE", "USER ID", "EMPLOYEE NAME", "STATUS"];
    const rows = filteredPins.map((pin) => [pin.pin, pin.cloud_id, pin.name || "", pin.name ? "Active" : "Inactive"]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "pin-list.csv"; a.click(); URL.revokeObjectURL(url);
  }

  const activeCount = pins.filter((p) => p.name).length;
  const inactiveCount = pins.filter((p) => !p.name).length;
  const syncRate = total > 0 ? ((activeCount / total) * 100).toFixed(1) : "0.0";
  const actionRequired = inactiveCount;
  const uniqueCloudDevices = [...new Set(pins.map((p) => p.cloud_id))].filter(Boolean).length;

  const filteredPins = pins.filter((pin) => {
    if (activeTab === "active") return !!pin.name;
    if (activeTab === "inactive") return !pin.name;
    return true;
  });

  const storagePercent = Math.min(98, Math.round((total / 1280) * 100));

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: total },
    { key: "active", label: "Active", count: activeCount },
    { key: "inactive", label: "Inactive", count: inactiveCount },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>PIN Management</h1>
          <p className="text-sm mt-1" style={{ color: "#737687" }}>Monitor and manage biometric device PINs</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 text-white" style={{ background: "#004ccd" }}>
            <span className="material-symbols-outlined text-[18px]">download</span>Export Data
          </button>
          <button onClick={handleSync} disabled={syncing} className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50" style={{ background: "#dbe1ff", color: "#004ccd" }}>
            <span className={`material-symbols-outlined text-[18px] ${syncing ? "animate-spin" : ""}`}>{syncing ? "progress_activity" : "sync"}</span>
            {syncing ? "Syncing..." : "Sync Device"}
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Total PINs", value: total.toLocaleString(), icon: "pin", bg: "#dbe1ff", iconColor: "#004ccd" },
          { label: "Active", value: activeCount.toLocaleString(), icon: "check_circle", bg: "#defbe6", iconColor: "#006e2b" },
          { label: "Sync Rate", value: `${syncRate}%`, icon: "sync", bg: "#dbe1ff", iconColor: "#004ccd" },
          { label: "Action Required", value: actionRequired, icon: "warning", bg: "#fff1f1", iconColor: "#da1e28" },
          { label: "Cloud Devices", value: uniqueCloudDevices, icon: "cloud", bg: "#dbe1ff", iconColor: "#004ccd" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{stat.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>{stat.value}</p>
              </div>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: stat.bg }}>
                <span className="material-symbols-outlined text-lg" style={{ color: stat.iconColor }}>{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Filters */}
      <div className="flex items-center gap-2">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className="px-4 py-2 rounded-full text-sm font-medium transition-all" style={{ background: activeTab === tab.key ? "#004ccd" : "#f3f3f3", color: activeTab === tab.key ? "#ffffff" : "#737687" }}>
            {tab.label}
            <span className="ml-1.5 text-xs" style={{ fontFamily: "JetBrains Mono", opacity: 0.7 }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
        <div className="p-4 flex flex-col sm:flex-row gap-3" style={{ borderBottom: "1px solid rgba(195,198,216,0.2)" }}>
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: "#737687" }}>search</span>
            <input type="text" placeholder="Search PIN, name, or User ID..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }} />
          </div>
          <select value={cloudIdFilter} onChange={(e) => { setCloudIdFilter(e.target.value); setPage(1); }} className="px-4 py-2.5 rounded-xl text-sm" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }}>
            <option value="">All Cloud IDs</option>
            {allCloudIds.map((id) => <option key={id} value={id}>{id}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(195,198,216,0.2)" }}>
                {["PIN CODE", "USER ID", "EMPLOYEE NAME", "DEPARTMENT", "STATUS", "LAST SYNC", "ACTIONS"].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8" style={{ color: "#737687" }}><span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>Loading...</td></tr>
              ) : filteredPins.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8" style={{ color: "#737687" }}>No data found</td></tr>
              ) : (
                filteredPins.map((pin, i) => (
                  <tr key={pin.id} style={{ borderBottom: "1px solid rgba(195,198,216,0.1)", background: i % 2 === 0 ? "transparent" : "rgba(243,243,243,0.3)" }}>
                    <td className="py-3 px-3 font-medium" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>{pin.pin}</td>
                    <td className="py-3 px-3" style={{ color: "#1a1c1c" }}>{pin.cloud_id}</td>
                    <td className="py-3 px-3" style={{ color: pin.name ? "#1a1c1c" : "#c3c6d8", fontStyle: pin.name ? "normal" : "italic" }}>{pin.name || "-"}</td>
                    <td className="py-3 px-3" style={{ color: "#737687" }}>{pin.cloud_id}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ background: pin.name ? "#defbe6" : "#fff1f1", color: pin.name ? "#006e2b" : "#da1e28" }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: pin.name ? "#006e2b" : "#da1e28" }} />
                        {pin.name ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-3" style={{ fontFamily: "JetBrains Mono", color: "#737687", fontSize: "12px" }}>Just now</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDeleteModal({ open: true, pin })} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#dbe1ff]" style={{ color: "#737687" }} title="Edit">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => setDetailModal({ open: true, pin })} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#dbe1ff]" style={{ color: "#737687" }} title="View Details">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ borderTop: "1px solid rgba(195,198,216,0.2)" }}>
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-medium whitespace-nowrap" style={{ color: "#737687" }}>Storage</span>
            <div className="w-32 h-2 rounded-full overflow-hidden" style={{ background: "#f3f3f3" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${storagePercent}%`, background: storagePercent > 90 ? "#da1e28" : storagePercent > 70 ? "#004ccd" : "#006e2b" }} />
            </div>
            <span className="text-xs font-bold" style={{ fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>{storagePercent}%</span>
          </div>
          <Pagination page={page} lastPage={lastPage} total={total} perPage={perPage} onPageChange={(p) => setPage(p)} onPerPageChange={(v) => { setPerPage(v); setPage(1); }} />
        </div>
      </div>

      {/* Delete Modal */}
      {deleteModal.open && deleteModal.pin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} onClick={() => setDeleteModal({ open: false, pin: null })}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "#ffffff", border: "1px solid rgba(195,198,216,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Delete PIN</h3>
            <p className="text-sm mb-4" style={{ color: "#737687" }}>Select deletion method for PIN <strong style={{ color: "#1a1c1c" }}>{deleteModal.pin.pin}</strong></p>
            <div className="space-y-2">
              <button onClick={() => handleDelete("web")} className="w-full py-3 px-4 rounded-xl text-left hover:bg-[#f3f3f3]" style={{ border: "1px solid rgba(195,198,216,0.3)" }}>
                <p className="font-medium text-sm" style={{ color: "#1a1c1c" }}>Delete from Web only</p>
                <p className="text-xs" style={{ color: "#737687" }}>Remove from Supabase database</p>
              </button>
              <button onClick={() => handleDelete("device")} className="w-full py-3 px-4 rounded-xl text-left" style={{ border: "1px solid rgba(218,30,40,0.3)", background: "#fff1f1" }}>
                <p className="font-medium text-sm" style={{ color: "#da1e28" }}>Delete from Web + Device</p>
                <p className="text-xs" style={{ color: "#da1e28", opacity: 0.8 }}>Remove from Supabase and send delete command to device</p>
              </button>
            </div>
            <button onClick={() => setDeleteModal({ open: false, pin: null })} className="w-full mt-3 py-2.5 text-sm" style={{ color: "#737687" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal.open && detailModal.pin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} onClick={() => setDetailModal({ open: false, pin: null })}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "#ffffff", border: "1px solid rgba(195,198,216,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>PIN Details</h3>
            <div className="space-y-3">
              {[
                { label: "PIN Code", value: detailModal.pin.pin, mono: true },
                { label: "User ID", value: detailModal.pin.cloud_id },
                { label: "Employee Name", value: detailModal.pin.name || "-" },
                { label: "Status", value: detailModal.pin.name ? "Active" : "Inactive" },
                { label: "Retrieved", value: detailModal.pin.retrieved_at ? formatDateTime(detailModal.pin.retrieved_at) : "-" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center py-2" style={{ borderBottom: "1px solid rgba(195,198,216,0.2)" }}>
                  <span className="text-sm" style={{ color: "#737687" }}>{row.label}</span>
                  <span className="text-sm font-medium" style={{ fontFamily: row.mono ? "JetBrains Mono" : "Inter", color: "#1a1c1c" }}>{row.value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setDetailModal({ open: false, pin: null })} className="w-full mt-4 py-2.5 text-sm rounded-xl" style={{ background: "#f3f3f3", color: "#424656" }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
