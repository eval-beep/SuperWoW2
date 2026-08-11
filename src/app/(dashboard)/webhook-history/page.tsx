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

export default function WebhookHistoryPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cloudIdFromSettings, setCloudIdFromSettings] = useState("");
  const [copied, setCopied] = useState(false);
  const [formatJson, setFormatJson] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: "50" });
    if (search) params.set("search", search);
    if (typeFilter) params.set("webhook_type", typeFilter);
    if (cloudIdFromSettings) params.set("cloud_id", cloudIdFromSettings);
    const res = await fetch(`/api/webhook-history?${params.toString()}`);
    const data = await res.json();
    setLogs(data.data || []);
    setTotal(data.total || 0);
    setLastPage(data.lastPage || 1);
    if (data.data?.length > 0 && !selectedId) {
      setSelectedId(data.data[0].id);
    }
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
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())} ${d.getHours() >= 12 ? "PM" : "AM"}`;
  }

  function formatShortTime(dateStr: string) {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[d.getMonth()]} ${d.getDate()}\n${pad(d.getHours())}:${pad(d.getMinutes())} ${d.getHours() >= 12 ? "PM" : "AM"}`;
  }

  function getShortId(id: string) {
    return id.substring(0, 8);
  }

  function getPayloadPreview(payload: Record<string, unknown>): string {
    const t = payload?.type || payload?.webhook_type || "";
    const cid = payload?.cloud_id || "";
    return `${t} ${cid}`.trim();
  }

  const selectedLog = logs.find((l) => l.id === selectedId);

  function handleCopy() {
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog.raw_payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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

  const startEntry = total === 0 ? 0 : (page - 1) * 50 + 1;
  const endEntry = Math.min(page * 50, total);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Webhook History</h1>
        <p className="text-xs mt-0.5" style={{ color: "#737687" }}>Data webhook yang diterima dari device Fingerspot</p>
      </div>

      {/* Main Content - Webhook.site style */}
      <div className="rounded-xl overflow-hidden flex flex-col lg:flex-row" style={{ background: "#1e1e1e", border: "1px solid rgba(195,198,216,0.2)", minHeight: "500px" }}>
        {/* Left Sidebar - Inbox */}
        <div className="w-full lg:w-[320px] flex-shrink-0 flex flex-col" style={{ borderRight: "1px solid #333" }}>
          {/* Sidebar Header */}
          <div className="px-3 py-2 flex items-center justify-between" style={{ background: "#252526", borderBottom: "1px solid #333" }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold" style={{ color: "#ccc" }}>INBOX</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#333", color: "#aaa" }}>({total})</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="text-[10px] px-1.5 py-0.5 rounded disabled:opacity-30" style={{ color: "#aaa" }}>&laquo;</button>
              <span className="text-[10px]" style={{ color: "#777" }}>{page}/{lastPage}</span>
              <button onClick={() => setPage(Math.min(lastPage, page + 1))} disabled={page === lastPage} className="text-[10px] px-1.5 py-0.5 rounded disabled:opacity-30" style={{ color: "#aaa" }}>&raquo;</button>
            </div>
          </div>

          {/* Filter */}
          <div className="px-3 py-2" style={{ background: "#252526", borderBottom: "1px solid #333" }}>
            <input type="text" placeholder="Search Query" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleFilter()}
              className="w-full px-2 py-1 rounded text-[11px]" style={{ background: "#333", border: "1px solid #444", color: "#ccc", fontFamily: "JetBrains Mono" }} />
          </div>

          {/* Inbox List */}
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: "420px" }}>
            {loading ? (
              <div className="p-4 text-center">
                <span className="material-symbols-outlined animate-spin text-lg" style={{ color: "#004ccd" }}>progress_activity</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-4 text-center text-xs" style={{ color: "#666" }}>Tidak ada data</div>
            ) : (
              logs.map((log) => {
                const isSelected = selectedId === log.id;
                const d = new Date(log.received_at);
                const pad = (n: number) => String(n).padStart(2, "0");
                const dateStr = `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
                const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
                return (
                  <div key={log.id} onClick={() => setSelectedId(log.id)}
                    className="px-3 py-2 cursor-pointer transition-colors flex items-start gap-2"
                    style={{
                      background: isSelected ? "#094771" : "transparent",
                      borderBottom: "1px solid #333",
                    }}>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0 mt-0.5" style={{ background: "#0e639c", color: "#fff" }}>POST</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-medium" style={{ color: isSelected ? "#fff" : "#ccc", fontFamily: "JetBrains Mono" }}>#{getShortId(log.id)}</span>
                        <span className="text-[10px]" style={{ color: "#666" }}>{log.cloud_id}</span>
                      </div>
                      <div className="text-[10px]" style={{ color: "#888" }}>{dateStr} {timeStr}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel - Request Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Panel Header */}
          <div className="px-4 py-2 flex items-center justify-between" style={{ background: "#252526", borderBottom: "1px solid #333" }}>
            <span className="text-xs font-bold" style={{ color: "#ccc" }}>Request Content</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 text-[10px] cursor-pointer" style={{ color: "#aaa" }}>
                <input type="checkbox" checked={formatJson} onChange={(e) => setFormatJson(e.target.checked)} className="w-3 h-3" />
                Format JSON
              </label>
              <label className="flex items-center gap-1 text-[10px] cursor-pointer" style={{ color: "#aaa" }}>
                <input type="checkbox" checked={wordWrap} onChange={(e) => setWordWrap(e.target.checked)} className="w-3 h-3" />
                Word Wrap
              </label>
              <button onClick={handleCopy} className="text-[10px] px-2 py-0.5 rounded flex items-center gap-1" style={{ background: "#0e639c", color: "#fff" }}>
                <span className="material-symbols-outlined text-[12px]">{copied ? "check" : "content_copy"}</span>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* JSON Content */}
          <div className="flex-1 overflow-auto p-4" style={{ background: "#1e1e1e" }}>
            {selectedLog ? (
              <div>
                {/* Meta info */}
                <div className="mb-3 pb-3" style={{ borderBottom: "1px solid #333" }}>
                  <div className="flex items-center gap-4 text-[10px]" style={{ color: "#888", fontFamily: "JetBrains Mono" }}>
                    <span>Type: <span style={{ color: "#569cd6" }}>{selectedLog.webhook_type}</span></span>
                    <span>Cloud ID: <span style={{ color: "#ce9178" }}>{selectedLog.cloud_id}</span></span>
                    {selectedLog.trans_id && <span>Trans ID: <span style={{ color: "#b5cea8" }}>{selectedLog.trans_id}</span></span>}
                    <span>Received: <span style={{ color: "#9cdcfe" }}>{formatTime(selectedLog.received_at)}</span></span>
                  </div>
                </div>
                {/* Raw Content */}
                <div className="text-[11px] leading-relaxed" style={{ fontFamily: "JetBrains Mono", whiteSpace: wordWrap ? "pre-wrap" : "pre", wordBreak: wordWrap ? "break-all" : "normal" }}>
                  {formatJson ? (
                    renderJson(selectedLog.raw_payload, 0)
                  ) : (
                    <span style={{ color: "#ce9178" }}>{JSON.stringify(selectedLog.raw_payload)}</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs" style={{ color: "#666" }}>Pilih webhook dari inbox</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
