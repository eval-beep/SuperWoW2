"use client";

import { useEffect, useState, useCallback } from "react";
import { LgSelect, Pagination } from "@/components/ui/LgComponents";
import { formatDate } from "@/lib/utils";
import { useThemeLanguage } from "@/contexts/ThemeLanguageContext";

interface Userinfo {
  id: string;
  cloud_id: string;
  pin: string;
  name: string;
  privilege: number;
  password: string;
  rfid: string;
  finger_count: number;
  face_count: number;
  vein_count: number;
  template: string;
  raw_payload: Record<string, unknown> | null;
  synced_at: string;
  created_at: string;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getPrivilegeInfo(level: number): { label: string; bg: string; color: string } {
  if (level === 3) return { label: "SUPER ADMIN", bg: "#defbe6", color: "#006e2b" };
  if (level === 2) return { label: "ADMIN", bg: "#dbe1ff", color: "#004ccd" };
  return { label: "NORMAL USER", bg: "#fff1f1", color: "#da1e28" };
}

export default function UserInfoPage() {
  const { theme, t } = useThemeLanguage();
  const [users, setUsers] = useState<Userinfo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [allCloudIds, setAllCloudIds] = useState<string[]>([]);
  const [privilegeFilter, setPrivilegeFilter] = useState("");
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; user: Userinfo | null }>({
    open: false,
    user: null,
  });
  const [detailModal, setDetailModal] = useState<{ open: boolean; user: Userinfo | null }>({
    open: false,
    user: null,
  });
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    pin: "",
    name: "",
    privilege: 1,
    password: "",
    rfid: "",
  });
  const [editModal, setEditModal] = useState<{ open: boolean; user: Userinfo | null }>({ open: false, user: null });
  const [editForm, setEditForm] = useState({ name: "", privilege: 1 });
  const [editLoading, setEditLoading] = useState(false);
  const [syncPin, setSyncPin] = useState("");
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (search) params.set("search", search);

    const res = await fetch(`/api/user-info?${params.toString()}`, { credentials: "include" });
    const data = await res.json();
    setUsers(data.data || []);
    setTotal(data.total || 0);
    setLastPage(data.lastPage || 1);
    setLoading(false);
  }, [page, perPage, search]);

  useEffect(() => {
    loadUsers();
    loadCloudIds();
  }, [loadUsers]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setSearch(q);
  }, []);

  useEffect(() => {
    function handleClickOutside() {
      if (actionMenu) setActionMenu(null);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [actionMenu]);

  async function loadCloudIds() {
    try {
      const res = await fetch("/api/settings", { credentials: "include" });
      const data = await res.json();
      if (data?.cloud_id) setAllCloudIds([data.cloud_id]);
    } catch { /* ignore */ }
  }

  async function handleDelete(mode: "web" | "device") {
    if (!deleteModal.user) return;
    const { pin } = deleteModal.user;
    try {
      await fetch("/api/user-info/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, mode }),
        credentials: "include",
      });
      setDeleteModal({ open: false, user: null });
      loadUsers();
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  async function handleAdd() {
    if (!addForm.pin || !addForm.name) return alert("PIN dan Nama harus diisi");
    try {
      await fetch("/api/user-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: addForm.pin, name: addForm.name, privilege: addForm.privilege, password: addForm.password, rfid: addForm.rfid }),
        credentials: "include",
      });
      setAddModal(false);
      setAddForm({ pin: "", name: "", privilege: 1, password: "", rfid: "" });
      loadUsers();
    } catch (err) {
      console.error("Add error:", err);
    }
  }

  async function handleEdit() {
    if (!editModal.user || !editForm.name.trim()) return alert("Nama harus diisi");
    setEditLoading(true);
    try {
      await fetch("/api/user-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editModal.user.id,
          name: editForm.name,
          privilege: editForm.privilege,
        }),
        credentials: "include",
      });
      setEditModal({ open: false, user: null });
      loadUsers();
    } catch (err) {
      console.error("Edit error:", err);
    } finally {
      setEditLoading(false);
    }
  }

  async function handleSyncFromDevice() {
    if (!syncPin.trim()) return alert("PIN harus diisi");
    setSyncLoading(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/user-info/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: syncPin.trim() }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setSyncResult({ ok: true, msg: data.message || "Berhasil" });
        loadUsers();
      } else {
        setSyncResult({ ok: false, msg: data.error || "Gagal" });
      }
    } catch (err) {
      setSyncResult({ ok: false, msg: (err as Error).message });
    } finally {
      setSyncLoading(false);
    }
  }

  const filteredUsers = privilegeFilter
    ? users.filter((u) => String(u.privilege) === privilegeFilter)
    : users;

  const superAdminCount = users.filter((u) => u.privilege === 3).length;
  const adminCount = users.filter((u) => u.privilege === 2).length;
  const userCount = users.filter((u) => u.privilege <= 1).length;

  const jsonPreview = JSON.stringify(
    { pin: addForm.pin, name: addForm.name, privilege: addForm.privilege, password: addForm.password, rfid: addForm.rfid },
    null, 2
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Hanken Grotesk", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{t("user-info")}</h1>
          <p className="text-sm mt-1" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>Manage biometric user data</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2" style={{ border: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195,198,216,0.3)"}`, color: theme === "dark" ? "#c7c4d7" : "#424656" }}>
            <span className="material-symbols-outlined text-[18px]">download</span>{t("export")}
          </button>
          <button onClick={() => setAddModal(true)} className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 text-white" style={{ background: "#004ccd" }}>
            <span className="material-symbols-outlined text-[18px]">person_add</span>{t("addUser")}
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t("totalUsers"), value: total, icon: "group", bg: "#dbe1ff", iconColor: "#004ccd" },
          { label: t("activeDevices"), value: allCloudIds.length, icon: "dns", bg: "#defbe6", iconColor: "#006e2b" },
          { label: t("newEnrolled"), value: users.filter((u) => { const d = new Date(u.created_at); return new Date().getTime() - d.getTime() < 86400000; }).length, icon: "person_add", bg: "#fff1f1", iconColor: "#da1e28" },
          { label: t("dataHealth"), value: "99.2%", icon: "verified", bg: "#dbe1ff", iconColor: "#004ccd" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl p-5" style={{ background: theme === "dark" ? "rgba(31,31,39,0.7)" : "rgba(255,255,255,0.6)", border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.3)"}` }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider" style={{ fontFamily: "JetBrains Mono", color: theme === "dark" ? "#908fa0" : "#737687", letterSpacing: "0.05em" }}>{stat.label}</p>
                <p className="text-3xl font-bold mt-2" style={{ fontFamily: "Hanken Grotesk", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{stat.value}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                <span className="material-symbols-outlined text-xl" style={{ color: stat.iconColor }}>{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {/* Filters */}
          <div className="rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center mb-4" style={{ background: theme === "dark" ? "rgba(31,31,39,0.7)" : "rgba(255,255,255,0.6)", border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.3)"}` }}>
            <LgSelect
              id="privilegeFilter"
              options={[
                { value: "", label: t("allPrivileges"), icon: "admin_panel_settings" },
                { value: "3", label: "Super Admin", icon: "shield" },
                { value: "2", label: "Admin", icon: "admin_panel_settings" },
                { value: "1", label: "Normal User", icon: "person" },
              ]}
              value={privilegeFilter}
              onChange={(v) => { setPrivilegeFilter(v); setPage(1); }}
              placeholder={t("allPrivileges")}
              icon="filter_list"
            />
            <div className="flex-1" />
            <input
              type="text"
              placeholder={`${t("search")} PIN, name...`}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 min-w-0 px-4 py-2 rounded-xl text-sm"
              style={{ background: theme === "dark" ? "#292932" : "#f3f3f3", border: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195,198,216,0.3)"}`, color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}
            />
          </div>

          {/* Table */}
          <div className="rounded-2xl" style={{ background: theme === "dark" ? "rgba(31,31,39,0.7)" : "rgba(255,255,255,0.6)", border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.3)"}` }}>
            <div className="hidden md:block overflow-x-auto rounded-t-2xl">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.2)" : "rgba(195,198,216,0.2)"}` }}>
                    {[t("pin"), t("name"), t("privilege"), t("cloudId"), t("createdAt"), "Actions"].map((h) => (
                      <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ fontFamily: "JetBrains Mono", color: theme === "dark" ? "#908fa0" : "#737687" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-8" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>
                      <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>{t("loading")}
                    </td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("noData")}</td></tr>
                  ) : (
                    filteredUsers.map((user, i) => {
                      const priv = getPrivilegeInfo(user.privilege);
                      return (
                        <tr key={user.id} className="cursor-pointer" style={{ borderBottom: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.1)" : "rgba(195,198,216,0.1)"}`, background: i % 2 === 0 ? "transparent" : (theme === "dark" ? "rgba(41,41,50,0.3)" : "rgba(243,243,243,0.3)") }}>
                          <td className="py-3 px-3 font-medium" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }} onClick={() => setDetailModal({ open: true, user })}>{user.pin}</td>
                          <td className="py-3 px-3" onClick={() => setDetailModal({ open: true, user })}>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: "#004ccd" }}>{getInitials(user.name)}</div>
                              <span style={{ color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{user.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3" onClick={() => setDetailModal({ open: true, user })}>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide" style={{ background: priv.bg, color: priv.color }}>{priv.label}</span>
                          </td>
                          <td className="py-3 px-3" onClick={() => setDetailModal({ open: true, user })} style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{user.cloud_id}</td>
                          <td className="py-3 px-3 text-xs" onClick={() => setDetailModal({ open: true, user })} style={{ fontFamily: "JetBrains Mono", color: theme === "dark" ? "#908fa0" : "#737687" }}>{user.created_at ? formatDate(user.created_at) : "-"}</td>
                          <td className="py-3 px-3 relative">
                            <button onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === user.id ? null : user.id); }} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>
                              <span className="material-symbols-outlined text-[20px]">more_vert</span>
                            </button>
                            {actionMenu === user.id && (
                              <div className="absolute right-0 top-full mt-1 z-50 rounded-xl py-1 min-w-[160px] shadow-lg" style={{ background: theme === "dark" ? "#1f1f27" : "#ffffff", border: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195,198,216,0.3)"}` }} onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => { setActionMenu(null); setEditModal({ open: true, user }); setEditForm({ name: user.name, privilege: user.privilege }); }} className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-[#f3f3f3]" style={{ color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>
                                  <span className="material-symbols-outlined text-[16px]">edit</span>{t("edit")}
                                </button>
                                <button onClick={() => { setActionMenu(null); setDeleteModal({ open: true, user }); }} className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-[#f3f3f3]" style={{ color: "#da1e28" }}>
                                  <span className="material-symbols-outlined text-[16px]">delete</span>{t("delete")}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden p-3 space-y-2">
              {loading ? (
                <div className="text-center py-8" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("noData")}</div>
              ) : (
                filteredUsers.map((user) => {
                  const priv = getPrivilegeInfo(user.privilege);
                  return (
                    <div key={user.id} className="rounded-xl p-3" style={{ background: theme === "dark" ? "rgba(31,31,39,0.7)" : "rgba(255,255,255,0.6)", border: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.15)" : "rgba(195,198,216,0.15)"}` }} onClick={() => setDetailModal({ open: true, user })}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: "#004ccd" }}>{getInitials(user.name)}</div>
                          <div>
                            <span className="font-medium text-xs block" style={{ color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{user.name}</span>
                            <span className="text-[10px]" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>{user.pin}</span>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: priv.bg, color: priv.color }}>{priv.label}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>
                        <span>{user.cloud_id}</span>
                        <span>{user.created_at ? formatDate(user.created_at) : "-"}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <Pagination
              page={page}
              lastPage={lastPage}
              total={total}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={(v) => { setPerPage(v); setPage(1); }}
              showPerPage={true}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={{ background: theme === "dark" ? "rgba(31,31,39,0.7)" : "rgba(255,255,255,0.6)", border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.3)"}` }}>
            <h3 className="text-sm font-bold mb-4" style={{ fontFamily: "Hanken Grotesk", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{t("privilegeSummary")}</h3>
            <div className="space-y-3">
              {[
                { label: t("superAdminCount"), count: superAdminCount, color: "#006e2b" },
                { label: t("managerCount"), count: adminCount, color: "#004ccd" },
                { label: t("staffCount"), count: userCount, color: "#da1e28" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-sm" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{item.label}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ fontFamily: "JetBrains Mono", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{item.count}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.2)" : "rgba(195,198,216,0.2)"}` }}>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>Total</span>
                <span className="text-sm font-bold" style={{ fontFamily: "JetBrains Mono", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{total}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ background: theme === "dark" ? "rgba(31,31,39,0.7)" : "rgba(255,255,255,0.6)", border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.3)"}` }}>
            <h3 className="text-sm font-bold mb-4" style={{ fontFamily: "Hanken Grotesk", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>
              <span className="material-symbols-outlined text-[16px] align-middle mr-1" style={{ color: "#004ccd" }}>cloud_download</span>
              {t("syncFromDevice")}
            </h3>
            <p className="text-xs mb-3" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("syncDesc")}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("pin")}</label>
                <input value={syncPin} onChange={(e) => setSyncPin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSyncFromDevice()}
                  className="w-full px-3 py-2 rounded-xl text-xs" style={{ border: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195,198,216,0.3)"}`, background: theme === "dark" ? "#292932" : "#f3f3f3", fontFamily: "JetBrains Mono", color: "#004ccd" }} placeholder="100030" />
              </div>
              <button onClick={handleSyncFromDevice} disabled={syncLoading || !syncPin.trim()}
                className="w-full py-2.5 rounded-xl text-xs font-medium text-white flex items-center justify-center gap-1.5"
                style={{ background: syncLoading || !syncPin.trim() ? "#b0b8c8" : "#004ccd" }}>
                {syncLoading ? (
                  <><span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>{t("syncing")}</>
                ) : (
                  <><span className="material-symbols-outlined text-[14px]">cloud_download</span>{t("syncBtn")}</>
                )}
              </button>
              {syncResult && (
                <div className="rounded-xl p-2.5 text-[11px]" style={{ background: syncResult.ok ? "#defbe6" : "#fff1f1", color: syncResult.ok ? "#006e2b" : "#da1e28" }}>
                  {syncResult.msg}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {addModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} onClick={() => setAddModal(false)}>
          <div className="w-full max-w-xl rounded-2xl p-6" style={{ background: theme === "dark" ? "#1f1f27" : "#ffffff", border: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195,198,216,0.3)"}` }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "Hanken Grotesk", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{t("addNewUser")}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("pin")}</label>
                <input value={addForm.pin} onChange={(e) => setAddForm({ ...addForm, pin: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm" style={{ border: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195,198,216,0.3)"}`, background: theme === "dark" ? "#292932" : "#f3f3f3", fontFamily: "JetBrains Mono", color: "#004ccd" }} placeholder="123" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("name")}</label>
                <input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm" style={{ border: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195,198,216,0.3)"}`, background: theme === "dark" ? "#292932" : "#f3f3f3", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }} placeholder={t("name")} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("privilege")}</label>
                <LgSelect id="privilegeSelect" options={[{ value: "1", label: "Normal User", icon: "person", color: "blue" }, { value: "2", label: "Admin", icon: "admin_panel_settings", color: "purple" }, { value: "3", label: "Super Admin", icon: "shield", color: "green" }]} value={String(addForm.privilege)} onChange={(v) => setAddForm({ ...addForm, privilege: Number(v) })} placeholder="Select Privilege" icon="admin_panel_settings" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>RFID</label>
                <input value={addForm.rfid} onChange={(e) => setAddForm({ ...addForm, rfid: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm" style={{ border: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195,198,216,0.3)"}`, background: theme === "dark" ? "#292932" : "#f3f3f3", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }} placeholder={t("optional")} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium mb-1" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("jsonPreview")}</p>
              <pre className="rounded-xl p-3 text-xs overflow-auto max-h-32" style={{ background: "#1a1c1c", fontFamily: "JetBrains Mono", color: "#a6e3a1" }}>{jsonPreview}</pre>
            </div>
            <div className="flex gap-2 mt-4">
              <a href={`/api-tester?command=set_userinfo&pin=${addForm.pin}`} className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2" style={{ border: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195,198,216,0.3)"}`, color: theme === "dark" ? "#c7c4d7" : "#424656" }}>
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>{t("apiTester")}
              </a>
              <div className="flex-1" />
              <button onClick={() => setAddModal(false)} className="px-4 py-2.5 rounded-xl text-sm" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("cancel")}</button>
              <button onClick={handleAdd} className="px-6 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: "#004ccd" }}>{t("save")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal.open && detailModal.user && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} onClick={() => setDetailModal({ open: false, user: null })}>
          <div className="w-full max-w-md rounded-xl p-4 max-h-[80vh] overflow-y-auto" style={{ background: theme === "dark" ? "#1f1f27" : "#ffffff", border: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195,198,216,0.3)"}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold" style={{ fontFamily: "Hanken Grotesk", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{t("detailUser")}</h3>
              <span className="material-symbols-outlined text-[14px] cursor-pointer" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }} onClick={() => setDetailModal({ open: false, user: null })}>close</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center gap-3 py-1.5 text-xs" style={{ borderBottom: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.15)" : "rgba(195,198,216,0.15)"}` }}>
                <span style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("pin")}</span>
                <span className="font-medium" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>{detailModal.user.pin}</span>
              </div>
              <div className="flex justify-between items-center gap-3 py-1.5 text-xs" style={{ borderBottom: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.15)" : "rgba(195,198,216,0.15)"}` }}>
                <span style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("name")}</span>
                <span className="font-medium" style={{ color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{detailModal.user.name || "-"}</span>
              </div>
              <div className="flex justify-between items-center gap-3 py-1.5 text-xs" style={{ borderBottom: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.15)" : "rgba(195,198,216,0.15)"}` }}>
                <span style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("privilege")}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: getPrivilegeInfo(detailModal.user.privilege).bg, color: getPrivilegeInfo(detailModal.user.privilege).color }}>{getPrivilegeInfo(detailModal.user.privilege).label}</span>
              </div>
              <div className="flex justify-between items-center gap-3 py-1.5 text-xs" style={{ borderBottom: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.15)" : "rgba(195,198,216,0.15)"}` }}>
                <span style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("cloudId")}</span>
                <span className="font-medium" style={{ fontFamily: "JetBrains Mono", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{detailModal.user.cloud_id}</span>
              </div>
              <div className="flex justify-between items-center gap-3 py-1.5 text-xs" style={{ borderBottom: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.15)" : "rgba(195,198,216,0.15)"}` }}>
                <span style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("password")}</span>
                <span className="font-medium" style={{ fontFamily: "JetBrains Mono", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{detailModal.user.password || "-"}</span>
              </div>
              <div className="flex justify-between items-center gap-3 py-1.5 text-xs" style={{ borderBottom: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.15)" : "rgba(195,198,216,0.15)"}` }}>
                <span style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("finger")}</span>
                <span className="font-medium" style={{ fontFamily: "JetBrains Mono", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{detailModal.user.finger_count || 0}</span>
              </div>
              <div className="flex justify-between items-center gap-3 py-1.5 text-xs" style={{ borderBottom: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.15)" : "rgba(195,198,216,0.15)"}` }}>
                <span style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("face")}</span>
                <span className="font-medium" style={{ fontFamily: "JetBrains Mono", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{detailModal.user.face_count || 0}</span>
              </div>
              <div className="flex justify-between items-center gap-3 py-1.5 text-xs" style={{ borderBottom: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.15)" : "rgba(195,198,216,0.15)"}` }}>
                <span style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("vein")}</span>
                <span className="font-medium" style={{ fontFamily: "JetBrains Mono", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{detailModal.user.vein_count || 0}</span>
              </div>
              <div className="flex justify-between items-center gap-3 py-1.5 text-xs" style={{ borderBottom: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.15)" : "rgba(195,198,216,0.15)"}` }}>
                <span style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("template")}</span>
                <span className="font-medium text-right max-w-[200px] truncate" style={{ fontFamily: "JetBrains Mono", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{detailModal.user.template || "-"}</span>
              </div>
              <div className="flex justify-between items-center gap-3 py-1.5 text-xs" style={{ borderBottom: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.15)" : "rgba(195,198,216,0.15)"}` }}>
                <span style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("syncedAt")}</span>
                <span className="font-medium" style={{ fontFamily: "JetBrains Mono", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{detailModal.user.synced_at ? formatDate(detailModal.user.synced_at) : "-"}</span>
              </div>
              <div className="flex justify-between items-center gap-3 py-1.5 text-xs">
                <span style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("createdAt")}</span>
                <span className="font-medium" style={{ fontFamily: "JetBrains Mono", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{detailModal.user.created_at ? formatDate(detailModal.user.created_at) : "-"}</span>
              </div>
            </div>
            {detailModal.user.raw_payload && (
              <div className="mt-3">
                <p className="text-[10px] font-medium mb-1" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("rawPayload")}</p>
                <pre className="rounded-lg p-2 text-[10px] overflow-auto max-h-40" style={{ background: "#1a1c1c", fontFamily: "JetBrains Mono", color: "#a6e3a1" }}>{JSON.stringify(detailModal.user.raw_payload, null, 2)}</pre>
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setDetailModal({ open: false, user: null }); setEditModal({ open: true, user: detailModal.user }); setEditForm({ name: detailModal.user!.name, privilege: detailModal.user!.privilege }); }} className="flex-1 py-2 text-xs font-medium rounded-lg" style={{ border: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195,198,216,0.3)"}`, color: "#004ccd" }}>
                <span className="material-symbols-outlined text-[14px] align-middle mr-1">edit</span>{t("edit")}
              </button>
              <button onClick={() => { setDetailModal({ open: false, user: null }); setDeleteModal({ open: true, user: detailModal.user }); }} className="flex-1 py-2 text-xs font-medium rounded-lg" style={{ border: "1px solid rgba(219,14,14,0.2)", color: "#da1e28" }}>{t("delete")}</button>
              <button onClick={() => setDetailModal({ open: false, user: null })} className="flex-1 py-2 text-xs rounded-lg" style={{ color: theme === "dark" ? "#c7c4d7" : "#424656", background: theme === "dark" ? "#292932" : "#f3f3f3" }}>{t("close")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.user && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} onClick={() => setEditModal({ open: false, user: null })}>
          <div className="w-full max-w-md rounded-xl p-4" style={{ background: theme === "dark" ? "#1f1f27" : "#ffffff", border: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195,198,216,0.3)"}` }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold mb-3" style={{ fontFamily: "Hanken Grotesk", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{t("editUser")}</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("pin")}</label>
                <input value={editModal.user.pin} disabled className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195,198,216,0.3)"}`, background: theme === "dark" ? "#292932" : "#f3f3f3", color: theme === "dark" ? "#908fa0" : "#737687", fontFamily: "JetBrains Mono" }} />
              </div>
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("name")}</label>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195,198,216,0.3)"}`, background: theme === "dark" ? "#292932" : "#f3f3f3", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }} placeholder={t("name")} />
              </div>
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("privilege")}</label>
                <select value={editForm.privilege} onChange={(e) => setEditForm({ ...editForm, privilege: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195,198,216,0.3)"}`, background: theme === "dark" ? "#292932" : "#f3f3f3", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>
                  <option value={1}>Normal User</option>
                  <option value={2}>Admin</option>
                  <option value={3}>Super Admin</option>
                </select>
              </div>
              <div className="rounded-lg p-2.5 text-[10px]" style={{ background: theme === "dark" ? "#292932" : "#f3f3f3", color: theme === "dark" ? "#908fa0" : "#737687" }}>
                {t("cloudId")}: <span style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>{editModal.user.cloud_id}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setEditModal({ open: false, user: null })} className="flex-1 py-2 text-xs rounded-lg" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("cancel")}</button>
              <button onClick={handleEdit} disabled={editLoading} className="flex-1 py-2 text-xs font-medium text-white rounded-lg flex items-center justify-center gap-1.5" style={{ background: "#004ccd", opacity: editLoading ? 0.6 : 1 }}>
                {editLoading && <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>}
                {editLoading ? t("loading") : t("save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && deleteModal.user && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} onClick={() => setDeleteModal({ open: false, user: null })}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: theme === "dark" ? "#1f1f27" : "#ffffff", border: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195,198,216,0.3)"}` }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "Hanken Grotesk", color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{t("deleteUser")}</h3>
            <p className="text-sm mb-4" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("deleteUser")} <strong style={{ color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{deleteModal.user.name}</strong> (PIN: {deleteModal.user.pin})?</p>
            <div className="space-y-2">
              <button onClick={() => handleDelete("web")} className="w-full py-3 px-4 rounded-xl text-left" style={{ border: `1px solid ${theme === "dark" ? "rgba(70,69,84,0.3)" : "rgba(195,198,216,0.3)"}` }}>
                <p className="font-medium text-sm" style={{ color: theme === "dark" ? "#e4e1ed" : "#1a1c1c" }}>{t("deleteFromWeb")}</p>
                <p className="text-xs" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("deleteFromWebDesc")}</p>
              </button>
              <button onClick={() => handleDelete("device")} className="w-full py-3 px-4 rounded-xl text-left" style={{ border: "1px solid #da1e28", background: "#fff1f1" }}>
                <p className="font-medium text-sm" style={{ color: "#da1e28" }}>{t("deleteFromDevice")}</p>
                <p className="text-xs" style={{ color: "#da1e28" }}>{t("deleteFromDeviceDesc")}</p>
              </button>
            </div>
            <button onClick={() => setDeleteModal({ open: false, user: null })} className="w-full mt-3 py-2.5 text-sm" style={{ color: theme === "dark" ? "#908fa0" : "#737687" }}>{t("cancel")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
