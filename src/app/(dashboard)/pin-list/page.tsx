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
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState<{ open: boolean; user: DeviceUser | null }>({ open: false, user: null });
  const [newForm, setNewForm] = useState({ pin: "", name: "", role: "user" });
  const [editForm, setEditForm] = useState({ name: "", role: "user" });

  const [detailModal, setDetailModal] = useState<{ open: boolean; user: DeviceUser | null }>({ open: false, user: null });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/supabase?table=userinfos&select=*&order=created_at.desc&count=true");
      const result = await res.json();
      const raw: Record<string, unknown>[] = result.data || [];
      setUsers(raw.map((u, idx) => ({
        id: String(u.id || u.pin || idx),
        cloud_id: String(u.cloud_id || ""),
        pin: String(u.pin || ""),
        name: (u.name as string) || null,
        role: (u.role as string) || "user",
        created_at: String(u.created_at || ""),
      })));
    } catch {
      setUsers([]);
    }
    setLoading(false);
  }, []);

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

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Daftar PIN</h1>
          <p className="text-xs mt-0.5" style={{ color: "#737687" }}>Kelola PIN karyawan</p>
        </div>
        <button onClick={() => setAddModal(true)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white" style={{ background: "#004ccd" }}>
          <span className="material-symbols-outlined text-sm">add</span>Tambah PIN
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
          <span className="material-symbols-outlined animate-spin text-2xl" style={{ color: "#004ccd" }}>progress_activity</span>
          <p className="text-xs mt-2" style={{ color: "#737687" }}>Memuat data...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
          <span className="material-symbols-outlined text-3xl" style={{ color: "#c3c6d8" }}>inbox</span>
          <p className="text-xs mt-2" style={{ color: "#737687" }}>Tidak ada data PIN</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(195,198,216,0.2)" }}>
                  {["PIN", "Nama", "Role", "Aksi"].map((h) => (
                    <th key={h} className="text-left py-2.5 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ fontFamily: "JetBrains Mono", color: "#737687" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                    <tr key={user.id} className="cursor-pointer" onClick={() => setDetailModal({ open: true, user })} style={{ borderBottom: "1px solid rgba(195,198,216,0.1)", background: i % 2 === 0 ? "transparent" : "rgba(243,243,243,0.3)" }}>
                    <td className="py-2.5 px-3 font-medium" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>{user.pin}</td>
                    <td className="py-2.5 px-3" style={{ color: "#1a1c1c" }}>{user.name || "-"}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "#dbe1ff", color: "#004ccd" }}>{ROLE_LABELS[user.role || "user"]}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => { setEditModal({ open: true, user }); setEditForm({ name: user.name || "", role: user.role || "user" }); }} className="w-7 h-7 inline-flex items-center justify-center rounded-lg hover:bg-[#dbe1ff]">
                          <span className="material-symbols-outlined text-sm" style={{ color: "#004ccd" }}>edit</span>
                        </button>
                        <button onClick={() => handleDelete(user)} className="w-7 h-7 inline-flex items-center justify-center rounded-lg hover:bg-[#ffeded]">
                          <span className="material-symbols-outlined text-sm" style={{ color: "#da1e28" }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {users.map((user) => (
              <div key={user.id} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.3)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>{user.pin}</span>
                    <span className="text-[11px]" style={{ color: "#1a1c1c" }}>{user.name || "-"}</span>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "#dbe1ff", color: "#004ccd" }}>{ROLE_LABELS[user.role || "user"]}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditModal({ open: true, user }); setEditForm({ name: user.name || "", role: user.role || "user" }); }} className="flex-1 py-1.5 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1" style={{ border: "1px solid rgba(195,198,216,0.3)", color: "#004ccd" }}>
                    <span className="material-symbols-outlined text-xs">edit</span>Edit
                  </button>
                  <button onClick={() => handleDelete(user)} className="flex-1 py-1.5 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1" style={{ border: "1px solid rgba(219,14,14,0.2)", color: "#da1e28" }}>
                    <span className="material-symbols-outlined text-xs">delete</span>Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {addModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} onClick={() => setAddModal(false)}>
          <div className="w-full max-w-md rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid rgba(195,198,216,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold mb-3" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Tambah PIN</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>PIN</label>
                <input value={newForm.pin} onChange={(e) => setNewForm({ ...newForm, pin: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }} />
              </div>
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>Nama</label>
                <input value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }} />
              </div>
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>Role</label>
                <select value={newForm.role} onChange={(e) => setNewForm({ ...newForm, role: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }}>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                  <option value="enroller">Enroller</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setAddModal(false)} className="flex-1 py-2 text-xs rounded-lg" style={{ color: "#737687" }}>Batal</button>
              <button onClick={handleAdd} className="flex-1 py-2 text-xs font-medium text-white rounded-lg" style={{ background: "#004ccd" }}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {detailModal.open && detailModal.user && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} onClick={() => setDetailModal({ open: false, user: null })}>
          <div className="w-full max-w-md rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid rgba(195,198,216,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold mb-3" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Detail PIN</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center gap-3 py-1.5 text-xs" style={{ borderBottom: "1px solid rgba(195,198,216,0.15)" }}>
                <span style={{ color: "#737687" }}>PIN</span>
                <span className="font-medium" style={{ fontFamily: "JetBrains Mono", color: "#004ccd" }}>{detailModal.user.pin}</span>
              </div>
              <div className="flex justify-between items-center gap-3 py-1.5 text-xs" style={{ borderBottom: "1px solid rgba(195,198,216,0.15)" }}>
                <span style={{ color: "#737687" }}>Nama</span>
                <span className="font-medium" style={{ color: "#1a1c1c" }}>{detailModal.user.name || "-"}</span>
              </div>
              <div className="flex justify-between items-center gap-3 py-1.5 text-xs" style={{ borderBottom: "1px solid rgba(195,198,216,0.15)" }}>
                <span style={{ color: "#737687" }}>Role</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "#dbe1ff", color: "#004ccd" }}>{ROLE_LABELS[detailModal.user.role || "user"]}</span>
              </div>
              <div className="flex justify-between items-center gap-3 py-1.5 text-xs" style={{ borderBottom: "1px solid rgba(195,198,216,0.15)" }}>
                <span style={{ color: "#737687" }}>Cloud ID</span>
                <span className="font-medium" style={{ fontFamily: "JetBrains Mono", color: "#1a1c1c" }}>{detailModal.user.cloud_id || "-"}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setDetailModal({ open: false, user: null }); setEditModal({ open: true, user: detailModal.user }); setEditForm({ name: detailModal.user!.name || "", role: detailModal.user!.role || "user" }); }} className="flex-1 py-2 text-xs font-medium rounded-lg" style={{ border: "1px solid rgba(195,198,216,0.3)", color: "#004ccd" }}>Edit</button>
              <button onClick={() => setDetailModal({ open: false, user: null })} className="flex-1 py-2 text-xs rounded-lg" style={{ color: "#424656", background: "#f3f3f3" }}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {editModal.open && editModal.user && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} onClick={() => setEditModal({ open: false, user: null })}>
          <div className="w-full max-w-md rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid rgba(195,198,216,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold mb-3" style={{ fontFamily: "Hanken Grotesk", color: "#1a1c1c" }}>Edit PIN</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>PIN</label>
                <input value={editModal.user.pin} disabled className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#737687" }} />
              </div>
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>Nama</label>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }} />
              </div>
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: "#737687" }}>Role</label>
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid rgba(195,198,216,0.3)", background: "#f3f3f3", color: "#1a1c1c" }}>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                  <option value="enroller">Enroller</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setEditModal({ open: false, user: null })} className="flex-1 py-2 text-xs rounded-lg" style={{ color: "#737687" }}>Batal</button>
              <button onClick={handleEdit} className="flex-1 py-2 text-xs font-medium text-white rounded-lg" style={{ background: "#004ccd" }}>Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
