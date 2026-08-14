"use client";

import { useEffect, useState, useCallback } from "react";
import { useThemeLanguage } from "@/contexts/ThemeLanguageContext";

interface WebhookLog {
  id: string;
  webhook_type: string;
  cloud_id: string;
  trans_id: string | null;
  raw_payload: Record<string, unknown>;
  status: string;
  command_type_match: boolean;
  related_command_id: string | null;
  received_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  realtime_attlog: "fingerprint",
  attlog: "history",
  get_userinfo: "person_search",
  get_userid_list: "pin",
  get_all_pin: "pin",
  set_userinfo: "person_add",
  delete_userinfo: "person_remove",
  set_time: "schedule",
  register_online: "wifi",
};

export default function WebhookHistoryPage() {
  const { theme, t } = useThemeLanguage();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [cloudIdFromSettings, setCloudIdFromSettings] = useState("");
  const [detailModal, setDetailModal] = useState<{ open: boolean; log: WebhookLog | null }>({ open: false, log: null });

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: "20" });
    if (search) params.set("search", search);
    if (typeFilter) params.set("webhook_type", typeFilter);
    if (cloudIdFromSettings) params.set("cloud_id", cloudIdFromSettings);
    const res = await fetch(`/api/webhook-history?${params.toString()}`, { credentials: "include" });
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
      const res = await fetch("/api/settings", { credentials: "include" });
      const data = await res.json();
      if (data?.cloud_id) setCloudIdFromSettings(data.cloud_id);
    } catch { /* ignore */ }
  }

  function handleFilter() { setPage(1); }
  function handleReset() { setSearch(""); setTypeFilter(""); setPage(1); }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function renderJson(payload: unknown, indent: number = 0): React.ReactNode {
    if (payload === null) return <span style={{ color: "#9cdcfe" }}>null</span>;
    if (payload === undefined) return <span style={{ color: "#9cdcfe" }}>undefined</span>;
    if (typeof payload === "boolean") return <span style={{ color: "#569cd6" }}>{String(payload)}</span>;
    if (typeof payload === "number") return <span style={{ color: "#b5cea8" }}>{payload}</span>;
    if (typeof payload === "string") return <span style={{ color: "#ce9178" }}>&quot;{payload}&quot;</span>;

    if (Array.isArray(payload)) {
      if (payload.length === 0) return <span>[</span>;
      const items = payload.map((item, i) => (
        <div key={i} style={{ paddingLeft: (indent + 1) * 16 }}>
          {renderJson(item, indent + 1)}{i < payload.length - 1 ? "," : ""}
        </div>
      ));
      return (
        <>
          <span>[</span>
          {items}
          <div style={{ paddingLeft: indent * 16 }}>]</div>
        </>
      );
    }

    if (typeof payload === "object") {
      const entries = Object.entries(payload as Record<string, unknown>);
      if (entries.length === 0) return <span>{"{}"}</span>;
      const items = entries.map(([key, val], i) => (
        <div key={key} style={{ paddingLeft: (indent + 1) * 16 }}>
          <span style={{ color: "#9cdcfe" }}>&quot;{key}&quot;</span>
          <span>: </span>
          {renderJson(val, indent + 1)}{i < entries.length - 1 ? "," : ""}
        </div>
      ));
      return (
        <>
          <span>{"{"}</span>
          {items}
          <div style={{ paddingLeft: indent * 16 }}>{"}"}</div>
        </>
      );
    }

    return <span>{String(payload)}</span>;
  }

  const startEntry = total === 0 ? 0 : (page - 1) * 20 + 1;
  const endEntry = Math.min(page * 20, total);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold" style={{ fontFamily: "Hanken Grotesk", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{t("webhookHistory")}</h1>
        <p className="text-xs mt-0.5" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("webhookData")}</p>
      </div>

      {/* Filter */}
      <div className="rounded-xl p-3" style={{ background: theme === "dark" ? "rgba(31,31,39,0.7)" : "rgba(255,255,255,0.6)", border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.3)"}` }}>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-medium mb-1" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("search")}</label>
            <input type="text" placeholder="Type, Cloud ID, Trans ID..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleFilter()}
              className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195,198,216,0.3)"}`, background: theme === "dark" ? "#292932" : "#f3f3f3", fontFamily: "JetBrains Mono", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }} />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-medium mb-1" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("type")}</label>
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195,198,216,0.3)"}`, background: theme === "dark" ? "#292932" : "#f3f3f3", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>
              <option value="">{t("allTypes")}</option>
              <option value="realtime_attlog">Realtime Attlog</option>
              <option value="attlog">Attlog</option>
              <option value="get_userinfo">Get Userinfo</option>
              <option value="get_all_pin">Get All PIN</option>
              <option value="set_userinfo">Set Userinfo</option>
              <option value="delete_userinfo">Delete Userinfo</option>
              <option value="set_time">Set Time</option>
              <option value="register_online">Register Online</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleFilter} className="px-4 py-2 rounded-lg text-xs font-medium text-white" style={{ background: "#004ccd" }}>Filter</button>
            <button onClick={handleReset} className="px-4 py-2 rounded-lg text-xs font-medium" style={{ border: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195,198,216,0.3)"}`, color: theme === "dark" ? "#c7c4d7" : "#424656" }}>Reset</button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-xl p-8 text-center" style={{ background: theme === "dark" ? "rgba(31,31,39,0.7)" : "rgba(255,255,255,0.6)", border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.3)"}` }}>
          <span className="material-symbols-outlined animate-spin text-2xl" style={{ color: "#004ccd" }}>progress_activity</span>
          <p className="text-xs mt-2" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("loading")}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: theme === "dark" ? "rgba(31,31,39,0.7)" : "rgba(255,255,255,0.6)", border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.3)"}` }}>
          <span className="material-symbols-outlined text-3xl" style={{ color: "#c3c6d8" }}>inbox</span>
          <p className="text-xs mt-2" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("noData")}</p>
          <p className="text-[10px] mt-1" style={{ color: "#c3c6d8" }}>Pastikan device sudah dikonfigurasi webhook URL di Fingerspot Customer Portal</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-xl overflow-hidden" style={{ background: theme === "dark" ? "rgba(31,31,39,0.7)" : "rgba(255,255,255,0.6)", border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.3)"}` }}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                    <tr style={{ borderBottom: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.2)" : "rgba(195,198,216,0.2)"}` }}>
                    {["Waktu", "Type", "Cloud ID", "Trans ID", "Valid", "Status", "Payload"].map((h) => (
                      <th key={h} className="text-left py-2.5 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ fontFamily: "JetBrains Mono", color: theme === "dark" ? "#908fa0" : "#737687" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => {
                    const hasData = log.raw_payload?.data;
                    return (
                      <tr key={log.id} className="cursor-pointer" onClick={() => setDetailModal({ open: true, log })}
                        style={{ borderBottom: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.1)" : "rgba(195,198,216,0.1)"}`, background: i % 2 === 0 ? "transparent" : theme === "dark" ? "rgba(41,41,50,0.3)" : "rgba(243,243,243,0.3)" }}>
                        <td className="py-2.5 px-3 whitespace-nowrap" style={{ fontFamily: "JetBrains Mono", color: theme === "dark" ? "#908fa0" : "#737687" }}>{formatTime(log.received_at)}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]" style={{ color: "#004ccd" }}>{TYPE_ICONS[log.webhook_type] || "webhook"}</span>
                            <span className="font-medium" style={{ color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{log.webhook_type}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-medium" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>{log.cloud_id}</td>
                        <td className="py-2.5 px-3" style={{ fontFamily: "JetBrains Mono", color: theme === "dark" ? "#908fa0" : "#737687" }}>{log.trans_id || "-"}</td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: log.command_type_match ? "#006e2b" : "#b28600" }}>
                            <span className="material-symbols-outlined text-[12px]">{log.command_type_match ? "check_circle" : "help"}</span>
                            {log.command_type_match ? "Match" : "Unmatched"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                            style={{ background: hasData ? "#defbe6" : "#fff8e1", color: hasData ? "#006e2b" : "#b28600" }}>
                            {hasData ? "Berhasil" : "Diterima"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 max-w-[200px] truncate" style={{ fontFamily: "JetBrains Mono", color: theme === "dark" ? "#908fa0" : "#737687" }}>
                          {hasData ? "✓ data" : JSON.stringify(log.raw_payload || {}).substring(0, 40)}
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
              const hasData = log.raw_payload?.data;
              return (
                <div key={log.id} className="rounded-xl p-3" style={{ background: theme === "dark" ? "rgba(31,31,39,0.7)" : "rgba(255,255,255,0.6)", border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.3)"}` }}
                  onClick={() => setDetailModal({ open: true, log })}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]" style={{ color: "#004ccd" }}>{TYPE_ICONS[log.webhook_type] || "webhook"}</span>
                      <span className="font-medium text-xs" style={{ color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{log.webhook_type}</span>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{ background: hasData ? "#defbe6" : "#fff8e1", color: hasData ? "#006e2b" : "#b28600" }}>
                      {hasData ? "Berhasil" : "Diterima"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>
                    <span style={{ fontFamily: "JetBrains Mono" }}>{log.cloud_id}</span>
                    <span style={{ color: log.command_type_match ? "#006e2b" : "#b28600" }}>{log.command_type_match ? "✓ Match" : "✗ Unmatched"}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: theme === "dark" ? "rgba(31,31,39,0.7)" : "rgba(255,255,255,0.6)", border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.3)"}` }}>
            <span className="text-[10px]" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{startEntry}-{endEntry} dari {total}</span>
            <div className="flex items-center gap-0.5">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="w-7 h-7 rounded-lg text-xs disabled:opacity-40">&laquo;</button>
              {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page + i - 2;
                if (p < 1 || p > lastPage) return null;
                return <button key={p} onClick={() => setPage(p)} className="w-7 h-7 rounded-lg text-[11px] font-medium" style={p === page ? { background: "#004ccd", color: "#fff" } : { color: theme === "dark" ? "#c7c4d7" : "#424656" }}>{p}</button>;
              })}
              <button onClick={() => setPage(Math.min(lastPage, page + 1))} disabled={page === lastPage} className="w-7 h-7 rounded-lg text-xs disabled:opacity-40">&raquo;</button>
            </div>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {detailModal.open && detailModal.log && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} onClick={() => setDetailModal({ open: false, log: null })}>
          <div className="w-full max-w-lg rounded-xl p-4 max-h-[80vh] overflow-y-auto" style={{ background: theme === "dark" ? "#1f1f27" : "#ffffff", border: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195,198,216,0.3)"}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ fontFamily: "Hanken Grotesk", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{t("webhookDetail")}</h3>
              <span className="material-symbols-outlined text-[14px] cursor-pointer" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }} onClick={() => setDetailModal({ open: false, log: null })}>close</span>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg p-2" style={{ background: theme === "dark" ? "#292932" : "#f3f3f3" }}>
                  <span className="block text-[10px]" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("webhookType")}</span>
                  <span className="font-medium" style={{ color: theme === "dark" ? "#e4e1ed" : "#1a1c1c", fontFamily: "JetBrains Mono" }}>{detailModal.log.webhook_type}</span>
                </div>
                <div className="rounded-lg p-2" style={{ background: theme === "dark" ? "#292932" : "#f3f3f3" }}>
                  <span className="block text-[10px]" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("status")}</span>
                  <span className="font-medium" style={{ color: detailModal.log.raw_payload?.data ? "#006e2b" : "#b28600" }}>
                    {detailModal.log.raw_payload?.data ? "Berhasil" : "Diterima (tanpa data)"}
                  </span>
                </div>
                <div className="rounded-lg p-2" style={{ background: theme === "dark" ? "#292932" : "#f3f3f3" }}>
                  <span className="block text-[10px]" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("commandTypeMatch")}</span>
                  <span className="font-medium" style={{ color: detailModal.log.command_type_match ? "#006e2b" : "#b28600" }}>
                    {detailModal.log.command_type_match ? "✓ Match" : "✗ Unmatched"}
                  </span>
                </div>
                <div className="rounded-lg p-2" style={{ background: theme === "dark" ? "#292932" : "#f3f3f3" }}>
                  <span className="block text-[10px]" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("cloudId")}</span>
                  <span className="font-medium" style={{ color: "#004ccd", fontFamily: "JetBrains Mono" }}>{detailModal.log.cloud_id}</span>
                </div>
                <div className="rounded-lg p-2" style={{ background: theme === "dark" ? "#292932" : "#f3f3f3" }}>
                  <span className="block text-[10px]" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("transId")}</span>
                  <span className="font-medium" style={{ color: theme === "dark" ? "#e4e1ed" : "#1a1c1c", fontFamily: "JetBrains Mono" }}>{detailModal.log.trans_id || "-"}</span>
                </div>
                <div className="rounded-lg p-2 col-span-2" style={{ background: theme === "dark" ? "#292932" : "#f3f3f3" }}>
                  <span className="block text-[10px]" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("receivedAt")}</span>
                  <span className="font-medium" style={{ color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{formatTime(detailModal.log.received_at)}</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("rawPayload")}</label>
                <pre className="rounded-lg p-3 text-[10px] overflow-x-auto" style={{ background: theme === "dark" ? "#1a1a22" : "#1a1c1c", color: "#93f59e", fontFamily: "JetBrains Mono", maxHeight: "300px" }}>
                  {renderJson(detailModal.log.raw_payload, 0)}
                </pre>
              </div>
            </div>
            <button onClick={() => setDetailModal({ open: false, log: null })} className="w-full mt-3 py-2 text-xs rounded-lg" style={{ color: theme === "dark" ? "#c7c4d7" : "#424656", background: theme === "dark" ? "#292932" : "#f3f3f3" }}>{t("close")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
