"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const COMMAND_TYPES = [
  { value: "get_attlog", label: "Get Attendance Log" },
  { value: "get_userinfo", label: "Get User Info" },
  { value: "get_all_pin", label: "Get All PIN" },
  { value: "set_userinfo", label: "Set User Info" },
  { value: "delete_userinfo", label: "Delete User Info" },
  { value: "set_time", label: "Set Time" },
  { value: "register_online", label: "Register Online" },
  { value: "restart_device", label: "Restart Device" },
];

const TIMEZONES = [
  { group: "Indonesia", items: ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"] },
  { group: "Asia Pacific", items: ["Asia/Shanghai", "Asia/Tokyo", "Asia/Seoul", "Asia/Singapore", "Asia/Kuala_Lumpur", "Asia/Bangkok", "Asia/Ho_Chi_Minh", "Asia/Phnom_Penh", "Asia/Yangon", "Asia/Kolkata", "Asia/Dhaka", "Asia/Colombo", "Asia/Karachi", "Asia/Kathmandu", "Asia/Hong_Kong", "Asia/Taipei", "Asia/Manila", "Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane", "Pacific/Auckland", "Pacific/Fiji"] },
  { group: "Middle East & Africa", items: ["Asia/Dubai", "Asia/Riyadh", "Asia/Tehran", "Asia/Baghdad", "Asia/Jerusalem", "Africa/Cairo", "Africa/Lagos", "Africa/Nairobi", "Africa/Johannesburg", "Africa/Casablanca"] },
  { group: "Europe", items: ["Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Madrid", "Europe/Rome", "Europe/Amsterdam", "Europe/Brussels", "Europe/Zurich", "Europe/Vienna", "Europe/Stockholm", "Europe/Moscow", "Europe/Istanbul", "Europe/Athens", "Europe/Warsaw", "Europe/Bucharest", "Europe/Kiev"] },
  { group: "Americas", items: ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Anchorage", "America/Sao_Paulo", "America/Argentina/Buenos_Aires", "America/Mexico_City", "America/Bogota", "America/Lima", "America/Santiago", "America/Toronto", "America/Vancouver"] },
  { group: "UTC", items: ["UTC"] },
];

type ResponseTab = "body" | "headers" | "raw";

interface ApiResponse {
  success: boolean;
  status_code: number;
  data: Record<string, unknown>;
  endpoint?: string;
  request_body?: Record<string, unknown>;
  http_code?: number;
}

function ApiTesterContent() {
  const searchParams = useSearchParams();
  const [command, setCommand] = useState(searchParams.get("command") || "get_all_pin");
  const [cloudId, setCloudId] = useState(searchParams.get("cloud_id") || "C2697842930C1634");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [privilege, setPrivilege] = useState("1");
  const [password, setPassword] = useState("");
  const [rfid, setRfid] = useState("");
  const [template, setTemplate] = useState("");
  const [verification, setVerification] = useState("0");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const [tzSearch, setTzSearch] = useState("");
  const [tzOpen, setTzOpen] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [timing, setTiming] = useState(0);
  const [cloudIdHistory, setCloudIdHistory] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<ResponseTab>("body");

  useEffect(() => {
    const history = localStorage.getItem("cloud_id_history");
    if (history) setCloudIdHistory(JSON.parse(history));
  }, []);

  useEffect(() => {
    if (!tzOpen) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-tz-picker]")) setTzOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [tzOpen]);

  function saveCloudIdToHistory(id: string) {
    if (!id || cloudIdHistory.includes(id)) return;
    const newHistory = [id, ...cloudIdHistory].slice(0, 10);
    setCloudIdHistory(newHistory);
    localStorage.setItem("cloud_id_history", JSON.stringify(newHistory));
  }

  function buildParams(): Record<string, unknown> {
    const base = { trans_id: "1", cloud_id: cloudId };

    switch (command) {
      case "get_attlog":
        return { ...base, start_date: startDate, end_date: endDate };

      case "get_userinfo":
        return { ...base, pin };

      case "get_all_pin":
        return base;

      case "set_userinfo":
        return {
          ...base,
          data: { pin, name, privilege, password, rfid, template },
        };

      case "delete_userinfo":
        return { ...base, pin };

      case "set_time":
        return { ...base, timezone };

      case "register_online":
        return { ...base, pin, verification };

      case "restart_device":
        return base;

      default:
        return base;
    }
  }

  async function handleExecute() {
    if (!cloudId) return alert("Cloud ID harus diisi");
    setLoading(true);
    setResponse(null);
    setActiveTab("body");
    saveCloudIdToHistory(cloudId);
    const start = Date.now();

    try {
      const res = await fetch("/api/fingerspot/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, params: buildParams(), logToHistory: true }),
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({ success: false, status_code: 500, data: { error: (err as Error).message } });
    } finally {
      setTiming(Date.now() - start);
      setLoading(false);
    }
  }

  const requestPreview = JSON.stringify(buildParams(), null, 2);
  const responseJson = response ? JSON.stringify(response.data, null, 2) : "";
  const endpointUrl = "https://api.fingerspot.io/v2/machine/cmd_exec";

  function getStatusLabel(code: number): string {
    if (code >= 200 && code < 300) return "OK";
    if (code >= 300 && code < 400) return "Redirect";
    if (code >= 400 && code < 500) return "Client Error";
    if (code >= 500) return "Server Error";
    return "";
  }

  function generateHeaders(): string {
    return JSON.stringify({
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Cloud-ID": cloudId,
      "X-Command": command,
    }, null, 2);
  }

  function handleCopyResponse() {
    if (responseJson) navigator.clipboard.writeText(responseJson);
  }

  const inputStyle = { border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c", fontSize: "12px", padding: "6px 10px", borderRadius: "8px", width: "100%" as const };

  const filteredTz = TIMEZONES.map((g) => ({
    ...g,
    items: g.items.filter((tz) => tz.toLowerCase().includes(tzSearch.toLowerCase())),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-2xl font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Pengujian API</h1>
        <p className="text-xs sm:text-sm mt-1" style={{ color: "#737687" }}>Kirim perintah langsung ke device biometrik</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Request Panel */}
        <div className="rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-3" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg sm:text-xl" style={{ color: "#004ccd" }}>send_and_archive</span>
            <h3 className="text-sm font-semibold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Request Builder</h3>
          </div>

          {/* Command */}
          <div>
            <label className="block text-[10px] font-medium mb-0.5" style={{ color: "#737687" }}>Command</label>
              <select value={command} onChange={(e) => setCommand(e.target.value)} className="w-full rounded-lg text-xs" style={{ ...inputStyle, fontFamily: "JetBrains Mono" }}>
              {COMMAND_TYPES.map((cmd) => <option key={cmd.value} value={cmd.value}>{cmd.label}</option>)}
            </select>
          </div>

          {/* Cloud ID — always shown */}
          <div>
            <label className="block text-[10px] font-medium mb-0.5" style={{ color: "#737687" }}>cloud_id</label>
            <input value={cloudId} onChange={(e) => setCloudId(e.target.value)} className="w-full rounded-lg text-xs" style={{ ...inputStyle, fontFamily: "JetBrains Mono" }} placeholder="C2697842930C1634" />
            {cloudIdHistory.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {cloudIdHistory.map((id) => (
                  <button key={id} onClick={() => setCloudId(id)} className="text-[10px] px-2 py-0.5 rounded-lg hover:bg-[#dbe1ff]" style={{ background: "#f3f3f3", fontFamily: "JetBrains Mono" }}>{id}</button>
                ))}
              </div>
            )}
          </div>

          {/* === GET ATT LOG === */}
          {command === "get_attlog" && (
            <>
              <div>
                <label className="block text-[10px] font-medium mb-0.5" style={{ color: "#737687" }}>start_date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-lg text-xs" style={inputStyle} />
              </div>
              <div>
                <label className="block text-[10px] font-medium mb-0.5" style={{ color: "#737687" }}>end_date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-lg text-xs" style={inputStyle} />
              </div>
            </>
          )}

          {/* === GET USER INFO === */}
          {command === "get_userinfo" && (
            <div>
              <label className="block text-[10px] font-medium mb-0.5" style={{ color: "#737687" }}>pin</label>
              <input value={pin} onChange={(e) => setPin(e.target.value)} className="w-full rounded-lg text-xs" style={{ ...inputStyle, fontFamily: "JetBrains Mono" }} placeholder="1" />
            </div>
          )}

          {/* === SET USER INFO === */}
          {command === "set_userinfo" && (
            <>
              <div className="rounded-lg p-2.5" style={{ background: "rgba(0,76,205,0.05)", border: "1px solid rgba(0,76,205,0.15)" }}>
                <p className="text-[9px] uppercase tracking-wider mb-1.5 font-bold" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>data object</p>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-medium mb-0.5" style={{ color: "#737687" }}>pin</label>
                    <input value={pin} onChange={(e) => setPin(e.target.value)} className="w-full rounded-lg text-xs" style={{ ...inputStyle, fontFamily: "JetBrains Mono" }} placeholder="1" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium mb-0.5" style={{ color: "#737687" }}>name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg text-xs" style={inputStyle} placeholder="john" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium mb-0.5" style={{ color: "#737687" }}>privilege</label>
                      <select value={privilege} onChange={(e) => setPrivilege(e.target.value)} className="w-full rounded-lg text-xs" style={inputStyle}>
                        <option value="1">1 — User</option>
                        <option value="2">2 — Admin</option>
                        <option value="3">3 — Super Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium mb-0.5" style={{ color: "#737687" }}>password</label>
                      <input value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg text-xs" style={{ ...inputStyle, fontFamily: "JetBrains Mono" }} placeholder="111" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium mb-0.5" style={{ color: "#737687" }}>rfid</label>
                      <input value={rfid} onChange={(e) => setRfid(e.target.value)} className="w-full rounded-lg text-xs" style={{ ...inputStyle, fontFamily: "JetBrains Mono" }} placeholder="XXXXX" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium mb-0.5" style={{ color: "#737687" }}>template</label>
                      <input value={template} onChange={(e) => setTemplate(e.target.value)} className="w-full rounded-lg text-xs" style={{ ...inputStyle, fontFamily: "JetBrains Mono" }} placeholder="5345dsfd..." />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* === DELETE USER INFO === */}
          {command === "delete_userinfo" && (
            <div>
              <label className="block text-[10px] font-medium mb-0.5" style={{ color: "#737687" }}>pin</label>
              <input value={pin} onChange={(e) => setPin(e.target.value)} className="w-full rounded-lg text-xs" style={{ ...inputStyle, fontFamily: "JetBrains Mono" }} placeholder="1" />
            </div>
          )}

          {/* === REGISTER ONLINE === */}
          {command === "register_online" && (
            <>
              <div>
                <label className="block text-[10px] font-medium mb-0.5" style={{ color: "#737687" }}>pin</label>
                <input value={pin} onChange={(e) => setPin(e.target.value)} className="w-full rounded-lg text-xs" style={{ ...inputStyle, fontFamily: "JetBrains Mono" }} placeholder="1" />
              </div>
              <div>
                <label className="block text-[10px] font-medium mb-0.5" style={{ color: "#737687" }}>verification</label>
                <select value={verification} onChange={(e) => setVerification(e.target.value)} className="w-full rounded-lg text-xs" style={inputStyle}>
                  <option value="0">0 — Password</option>
                  <option value="1">1 — Fingerprint</option>
                  <option value="2">2 — Face</option>
                  <option value="3">3 — Card</option>
                </select>
              </div>
            </>
          )}

          {/* === SET TIME === */}
          {command === "set_time" && (
            <div data-tz-picker>
              <label className="block text-[10px] font-medium mb-0.5" style={{ color: "#737687" }}>timezone</label>
              <div className="relative">
                <button type="button" onClick={() => { setTzOpen(!tzOpen); setTzSearch(""); }} className="w-full px-3 py-1.5 rounded-lg text-xs text-left flex items-center justify-between" style={{ ...inputStyle, fontFamily: "JetBrains Mono" }}>
                  <span>{timezone}</span>
                  <span className="material-symbols-outlined text-[14px]" style={{ color: "#737687" }}>unfold_more</span>
                </button>
                {tzOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg shadow-lg overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(195,198,216,0.3)", maxHeight: "180px" }}>
                    <div className="p-1.5" style={{ borderBottom: "1px solid rgba(195,198,216,0.2)" }}>
                      <input autoFocus value={tzSearch} onChange={(e) => setTzSearch(e.target.value)} className="w-full px-2 py-1 rounded text-[11px] outline-none" style={{ background: "#f3f3f3", color: "#1a1c1c" }} placeholder="Cari timezone..." />
                    </div>
                    <div className="overflow-y-auto" style={{ maxHeight: "150px" }}>
                      {filteredTz.map((group) => (
                        <div key={group.group}>
                          <div className="px-2.5 py-1 text-[9px] uppercase tracking-wider font-bold" style={{ fontFamily: "JetBrains Mono", color: "#737687", background: "#f9f9f9" }}>{group.group}</div>
                          {group.items.map((tz) => (
                            <button key={tz} onClick={() => { setTimezone(tz); setTzOpen(false); setTzSearch(""); }} className="w-full text-left px-2.5 py-1.5 text-[11px] hover:bg-[#dbe1ff] transition-colors" style={{ fontFamily: "JetBrains Mono", color: tz === timezone ? "#004ccd" : "#1a1c1c", background: tz === timezone ? "rgba(0,76,205,0.08)" : "transparent" }}>{tz}</button>
                          ))}
                        </div>
                      ))}
                      {filteredTz.length === 0 && <div className="px-3 py-2 text-[11px]" style={{ color: "#737687" }}>Tidak ditemukan</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GET ALL PIN — no extra fields needed */}
          {command === "get_all_pin" && (
            <div className="rounded-lg p-2 text-[10px]" style={{ background: "#f3f3f3", color: "#737687" }}>
              Tidak ada parameter tambahan. Hanya <code style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>trans_id</code> + <code style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>cloud_id</code>.
            </div>
          )}

          {/* Request Body Preview */}
          <div>
            <label className="block text-[10px] font-medium mb-0.5" style={{ color: "#737687" }}>Request Body</label>
            <pre className="rounded-lg p-2 text-[10px] overflow-auto max-h-32" style={{ background: "#1a1c1c", fontFamily: "JetBrains Mono", color: "#a6e3a1" }}>{requestPreview}</pre>
          </div>

          {/* Execute */}
          <button onClick={handleExecute} disabled={loading || !cloudId} className="w-full py-2 rounded-lg text-white font-semibold text-xs flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: "#004ccd" }}>
            <span className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin" : ""}`}>{loading ? "progress_activity" : "bolt"}</span>
            {loading ? "Mengirim..." : "Send Request"}
          </button>
        </div>

        {/* Response Panel — Dark */}
        <div className="rounded-xl sm:rounded-2xl p-3 sm:p-5 space-y-0" style={{ background: "#1a1c1c" }}>
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "Hanken Grotesk" }}>Device Endpoint</h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider" style={{ fontFamily: "JetBrains Mono", background: "rgba(0,110,43,0.2)", color: "#93f59e" }}>STABLE</span>
            </div>
            <div className="px-3 py-2 rounded-lg text-[10px] sm:text-xs break-all" style={{ fontFamily: "JetBrains Mono", background: "rgba(255,255,255,0.05)", color: "#908fa0" }}>{endpointUrl}</div>
          </div>

          <div className="flex items-center gap-1 mb-0 overflow-x-auto">
            {([
              { key: "body" as const, icon: "code", label: "Body" },
              { key: "headers" as const, icon: "list_alt", label: "Headers" },
              { key: "raw" as const, icon: "raw_on", label: "Raw" },
            ]).map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1 px-2 sm:px-3 py-2 rounded-t-lg text-[11px] sm:text-xs font-medium transition-colors whitespace-nowrap ${activeTab === tab.key ? "bg-white/5 text-white border-b-2 border-[#004ccd]" : "text-gray-500 hover:text-gray-300"}`} style={{ fontFamily: "Hanken Grotesk" }}>
                <span className="material-symbols-outlined text-[13px] sm:text-[14px]">{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>

          <div className="rounded-b-xl rounded-tr-xl overflow-hidden" style={{ background: "#1a1c1c" }}>
            {response ? (
              <div className="relative">
                <button onClick={handleCopyResponse} className="absolute top-2 right-2 z-10 p-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }} title="Copy">
                  <span className="material-symbols-outlined text-[14px] sm:text-[16px] text-gray-400">content_copy</span>
                </button>
                <div className="px-3 sm:px-4 pt-2 sm:pt-3 pb-1 text-[10px] sm:text-[11px] tracking-widest" style={{ fontFamily: "JetBrains Mono", color: "#555" }}>01020304050607080910111213141516</div>
                {activeTab === "body" && <pre className="px-3 sm:px-4 pb-3 sm:pb-4 text-[11px] sm:text-xs overflow-auto max-h-[300px] sm:max-h-[420px] leading-relaxed" style={{ fontFamily: "JetBrains Mono", color: "#e4e1ed" }}>{responseJson}</pre>}
                {activeTab === "headers" && <pre className="px-3 sm:px-4 pb-3 sm:pb-4 text-[11px] sm:text-xs overflow-auto max-h-[300px] sm:max-h-[420px] leading-relaxed" style={{ fontFamily: "JetBrains Mono", color: "#e4e1ed" }}>{generateHeaders()}</pre>}
                {activeTab === "raw" && <pre className="px-3 sm:px-4 pb-3 sm:pb-4 text-[11px] sm:text-xs overflow-auto max-h-[300px] sm:max-h-[420px] leading-relaxed" style={{ fontFamily: "JetBrains Mono", color: "#e4e1ed" }}>{responseJson}</pre>}
                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 text-[10px] sm:text-[11px] flex-wrap" style={{ fontFamily: "JetBrains Mono", borderTop: "1px solid rgba(255,255,255,0.06)", color: "#908fa0" }}>
                  <span>JSON</span><span>•</span><span>UTF-8</span><span>•</span>
                  <span>{new Blob([responseJson]).size > 1024 ? `${(new Blob([responseJson]).size / 1024).toFixed(1)}KB` : `${new Blob([responseJson]).size}B`}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-gray-600">
                <span className="material-symbols-outlined text-[36px] sm:text-[48px] opacity-30">send</span>
                <p className="text-xs sm:text-sm mt-2" style={{ fontFamily: "Hanken Grotesk" }}>Kirim perintah untuk melihat response</p>
              </div>
            )}
          </div>

          {response && (
            <div className="flex items-center justify-between mt-3 px-1 flex-wrap gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className={`w-2 h-2 rounded-full ${(response.status_code || response.http_code || 0) >= 200 && (response.status_code || response.http_code || 0) < 300 ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-xs sm:text-sm font-bold" style={{ fontFamily: "JetBrains Mono", color: "#e4e1ed" }}>{response.status_code || response.http_code || "-"}</span>
                  <span className="text-xs sm:text-sm hidden sm:inline" style={{ fontFamily: "Hanken Grotesk", color: "#908fa0" }}>{getStatusLabel(response.status_code || response.http_code || 0)}</span>
                </div>
                <span className="text-[10px] sm:text-xs" style={{ fontFamily: "JetBrains Mono", color: "#908fa0" }}>{timing}ms</span>
              </div>
              <button onClick={handleCopyResponse} className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium" style={{ fontFamily: "Hanken Grotesk", background: "rgba(255,255,255,0.05)", color: "#908fa0" }}>
                <span className="material-symbols-outlined text-[12px] sm:text-[14px]">download</span>LOG
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ApiTesterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><span className="material-symbols-outlined animate-spin" style={{ color: "#737687" }}>progress_activity</span></div>}>
      <ApiTesterContent />
    </Suspense>
  );
}
