"use client";

import React, { useState } from "react";
import { Search, Plus, MoreHorizontal } from "lucide-react";
import TambahAnggotaModal from "./TambahAnggotaModal";
import EditAnggotaModal from "./EditAnggotaModal";

const USERS_DATA = [
  {
    id: 1,
    nama: "Damar Muharram",
    email: "keuangan@digi.com",
    role: "Tim Keuangan",
    divisi: "—",
    proyek: [],
    badgeColor: "bg-[#e2f1eb] text-[#117a5b]",
  },
  {
    id: 2,
    nama: "Muhammad Alvin Ababil",
    email: "karyawan@digi.com",
    role: "Karyawan",
    divisi: "Cyclops",
    proyek: [
      "Penyebaran Laptop Daerah Bojongsoang (Karyawan)",
      "FTTH RANCAMANYAR (Karyawan)",
      "QA-Alif (Karyawan)",
      "QA-Isaaq (Karyawan)"
    ],
    badgeColor: "bg-stone-100 text-stone-700",
  },
  {
    id: 3,
    nama: "Muhammad Zaini",
    email: "pm@digi.com",
    role: "Karyawan",
    divisi: "—",
    proyek: [
      "Penyebaran Laptop Daerah Bojongsoang (PM)",
      "FTTH RANCAMANYAR (PM)",
      "QA-Zaini (PM)",
      "QA-Alif (PM)"
    ],
    badgeColor: "bg-stone-100 text-stone-700",
  },
  {
    id: 4,
    nama: "Alif Ihsan",
    email: "direktur@digi.com",
    role: "Direktur / Manajemen",
    divisi: "—",
    proyek: [],
    badgeColor: "bg-purple-50 text-purple-700",
  },
];

export default function KelolaAkunPage() {
  const [isTambahOpen, setIsTambahOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = USERS_DATA.filter(u => 
    u.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenEdit = (user: any) => {
    setSelectedUser(user);
    setIsEditOpen(true);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-full flex flex-col bg-[#f9f8f4] relative">
      
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-stone-900 leading-tight">Kelola Akun</h1>
          <p className="text-stone-500 mt-1 text-[14px]">
            Kelola akun tim. Daftarkan karyawan, Project Manager, dan Tim Keuangan ke sistem, serta atur penugasan proyek mereka.
          </p>
        </div>

        <button 
          onClick={() => setIsTambahOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#008f5d] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#007a4f] transition cursor-pointer w-fit shrink-0"
        >
          <Plus size={16} strokeWidth={3} />
          Tambah Anggota
        </button>
      </div>

      {/* Konten Utama Tabel & Search */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        
        {/* Search Bar Wrapper */}
        <div className="p-4 border-b border-stone-100 bg-[#fdfcf9]">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input 
              type="text" 
              placeholder="Cari nama atau email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2 text-[13px] outline-none focus:border-[#008f5d] transition shadow-xs"
            />
          </div>
        </div>

        {/* Tabel Data Akun */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f5f4ef] border-b border-stone-200 text-stone-500 text-[11px] uppercase tracking-wider font-bold">
                <th className="px-6 py-3.5">Anggota</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Divisi</th>
                <th className="px-6 py-3.5">Proyek ({filteredUsers.reduce((acc, curr) => acc + curr.proyek.length, 0)} Total)</th>
                <th className="px-6 py-3.5 text-right w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredUsers.map((user) => {
                const initials = user.nama.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
                return (
                  <tr key={user.id} className="hover:bg-stone-50/80 transition text-[13px]">
                    
                    {/* Kolom Anggota */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#e2f1eb] text-[#117a5b] font-bold text-[12px] flex items-center justify-center shrink-0 shadow-inner">
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 leading-tight">{user.nama}</p>
                          <p className="text-[11px] text-stone-400 mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Kolom Role */}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md ${user.badgeColor}`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Kolom Divisi */}
                    <td className="px-6 py-4 font-medium text-stone-600">
                      {user.divisi}
                    </td>

                    {/* Kolom Proyek */}
                    <td className="px-6 py-4">
                      {user.proyek.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {user.proyek.map((proj, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-[#eaf5ef] text-[#117a5b] border border-emerald-100 text-[10px] font-bold rounded-md flex items-center gap-1">
                              📁 {proj}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-stone-400 italic text-[12px]">Tidak ada proyek</span>
                      )}
                    </td>

                    {/* Kolom Aksi (Tombol Edit memicu modal) */}
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenEdit(user)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition cursor-pointer border border-stone-200 shadow-xs bg-white"
                        title="Edit Anggota"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Tabel Info */}
        <div className="px-6 py-3.5 bg-[#fdfcf9] border-t border-stone-100 text-[11px] font-medium text-stone-400">
          Menampilkan seluruh {filteredUsers.length} anggota terdaftar.
        </div>

      </div>

      {/* --- RENDERING MODAL DI ATAS HALAMAN --- */}
      <TambahAnggotaModal 
        isOpen={isTambahOpen} 
        onClose={() => setIsTambahOpen(false)} 
      />

      <EditAnggotaModal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        userData={selectedUser} 
      />

    </div>
  );
}