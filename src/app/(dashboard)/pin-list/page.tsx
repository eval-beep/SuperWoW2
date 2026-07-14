"use client";

import { useEffect, useState, useCallback } from "react";

interface DeviceUser {
  id: string;
  cloud_id: string;
  pin: string;
  name: string | null;
  role: string | null;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  user: "User",
  enroller: "Enroller",
};

export default function PinListPage() {
  const [users, setUsers] = useState<DeviceUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState<{ open: boolean; user: DeviceUser | null }>({ open: false, user: null });
  const [newForm, setNewForm] = useState({ pin: "", name: "", role: "user" });
  const [editForm, setEditForm] = useState({ name: "", role: "user" });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: "15" });
    if (search) params.set("search", search);
    const res = await fetch(`/api/supabase?table=device_users&select=*&${params.toString()}`);
    const data = await res.json();
    setUsers(data.data || []);
    setTotal(data.count || 0);
    setLastPage(data.lastPage || 1);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function handleAdd() {
    if (!newForm.pin.trim()) return alert("PIN harus diisi");
    const params = { trans_id: "1", cloud_id: "", pin: newForm.pin, name: newForm.name, role: newForm.role };
    const res = await fetch("/api/fingerspot/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: "set_userinfo", params, logToHistory: true }),
    });
    const data = await res.json();
    if (data.success) {
      setAddModal(false);
      setNewForm({ pin: "", name: "", role: "user" });
      loadUsers();
    }
  }

  async function handleEdit() {
    if (!editModal.user) return;
    const params = { trans_id: "1", cloud_id: "", pin: editModal.user.pin, name: editForm.name, role: editForm.role };
    const res = await fetch("/api/fingerspot/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: "set_userinfo", params, logToHistory: true }),
    });
    const data = await res.json();
    if (data.success) {
      setEditModal({ open: false, user: null });
      loadUsers();
    }
  }

  async function handleDelete(user: DeviceUser) {
    if (!confirm(`Hapus PIN ${user.pin}?`)) return;
    await fetch("/api/fingerspot/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: "delete_user", params: { trans_id: "1", cloud_id: "", pin: user.pin }, logToHistory: true }),
    });
    loadUsers();
  }

  async function handleRefresh() {
    const params = new URLSearchParams({ page: "1", per_page: "15" });
    if (search) params.set("search", search);
    await fetch("/api/supabase?table=device_users&select=*&${params.toString()}", { method: "GET" });
    loadUsers();
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Daftar PIN</h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: "#737687" }}>Kelola PIN karyawan pada mesin fingerprint</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2" style={{ border: "1px solid rgba(195,198,216,0.3)", color: "#424656" }}>
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">refresh</span>Refresh
          </button>
          <button onClick={() => setAddModal(true)} className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 text-white" style={{ background: "#004ccd" }}>
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">add</span>Tambah PIN
          </button>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: "600px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(195,198,216,0.2)" }}>
                {["PIN", "Nama", "Role", "Aksi"].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8" style={{ color: "#737687" }}><span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>Memuat...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8" style={{ color: "#737687" }}>Tidak ada data PIN</td></tr>
              ) : (
                users.map((user, i) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid rgba(195,198,216,0.1)", background: i % 2 === 0 ? "transparent" : "rgba(243,243,243,0.3)" }}>
                    <td className="py-3 px-3 font-medium whitespace-nowrap" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>{user.pin}</td>
                    <td className="py-3 px-3 whitespace-nowrap" style={{ color: "#1a1c1c" }}>{user.name || "-"}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style={{ background: "#dbe1ff", color: "#004ccd" }}>
                        {ROLE_LABELS[user.role || "user"]}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditModal({ open: true, user }); setEditForm({ name: user.name || "", role: user.role || "user" }); }} className="w-8 h-8 inline-flex items-center justify-center rounded-lg transition-colors hover:bg-[#dbe1ff]" title="Edit">
                          <span className="material-symbols-outlined text-[18px]" style={{ color: "#004ccd" }}>edit</span>
                        </button>
                        <button onClick={() => handleDelete(user)} className="w-8 h-8 inline-flex items-center justify-center rounded-lg transition-colors hover:bg-[#ffeded]" title="Hapus">
                          <span className="material-symbols-outlined text-[18px]" style={{ color: "#da1e28" }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 gap-2" style={{ borderTop: "1px solid rgba(195,198,216,0.2)" }}>
          <span className="text-xs sm:text-sm whitespace-nowrap" style={{ color: "#737687" }}>{Math.min((page - 1) * 15 + 1, total)}-{Math.min(page * 15, total)} dari {total.toLocaleString()}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40 hover:bg-[#f3f3f3]">&laquo;</button>
            {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page + i - 2;
              if (p < 1 || p > lastPage) return null;
              return <button key={p} onClick={() => setPage(p)} className="w-8 h-8 rounded-lg text-sm transition-colors" style={p === page ? { background: "#004ccd", color: "#ffffff" } : { color: "#424656" }}>{p}</button>;
            })}
            <button onClick={() => setPage(Math.min(lastPage, page + 1))} disabled={page === lastPage} className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40 hover:bg-[#f3f3f3]">&raquo;</button>
          </div>
        </div>
      </div>

      {addModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} onClick={() => setAddModal(false)}>
          <div className="w-full max-w-lg rounded-2xl p-5 sm:p-6" style={{ background: "#ffffff", border: "1px solid rgba(195,198,216,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Tambah PIN</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#737687" }}>PIN</label>
                <input value={newForm.pin} onChange={(e) => setNewForm({ ...newForm, pin: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#737687" }}>Nama</label>
                <input value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#737687" }}>Role</label>
                <select value={newForm.role} onChange={(e) => setNewForm({ ...newForm, role: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }}>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                  <option value="enroller">Enroller</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button onClick={() => setAddModal(false)} className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm" style={{ color: "#737687" }}>Batal</button>
              <button onClick={handleAdd} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: "#004ccd" }}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {editModal.open && editModal.user && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} onClick={() => setEditModal({ open: false, user: null })}>
          <div className="w-full max-w-lg rounded-2xl p-5 sm:p-6" style={{ background: "#ffffff", border: "1px solid rgba(195,198,216,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Edit PIN</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#737687" }}>PIN</label>
                <input value={editModal.user.pin} disabled className="w-full px-3 py-2 rounded-xl text-sm" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#737687" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#737687" }}>Nama</label>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#737687" }}>Role</label>
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }}>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                  <option value="enroller">Enroller</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button onClick={() => setEditModal({ open: false, user: null })} className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm" style={{ color: "#737687" }}>Batal</button>
              <button onClick={handleEdit} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: "#004ccd" }}>Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
