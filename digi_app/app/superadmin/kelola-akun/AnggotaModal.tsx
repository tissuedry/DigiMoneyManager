"use client";

import React, { useRef } from "react";
import { X, Loader2, UserPlus, Edit2, ChevronDown, Trash2 } from "lucide-react";

type Proyek = { id: number; nama: string; status: string };
type Member = {
  id: number;
  nama: string;
  email: string;
  role: string;
  divisi: string | null;
  proyek: { id: number; nama: string; status: string; roleInProyek: string }[];
};

const ROLES = ["Karyawan", "Project Manager", "Tim Keuangan", "Direktur / Manajemen"];

type AnggotaModalProps = {
  isOpen: boolean;
  onClose: () => void;
  editingMember: Member | null;
  form: {
    nama: string;
    email: string;
    password: string;
    userRole: string;
    divisi: string;
  };
  setForm: React.Dispatch<React.SetStateAction<{
    nama: string;
    email: string;
    password: string;
    userRole: string;
    divisi: string;
  }>>;
  proyekList: Proyek[];
  selectedProyekAssignments: { proyekId: number; role: string }[];
  setSelectedProyekAssignments: React.Dispatch<React.SetStateAction<{ proyekId: number; role: string }[]>>;
  onSubmit: (e: React.FormEvent) => void;
  onDelete?: () => void; // <-- Tambahan prop untuk hapus
  submitting: boolean;
  formError: string;
};

export default function AnggotaModal({
  isOpen,
  onClose,
  editingMember,
  form,
  setForm,
  proyekList,
  selectedProyekAssignments,
  setSelectedProyekAssignments,
  onSubmit,
  onDelete,
  submitting,
  formError,
}: AnggotaModalProps) {
  const formRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  return (
    <div ref={formRef} className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden animate-slide-down mb-6">
      <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
        <h3 className="font-bold text-[15px] text-stone-900">
          {editingMember ? `Edit Anggota: ${editingMember.nama}` : "Daftarkan Anggota Baru"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      <form onSubmit={onSubmit} className="p-6">
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
                      <div className="ml-2 flex items-center gap-1.5">
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

                        {editingMember && (() => {
                          const prevAssigned = editingMember.proyek.find(ep => ep.id === p.id);
                          const currentSelectedRole = selectedProyekAssignments.find(a => a.proyekId === p.id)?.role;
                          if (prevAssigned && prevAssigned.roleInProyek === currentSelectedRole) {
                            return (
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap" title="Role anggota tidak mengalami perubahan pada proyek ini">
                                Peran saat ini ({prevAssigned.roleInProyek === 'Project Manager' ? 'PM' : 'Anggota'})
                              </span>
                            );
                          }
                          return null;
                        })()}
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

        {/* Footer Buttons */}
        <div className="flex items-center justify-between mt-6 border-t border-stone-150 pt-4">
          <div>
            {editingMember && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-[13px] font-bold rounded-xl transition cursor-pointer"
              >
                <Trash2 size={14} />
                Hapus Anggota
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
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
        </div>
      </form>
    </div>
  );
}