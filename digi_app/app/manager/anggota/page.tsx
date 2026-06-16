"use client";

import React, { useEffect, useState } from "react";
import { UserPlus, Loader2, Check, X, Search, ChevronDown, Users, Edit2, Briefcase } from "lucide-react";

type Proyek = { id: number; nama: string; status: string };
type Member = {
  id: number;
  nama: string;
  email: string;
  role: string;
  divisi: string | null;
  proyek: { id: number; nama: string; status: string; roleInProyek: string }[];
};

const ROLES = ["Karyawan", "Tim Keuangan", "Direktur / Manajemen"];

const ROLE_BADGE: Record<string, string> = {
  "Karyawan": "bg-stone-100 text-stone-600",
  "Project Manager": "bg-blue-50 text-blue-700",
  "Tim Keuangan": "bg-emerald-50 text-emerald-700",
  "Direktur / Manajemen": "bg-purple-50 text-purple-700",
};

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-purple-100 text-purple-700",
  "bg-rose-100 text-rose-700",
];

export default function AnggotaPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [proyekList, setProyekList] = useState<Proyek[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("Semua");
  const [selectedProyekAssignments, setSelectedProyekAssignments] = useState<{ proyekId: number; role: string }[]>([]);

  const [form, setForm] = useState({
    nama: "",
    email: "",
    password: "",
    userRole: "Karyawan",
    divisi: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersRes, proyekRes] = await Promise.all([
        fetch("/api/manager/members"),
        fetch("/api/manager/proyek"),
      ]);
      const [membersData, proyekData] = await Promise.all([membersRes.json(), proyekRes.json()]);
      setMembers(membersData.members ?? []);
      setProyekList(proyekData.proyek ?? []);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStartAdd = () => {
    setEditingMember(null);
    setForm({ nama: "", email: "", password: "", userRole: "Karyawan", divisi: "" });
    setSelectedProyekAssignments([]);
    setShowForm(true);
    setFormError("");
    setSuccess("");
  };

  const handleStartEdit = (m: Member) => {
    setEditingMember(m);
    setForm({
      nama: m.nama,
      email: m.email,
      password: "", // Not required for edit
      userRole: m.role,
      divisi: m.divisi || "",
    });
    setSelectedProyekAssignments(m.proyek.map((p) => ({
      proyekId: p.id,
      role: p.roleInProyek || (m.role === 'Project Manager' ? 'Project Manager' : 'Anggota Lapangan'),
    })));
    setShowForm(true);
    setFormError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const url = "/api/manager/members";
      const method = editingMember ? "PUT" : "POST";
      const payload = editingMember
        ? {
            userId: editingMember.id,
            nama: form.nama,
            email: form.email,
            userRole: form.userRole,
            divisi: form.divisi,
            proyekAssignments: selectedProyekAssignments,
          }
        : {
            nama: form.nama,
            email: form.email,
            password: form.password,
            userRole: form.userRole,
            divisi: form.divisi,
            proyekAssignments: selectedProyekAssignments,
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || `Gagal ${editingMember ? "memperbarui" : "mendaftarkan"} anggota`);
        return;
      }

      setSuccess(`Data anggota "${form.nama}" berhasil ${editingMember ? "diperbarui" : "didaftarkan"}!`);
      setForm({ nama: "", email: "", password: "", userRole: "Karyawan", divisi: "" });
      setSelectedProyekAssignments([]);
      setShowForm(false);
      setEditingMember(null);
      fetchData();
    } catch {
      setFormError("Terjadi kesalahan koneksi");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const matchSearch =
      m.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = filterRole === "Semua" || m.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 leading-tight">Registrasi Anggota</h1>
          <p className="text-sm text-stone-500 mt-1">
            Kelola akun tim. Daftarkan karyawan, Project Manager, dan Tim Keuangan ke sistem, serta atur penugasan proyek mereka.
          </p>
        </div>
        <button
          onClick={handleStartAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2d6a4f] hover:bg-[#1e5038] text-white text-[13px] font-bold rounded-xl shadow-sm transition cursor-pointer whitespace-nowrap"
        >
          <UserPlus size={16} />
          Tambah Anggota
        </button>
      </div>

      {/* Success Banner */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in">
          <Check size={16} />
          {success}
        </div>
      )}

      {/* Registration / Edit Form */}
      {showForm && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden animate-slide-down">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
            <h3 className="font-bold text-[15px] text-stone-900">
              {editingMember ? `Edit Anggota: ${editingMember.nama}` : "Daftarkan Anggota Baru"}
            </h3>
            <button
              onClick={() => { setShowForm(false); setEditingMember(null); }}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Nama */}
              <div>
                <label className="block text-[12px] font-bold text-stone-600 mb-1.5">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Budi Santoso"
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition bg-white"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[12px] font-bold text-stone-600 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="budi@perusahaan.com"
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition bg-white"
                />
              </div>

              {/* Password - Only show when registering new member */}
              {!editingMember && (
                <div>
                  <label className="block text-[12px] font-bold text-stone-600 mb-1.5">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min. 8 karakter"
                    minLength={8}
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition bg-white"
                  />
                </div>
              )}

              {/* Role */}
              <div>
                <label className="block text-[12px] font-bold text-stone-600 mb-1.5">
                  Role <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={form.userRole}
                    onChange={(e) => setForm({ ...form, userRole: e.target.value })}
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] text-stone-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition bg-white pr-10"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                </div>
              </div>

              {/* Divisi */}
              <div>
                <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Divisi / Jabatan</label>
                <input
                  type="text"
                  value={form.divisi}
                  onChange={(e) => setForm({ ...form, divisi: e.target.value })}
                  placeholder="Contoh: Operasional Lapangan"
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition bg-white"
                />
              </div>

              {/* Proyek Checkboxes Multi-select */}
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-bold text-stone-600 mb-2">
                  Assign ke Proyek (Dapat memilih banyak proyek)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-50/50 border border-stone-200/60 rounded-xl p-4 max-h-[200px] overflow-y-auto">
                  {proyekList.map((p) => {
                    const isChecked = selectedProyekAssignments.some((a) => a.proyekId === p.id);
                    return (
                      <div 
                        key={p.id} 
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition select-none text-[12px] ${
                          isChecked 
                            ? "bg-emerald-50/60 border-emerald-200 text-emerald-850" 
                            : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                        }`}
                      >
                        <label className="flex items-start gap-2.5 cursor-pointer min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProyekAssignments([...selectedProyekAssignments, {
                                  proyekId: p.id,
                                  role: form.userRole === 'Project Manager' ? 'Project Manager' : 'Anggota Lapangan'
                                }]);
                              } else {
                                setSelectedProyekAssignments(selectedProyekAssignments.filter((a) => a.proyekId !== p.id));
                              }
                            }}
                            className="mt-0.5 accent-[#2d6a4f]"
                          />
                          <div className="min-w-0">
                            <p className="font-bold truncate leading-tight">{p.nama}</p>
                            <span className={`text-[10px] ${isChecked ? "text-emerald-600" : "text-stone-400"}`}>{p.status}</span>
                          </div>
                        </label>

                        {isChecked && (
                          <div className="ml-2">
                            <select
                              value={selectedProyekAssignments.find((a) => a.proyekId === p.id)?.role || 'Anggota Lapangan'}
                              onChange={(e) => {
                                setSelectedProyekAssignments(
                                  selectedProyekAssignments.map((a) =>
                                    a.proyekId === p.id ? { ...a, role: e.target.value } : a
                                  )
                                );
                              }}
                              className="border border-stone-200 rounded-lg px-1.5 py-0.5 text-[10px] font-semibold text-stone-600 bg-white cursor-pointer focus:outline-none"
                            >
                              <option value="Anggota Lapangan">Anggota Lapangan</option>
                              <option value="Project Manager">Project Manager</option>
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {proyekList.length === 0 && (
                    <span className="text-[12px] text-stone-400 italic">Belum ada proyek terdaftar.</span>
                  )}
                </div>
              </div>
            </div>

            {formError && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[12px] font-medium flex items-center gap-2">
                <X size={14} />
                {formError}
              </div>
            )}

            <div className="flex gap-3 mt-6 border-t border-stone-105 pt-4">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingMember(null); }}
                className="px-5 py-2.5 border border-stone-200 rounded-xl text-[13px] font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#2d6a4f] hover:bg-[#1e5038] disabled:opacity-60 text-white text-[13px] font-bold rounded-xl transition cursor-pointer shadow-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {editingMember ? "Menyimpan..." : "Mendaftarkan..."}
                  </>
                ) : (
                  <>
                    {editingMember ? <Edit2 size={14} /> : <UserPlus size={14} />}
                    {editingMember ? "Simpan Perubahan" : "Daftarkan Anggota"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-stone-100 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-stone-50/20">
          <div className="flex items-center gap-2 bg-stone-100 rounded-xl px-3 py-2 flex-1">
            <Search size={14} className="text-stone-400 shrink-0" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-[13px] text-stone-700 placeholder-stone-400 focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="border border-stone-200 rounded-xl px-3 py-2 text-[12px] font-semibold text-stone-600 appearance-none pr-7 focus:outline-none bg-white cursor-pointer"
              >
                <option>Semua</option>
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            </div>

            <div className="flex items-center gap-1.5 text-[12px] text-stone-455 font-medium whitespace-nowrap bg-stone-100 px-3 py-2 rounded-xl">
              <Users size={14} className="text-stone-500" />
              <span className="text-stone-700">{filteredMembers.length} anggota</span>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-stone-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Memuat data anggota...</span>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-16 text-stone-400 text-sm">
            {searchQuery || filterRole !== "Semua"
              ? "Tidak ada anggota yang sesuai filter."
              : "Belum ada anggota terdaftar."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[11px] text-stone-400 font-bold uppercase tracking-wide border-b border-stone-150 bg-stone-50/50">
                  <th className="text-left px-5 py-3">Anggota</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Divisi</th>
                  <th className="text-left px-4 py-3">Proyek ({proyekList.length} total)</th>
                  <th className="text-right px-5 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredMembers.map((m, i) => (
                  <tr key={m.id} className="hover:bg-stone-50/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                          {getInitials(m.nama)}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-stone-900 leading-tight">{m.nama}</p>
                          <p className="text-[11px] text-stone-400 font-mono">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-lg ${ROLE_BADGE[m.role] || "bg-stone-100 text-stone-600"}`}>
                        {m.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-stone-500">{m.divisi || "—"}</td>
                    <td className="px-4 py-3.5">
                      {m.proyek.length === 0 ? (
                        <span className="text-[11px] text-stone-300 font-semibold italic">Tidak ada proyek</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-w-[450px]">
                          {m.proyek.map((p) => (
                            <div
                              key={p.id}
                              className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md font-semibold font-sans"
                            >
                              <Briefcase size={10} className="text-emerald-600" />
                              <span>{p.nama} ({p.roleInProyek === 'Anggota Lapangan' ? 'Karyawan' : 'PM'})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleStartEdit(m)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-[#e8f4ef] hover:text-[#2d6a4f] text-stone-600 text-[11px] font-bold rounded-lg transition cursor-pointer"
                      >
                        <Edit2 size={11} />
                        Atur Proyek & Info
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
