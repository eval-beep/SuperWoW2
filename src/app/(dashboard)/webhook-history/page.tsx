"use client";

import { useEffect, useState, useCallback } from "react";
import { Pagination } from "@/components/ui/LgComponents";
import { formatDateTime } from "@/lib/utils";

interface WebhookLog {
  id: string;
  cloud_id: string;
  webhook_type: string;
  raw_payload: Record<string, unknown> | string | null;
  status: string;
  related_command_id: string | null;
  received_at: string;
}

interface Stats {
  total: number;
  types: Record<string, number>;
}

export default function WebhookHistoryPage() {
  const [webhooks, setWebhooks] = useState<WebhookLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<Stats>({ total: 0, types: {} });
  const [loading, setLoading] = useState(true);
  const [payloadModal, setPayloadModal] = useState<{ open: boolean; webhook: WebhookLog | null }>({ open: false, webhook: null });
  const [copied, setCopied] = useState(false);

  const loadWebhooks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    if (search) params.set("search", search);
    const res = await fetch(`/api/webhook-history?${params.toString()}`);
    const data = await res.json();
    setWebhooks(data.data || []);
    setTotal(data.count || 0);
    setLastPage(data.lastPage || 1);
    setStats(data.stats || { total: 0, types: {} });
    setLoading(false);
  }, [page, perPage, search]);

  useEffect(() => { loadWebhooks(); }, [loadWebhooks]);

  function parsePayload(payload: unknown): Record<string, unknown> | null {
    if (!payload) return null;
    if (typeof payload === "object") return payload as Record<string, unknown>;
    try { return JSON.parse(payload as string); } catch { return null; }
  }

  function getTypeLabel(type: string): string {
    if (type.includes("attlog")) return "+ Attendance";
    if (type.includes("userinfo")) return "+ UserUpdate";
    return type;
  }

  function getTypeStyle(type: string): { bg: string; color: string } {
    if (type.includes("attlog")) return { bg: "#defbe6", color: "#006e2b" };
    if (type.includes("userinfo")) return { bg: "#dbe1ff", color: "#004ccd" };
    if (type.includes("pin")) return { bg: "#fff1f1", color: "#da1e28" };
    return { bg: "#f3f3f3", color: "#424656" };
  }

  function getStatusStyle(status: string): { bg: string; color: string } {
    if (status === "success") return { bg: "#defbe6", color: "#006e2b" };
    return { bg: "#fff1f1", color: "#da1e28" };
  }

  function handleCopyPayload(payload: Record<string, unknown> | null) {
    if (!payload) return;
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Riwayat Webhook</h1>
          <p className="text-sm mt-1" style={{ color: "#737687" }}>Real-time monitoring and delivery logs for external service integrations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadWebhooks} className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 text-white" style={{ background: "#004ccd" }}>
            <span className="material-symbols-outlined text-[18px]">refresh</span>Refresh Data
          </button>
          <button onClick={() => setSearch("")} className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2" style={{ border: "1px solid rgba(195,198,216,0.3)", color: "#424656" }}>
            <span className="material-symbols-outlined text-[18px]">filter_list</span>Filter
          </button>
        </div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
        <input type="text" placeholder="Cari webhook..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full px-4 py-2.5 rounded-xl text-sm" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }} />
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(195,198,216,0.2)" }}>
                {["ID", "TYPE", "STATUS", "DATE", "ACTION"].map((h) => (
                  <th key={h} className="text-left py-3 px-5 text-[10px] uppercase tracking-wider font-medium" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8" style={{ color: "#737687" }}><span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>Memuat...</td></tr>
              ) : webhooks.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8" style={{ color: "#737687" }}>Tidak ada data</td></tr>
              ) : (
                webhooks.map((wh, i) => {
                  const typeStyle = getTypeStyle(wh.webhook_type);
                  const statusStyle = getStatusStyle(wh.status);
                  return (
                    <tr key={wh.id} style={{ borderBottom: "1px solid rgba(195,198,216,0.1)", background: i % 2 === 0 ? "transparent" : "rgba(243,243,243,0.3)" }}>
                      <td className="py-3 px-5 font-medium" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>RH-{String((page - 1) * perPage + i + 1).padStart(4, "0")}</td>
                      <td className="py-3 px-5">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold" style={{ background: typeStyle.bg, color: typeStyle.color }}>{getTypeLabel(wh.webhook_type)}</span>
                      </td>
                      <td className="py-3 px-5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusStyle.color }} />
                          {wh.status === "success" ? "SUCCESS" : "FAILED"}
                        </span>
                      </td>
                      <td className="py-3 px-5" style={{ color: "#737687" }}>{formatDateTime(wh.received_at)}</td>
                      <td className="py-3 px-5">
                        <button onClick={() => setPayloadModal({ open: true, webhook: wh })} className="text-sm font-medium flex items-center gap-1" style={{ color: "#004ccd" }}>
                          <span className="material-symbols-outlined text-[16px]">visibility</span>View Payload
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} lastPage={lastPage} total={total} perPage={perPage} onPageChange={(p) => setPage(p)} onPerPageChange={(v) => { setPerPage(v); setPage(1); }} showPerPage={true} />
      </div>

      {/* Payload Modal */}
      {payloadModal.open && payloadModal.webhook && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} onClick={() => setPayloadModal({ open: false, webhook: null })}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: "#ffffff", border: "1px solid rgba(195,198,216,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Payload</h3>
              <button onClick={() => setPayloadModal({ open: false, webhook: null })} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ color: "#737687" }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3 mb-4">
              {[
                { label: "ID:", value: `RH-${String(webhooks.indexOf(payloadModal.webhook) + 1).padStart(4, "0")}`, mono: true, color: "#004ccd" },
                { label: "Type:", value: getTypeLabel(payloadModal.webhook.webhook_type), badge: true, badgeStyle: getTypeStyle(payloadModal.webhook.webhook_type) },
                { label: "Status:", value: payloadModal.webhook.status === "success" ? "SUCCESS" : "FAILED", badge: true, badgeStyle: getStatusStyle(payloadModal.webhook.status) },
                { label: "Date:", value: formatDateTime(payloadModal.webhook.received_at) },
                { label: "Cloud ID:", value: payloadModal.webhook.cloud_id, mono: true },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className="text-xs font-medium" style={{ color: "#737687" }}>{row.label}</span>
                  {row.badge ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold" style={{ background: row.badgeStyle!.bg, color: row.badgeStyle!.color }}>{row.value}</span>
                  ) : (
                    <span className="text-sm" style={{ fontFamily: row.mono ? "JetBrains Mono" : "Inter", color: row.color || "#1a1c1c" }}>{row.value}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium" style={{ color: "#737687" }}>Payload</p>
              <button onClick={() => handleCopyPayload(parsePayload(payloadModal.webhook?.raw_payload))} className="flex items-center gap-1 text-xs font-medium" style={{ color: "#004ccd" }}>
                <span className="material-symbols-outlined text-[14px]">{copied ? "check" : "content_copy"}</span>
                {copied ? "Tersalin!" : "Salin"}
              </button>
            </div>
            <pre className="rounded-xl p-3 text-xs overflow-auto max-h-60" style={{ background: "#1a1c1c", fontFamily: "JetBrains Mono", color: "#a6e3a1" }}>
              {(() => { const payload = parsePayload(payloadModal.webhook?.raw_payload); return payload ? JSON.stringify(payload, null, 2) : "No payload"; })()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
