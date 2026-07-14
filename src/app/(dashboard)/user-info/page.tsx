"use client";

import { useEffect, useState, useCallback } from "react";
import { LgSelect, Pagination } from "@/components/ui/LgComponents";
import { formatDate } from "@/lib/utils";

interface Userinfo {
  id: string;
  cloud_id: string;
  pin: string;
  name: string;
  privilege: number;
  password: string;
  rfid: string;
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
  const [users, setUsers] = useState<Userinfo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [cloudIdFilter, setCloudIdFilter] = useState("");
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
    cloud_id: "C2697842930C1634",
    pin: "",
    name: "",
    privilege: 1,
    password: "",
    rfid: "",
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (search) params.set("search", search);
    if (cloudIdFilter) params.set("cloud_id", cloudIdFilter);

    const res = await fetch(`/api/supabase?table=userinfos&select=id,cloud_id,pin,name,role,privilege,created_at&count=true&order=created_at.desc&${params.toString()}`);
    const data = await res.json();
    setUsers(data.data || []);
    setTotal(data.count || 0);
    setLastPage(data.lastPage || 1);
    setLoading(false);
  }, [page, perPage, search, cloudIdFilter]);

  useEffect(() => {
    loadUsers();
    loadCloudIds();
  }, [loadUsers]);

  useEffect(() => {
    function handleClickOutside() {
      if (actionMenu) setActionMenu(null);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [actionMenu]);

  async function loadCloudIds() {
    const res = await fetch("/api/supabase?table=userinfos&select=cloud_id&limit=5000");
    const data = await res.json();
    const raw: { cloud_id: string }[] = data.data || [];
    const ids = [...new Set(raw.map((r) => r.cloud_id))];
    setAllCloudIds(ids.filter(Boolean) as string[]);
  }

  async function handleDelete(mode: "web" | "device") {
    if (!deleteModal.user) return;
    const { cloud_id, pin } = deleteModal.user;
    try {
      await fetch("/api/user-info/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cloud_id, pin, mode }),
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
        body: JSON.stringify(addForm),
      });
      setAddModal(false);
      setAddForm({ cloud_id: "C2697842930C1634", pin: "", name: "", privilege: 1, password: "", rfid: "" });
      loadUsers();
    } catch (err) {
      console.error("Add error:", err);
    }
  }

  const filteredUsers = privilegeFilter
    ? users.filter((u) => String(u.privilege) === privilegeFilter)
    : users;

  const superAdminCount = users.filter((u) => u.privilege === 3).length;
  const adminCount = users.filter((u) => u.privilege === 2).length;
  const userCount = users.filter((u) => u.privilege <= 1).length;

  const jsonPreview = JSON.stringify(
    { trans_id: "1", cloud_id: addForm.cloud_id, pin: addForm.pin, name: addForm.name, privilege: addForm.privilege, password: addForm.password, rfid: addForm.rfid },
    null, 2
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>User Info</h1>
          <p className="text-sm mt-1" style={{ color: "#737687" }}>Manage biometric user data</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2" style={{ border: "1px solid rgba(195,198,216,0.3)", color: "#424656" }}>
            <span className="material-symbols-outlined text-[18px]">download</span>Export
          </button>
          <button onClick={() => setAddModal(true)} className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 text-white" style={{ background: "#004ccd" }}>
            <span className="material-symbols-outlined text-[18px]">person_add</span>+ Add New User
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: total, icon: "group", bg: "#dbe1ff", iconColor: "#004ccd" },
          { label: "Active Devices", value: allCloudIds.length, icon: "dns", bg: "#defbe6", iconColor: "#006e2b" },
          { label: "New Enrolled", value: users.filter((u) => { const d = new Date(u.created_at); return new Date().getTime() - d.getTime() < 86400000; }).length, icon: "person_add", bg: "#fff1f1", iconColor: "#da1e28" },
          { label: "Data Health", value: "99.2%", icon: "verified", bg: "#dbe1ff", iconColor: "#004ccd" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider" style={{ fontFamily: "JetBrains Mono", color: "#737687", letterSpacing: "0.05em" }}>{stat.label}</p>
                <p className="text-3xl font-bold mt-2" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>{stat.value}</p>
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
          <div className="rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center mb-4" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
            <LgSelect
              id="privilegeFilter"
              options={[
                { value: "", label: "All Privileges", icon: "admin_panel_settings" },
                { value: "3", label: "Super Admin", icon: "shield" },
                { value: "2", label: "Admin", icon: "admin_panel_settings" },
                { value: "1", label: "Normal User", icon: "person" },
              ]}
              value={privilegeFilter}
              onChange={(v) => { setPrivilegeFilter(v); setPage(1); }}
              placeholder="All Privileges"
              icon="filter_list"
            />
            <LgSelect
              id="cloudIdFilter"
              options={allCloudIds.map((id) => ({ value: id, label: id, icon: "cloud" }))}
              value={cloudIdFilter}
              onChange={(v) => { setCloudIdFilter(v); setPage(1); }}
              placeholder="All Devices"
              icon="dns"
            />
            <div className="flex-1" />
            <input
              type="text"
              placeholder="Search PIN, name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 min-w-0 px-4 py-2 rounded-xl text-sm"
              style={{ background: "#f3f3f3", border: "1px solid rgba(195,198,216,0.3)", color: "#1a1c1c" }}
            />
          </div>

          {/* Table */}
          <div className="rounded-2xl" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
            <div className="hidden md:block overflow-x-auto rounded-t-2xl">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(195,198,216,0.2)" }}>
                    {["PIN", "User Name", "Privilege", "Assigned Device", "Created At", "Actions"].map((h) => (
                      <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-8" style={{ color: "#737687" }}>
                      <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>Loading...
                    </td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8" style={{ color: "#737687" }}>No data found</td></tr>
                  ) : (
                    filteredUsers.map((user, i) => {
                      const priv = getPrivilegeInfo(user.privilege);
                      return (
                        <tr key={user.id} style={{ borderBottom: "1px solid rgba(195,198,216,0.1)", background: i % 2 === 0 ? "transparent" : "rgba(243,243,243,0.3)" }}>
                          <td className="py-3 px-3 font-medium" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>{user.pin}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: "#004ccd" }}>{getInitials(user.name)}</div>
                              <span style={{ color: "#1a1c1c" }}>{user.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide" style={{ background: priv.bg, color: priv.color }}>{priv.label}</span>
                          </td>
                          <td className="py-3 px-3" style={{ color: "#737687" }}>{user.cloud_id}</td>
                          <td className="py-3 px-3 text-xs" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{user.created_at ? formatDate(user.created_at) : "-"}</td>
                          <td className="py-3 px-3 relative">
                            <button onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === user.id ? null : user.id); }} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: "#737687" }}>
                              <span className="material-symbols-outlined text-[20px]">more_vert</span>
                            </button>
                            {actionMenu === user.id && (
                              <div className="absolute right-0 top-full mt-1 z-50 rounded-xl py-1 min-w-[160px] shadow-lg" style={{ background: "#ffffff", border: "1px solid rgba(195,198,216,0.3)" }} onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => setActionMenu(null)} className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-[#f3f3f3]" style={{ color: "#1a1c1c" }}>
                                  <span className="material-symbols-outlined text-[16px]">edit</span>Edit
                                </button>
                                <button onClick={() => { setActionMenu(null); setDeleteModal({ open: true, user }); }} className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-[#f3f3f3]" style={{ color: "#da1e28" }}>
                                  <span className="material-symbols-outlined text-[16px]">delete</span>Delete
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
                <div className="text-center py-8" style={{ color: "#737687" }}>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8" style={{ color: "#737687" }}>No data found</div>
              ) : (
                filteredUsers.map((user) => {
                  const priv = getPrivilegeInfo(user.privilege);
                  return (
                    <div key={user.id} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(195,198,216,0.15)" }} onClick={() => setDetailModal({ open: true, user })}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: "#004ccd" }}>{getInitials(user.name)}</div>
                          <div>
                            <span className="font-medium text-xs block" style={{ color: "#1a1c1c" }}>{user.name}</span>
                            <span className="text-[10px]" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>{user.pin}</span>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: priv.bg, color: priv.color }}>{priv.label}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]" style={{ color: "#737687" }}>
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
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
            <h3 className="text-sm font-bold mb-4" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Privilege Summary</h3>
            <div className="space-y-3">
              {[
                { label: "Super Admin", count: superAdminCount, color: "#006e2b" },
                { label: "Managers", count: adminCount, color: "#004ccd" },
                { label: "General Staff", count: userCount, color: "#da1e28" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-sm" style={{ color: "#737687" }}>{item.label}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>{item.count}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3" style={{ borderTop: "1px solid rgba(195,198,216,0.2)" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "#737687" }}>Total</span>
                <span className="text-sm font-bold" style={{ fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>{total}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
            <h3 className="text-sm font-bold mb-4" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Device Sync Efficiency</h3>
            <div className="space-y-4">
              {[
                { label: "Avg Sync Speed", value: "2.4s", pct: 85, color: "#006e2b" },
                { label: "Avg Size", value: "128 KB", pct: 62, color: "#004ccd" },
                { label: "Network Load", value: "34%", pct: 34, color: "#da1e28" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs" style={{ color: "#737687" }}>{item.label}</p>
                  <p className="text-lg font-bold mt-1" style={{ fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>{item.value}</p>
                  <div className="w-full h-1.5 rounded-full mt-2" style={{ background: "#f3f3f3" }}>
                    <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {addModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} onClick={() => setAddModal(false)}>
          <div className="w-full max-w-xl rounded-2xl p-6" style={{ background: "#ffffff", border: "1px solid rgba(195,198,216,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Add New User</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#737687" }}>Cloud ID</label>
                <input value={addForm.cloud_id} onChange={(e) => setAddForm({ ...addForm, cloud_id: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#737687" }}>PIN</label>
                <input value={addForm.pin} onChange={(e) => setAddForm({ ...addForm, pin: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", fontFamily: "JetBrains Mono", color: "#004ccd" }} placeholder="123" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: "#737687" }}>Name</label>
                <input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }} placeholder="User Name" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#737687" }}>Privilege</label>
                <LgSelect id="privilegeSelect" options={[{ value: "1", label: "Normal User", icon: "person", color: "blue" }, { value: "2", label: "Admin", icon: "admin_panel_settings", color: "purple" }, { value: "3", label: "Super Admin", icon: "shield", color: "green" }]} value={String(addForm.privilege)} onChange={(v) => setAddForm({ ...addForm, privilege: Number(v) })} placeholder="Select Privilege" icon="admin_panel_settings" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#737687" }}>RFID</label>
                <input value={addForm.rfid} onChange={(e) => setAddForm({ ...addForm, rfid: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }} placeholder="Optional" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium mb-1" style={{ color: "#737687" }}>JSON Preview</p>
              <pre className="rounded-xl p-3 text-xs overflow-auto max-h-32" style={{ background: "#1a1c1c", fontFamily: "JetBrains Mono", color: "#a6e3a1" }}>{jsonPreview}</pre>
            </div>
            <div className="flex gap-2 mt-4">
              <a href={`/api-tester?command=set_userinfo&cloud_id=${addForm.cloud_id}&pin=${addForm.pin}`} className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2" style={{ border: "1px solid rgba(195,198,216,0.3)", color: "#424656" }}>
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>API Tester
              </a>
              <div className="flex-1" />
              <button onClick={() => setAddModal(false)} className="px-4 py-2.5 rounded-xl text-sm" style={{ color: "#737687" }}>Cancel</button>
              <button onClick={handleAdd} className="px-6 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: "#004ccd" }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal.open && detailModal.user && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} onClick={() => setDetailModal({ open: false, user: null })}>
          <div className="w-full max-w-md rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid rgba(195,198,216,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold mb-3" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Detail User</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center gap-3 py-1.5 text-xs" style={{ borderBottom: "1px solid rgba(195,198,216,0.15)" }}>
                <span style={{ color: "#737687" }}>PIN</span>
                <span className="font-medium" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>{detailModal.user.pin}</span>
              </div>
              <div className="flex justify-between items-center gap-3 py-1.5 text-xs" style={{ borderBottom: "1px solid rgba(195,198,216,0.15)" }}>
                <span style={{ color: "#737687" }}>Nama</span>
                <span className="font-medium" style={{ color: "#1a1c1c" }}>{detailModal.user.name}</span>
              </div>
              <div className="flex justify-between items-center gap-3 py-1.5 text-xs" style={{ borderBottom: "1px solid rgba(195,198,216,0.15)" }}>
                <span style={{ color: "#737687" }}>Privilege</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: getPrivilegeInfo(detailModal.user.privilege).bg, color: getPrivilegeInfo(detailModal.user.privilege).color }}>{getPrivilegeInfo(detailModal.user.privilege).label}</span>
              </div>
              <div className="flex justify-between items-center gap-3 py-1.5 text-xs" style={{ borderBottom: "1px solid rgba(195,198,216,0.15)" }}>
                <span style={{ color: "#737687" }}>Cloud ID</span>
                <span className="font-medium" style={{ fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>{detailModal.user.cloud_id}</span>
              </div>
              <div className="flex justify-between items-center gap-3 py-1.5 text-xs" style={{ borderBottom: "1px solid rgba(195,198,216,0.15)" }}>
                <span style={{ color: "#737687" }}>Password</span>
                <span className="font-medium" style={{ fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>{detailModal.user.password || "-"}</span>
              </div>
              <div className="flex justify-between items-center gap-3 py-1.5 text-xs" style={{ borderBottom: "1px solid rgba(195,198,216,0.15)" }}>
                <span style={{ color: "#737687" }}>RFID</span>
                <span className="font-medium" style={{ fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>{detailModal.user.rfid || "-"}</span>
              </div>
              <div className="flex justify-between items-center gap-3 py-1.5 text-xs">
                <span style={{ color: "#737687" }}>Created At</span>
                <span className="font-medium" style={{ fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>{detailModal.user.created_at ? formatDate(detailModal.user.created_at) : "-"}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setDetailModal({ open: false, user: null }); setDeleteModal({ open: true, user: detailModal.user }); }} className="flex-1 py-2 text-xs font-medium rounded-lg" style={{ border: "1px solid rgba(219,14,14,0.2)", color: "#da1e28" }}>Delete</button>
              <button onClick={() => setDetailModal({ open: false, user: null })} className="flex-1 py-2 text-xs rounded-lg" style={{ color: "#424656", background: "#f3f3f3" }}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && deleteModal.user && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} onClick={() => setDeleteModal({ open: false, user: null })}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "#ffffff", border: "1px solid rgba(195,198,216,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Delete User</h3>
            <p className="text-sm mb-4" style={{ color: "#737687" }}>Delete user <strong style={{ color: "#1a1c1c" }}>{deleteModal.user.name}</strong> (PIN: {deleteModal.user.pin})?</p>
            <div className="space-y-2">
              <button onClick={() => handleDelete("web")} className="w-full py-3 px-4 rounded-xl text-left" style={{ border: "1px solid rgba(195,198,216,0.3)" }}>
                <p className="font-medium text-sm" style={{ color: "#1a1c1c" }}>Delete from Web only</p>
                <p className="text-xs" style={{ color: "#737687" }}>Remove from Supabase database</p>
              </button>
              <button onClick={() => handleDelete("device")} className="w-full py-3 px-4 rounded-xl text-left" style={{ border: "1px solid #da1e28", background: "#fff1f1" }}>
                <p className="font-medium text-sm" style={{ color: "#da1e28" }}>Delete from Web + Device</p>
                <p className="text-xs" style={{ color: "#da1e28" }}>Remove from Supabase + send command to device</p>
              </button>
            </div>
            <button onClick={() => setDeleteModal({ open: false, user: null })} className="w-full mt-3 py-2.5 text-sm" style={{ color: "#737687" }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
