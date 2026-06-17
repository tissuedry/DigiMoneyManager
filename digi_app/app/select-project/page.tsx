'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, ChevronRight, LogOut, Loader2, FolderOpen, AlertCircle, Search, X } from 'lucide-react';
import Image from 'next/image';

type ProjectAssignment = {
  proyekId: number;
  nama: string;
  status: string;
  role: string;
};

type UserProfile = {
  nama: string;
  email: string;
  assignments?: ProjectAssignment[];
};

export default function SelectProjectPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectingId, setSelectingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Gagal mengambil data sesi');
      })
      .then((data) => {
        if (data.user) {
          setProfile(data.user);
        }
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg('Sesi tidak valid, mengalihkan ke halaman login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router]);

  const handleSelectProject = async (proyekId: number) => {
    setSelectingId(proyekId);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/select-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proyekId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal memilih proyek');
      }
      // Redirect to dashboard
      router.push(data.redirectUrl);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memilih proyek');
      setSelectingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f6f1] text-stone-850 p-6 font-sans">
        <Loader2 className="animate-spin text-[#008f5d] mb-4" size={36} />
        <p className="text-sm font-semibold text-stone-500">Memuat daftar proyek Anda...</p>
      </div>
    );
  }

  const assignments = profile?.assignments || [];
  
  // Filter assignments based on search query
  const filteredAssignments = assignments.filter((item) =>
    item.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8f6f1] text-stone-800 font-sans relative overflow-x-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#e2f1eb]/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#008f5d]/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Red: Headbar Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-stone-200/80 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center shrink-0">
            <Image src="/logo.png" alt="Digi Money Manager" width={36} height={36} className="object-contain" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight leading-tight text-stone-900">Digi Money Manager</h1>
            <p className="text-[10px] text-[#008f5d] font-bold">Sistem Keuangan Proyek</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-xl text-xs font-bold bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition cursor-pointer shadow-sm"
        >
          <LogOut size={13} />
          Keluar
        </button>
      </header>

      {/* Main Section */}
      <div className="flex-1 w-full max-w-6xl mx-auto px-6 py-12 flex flex-col items-center gap-10">
        
        {/* Yellow: Title & Search bar Area */}
        <div className="w-full max-w-2xl text-center space-y-6">
          <div className="space-y-2.5">
            <h2 className="text-3xl font-extrabold tracking-tight text-stone-900">
              Pilih Proyek Aktif
            </h2>
            <p className="text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
              Halo <span className="font-bold text-stone-855">{profile?.nama}</span>, silakan cari dan pilih proyek untuk melihat detail anggaran dan pengajuan reimbursement Anda.
            </p>
          </div>

          {/* Search bar */}
          {assignments.length > 0 && (
            <div className="relative max-w-md w-full mx-auto shadow-sm rounded-2xl">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari proyek berdasarkan nama..."
                className="w-full bg-white border border-stone-200 rounded-2xl pl-11 pr-10 py-3.5 text-xs font-medium text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#008f5d]/10 focus:border-[#008f5d] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-sm max-w-md mx-auto text-left">
              <AlertCircle size={14} className="shrink-0" />
              {errorMsg}
            </div>
          )}
        </div>

        {/* Blue: Projects Grid Area */}
        <div className="w-full">
          {filteredAssignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssignments.map((assignment) => {
                const isSelecting = selectingId === assignment.proyekId;
                const isPM = assignment.role === 'Project Manager';
                return (
                  <div
                    key={assignment.proyekId}
                    onClick={() => !selectingId && handleSelectProject(assignment.proyekId)}
                    className={`bg-white border border-stone-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all duration-200 group text-left ${
                      selectingId 
                        ? 'opacity-60 cursor-not-allowed' 
                        : 'cursor-pointer hover:border-[#008f5d] hover:shadow-md hover:-translate-y-1'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Top section */}
                      <div className="flex items-center justify-between">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${
                          isPM 
                            ? 'bg-blue-50/80 text-blue-700 border-blue-100' 
                            : 'bg-[#e2f1eb]/80 text-[#117a5b] border-emerald-100'
                        }`}>
                          <Briefcase size={18} />
                        </div>
                        <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          assignment.status === 'AKTIF' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-stone-100 text-stone-500 border-stone-200'
                        }`}>
                          {assignment.status}
                        </span>
                      </div>

                      {/* Info section */}
                      <div className="space-y-1.5">
                        <h3 className="font-bold text-base text-stone-900 group-hover:text-[#008f5d] transition-colors line-clamp-2 leading-snug">
                          {assignment.nama}
                        </h3>
                        <p className="text-xs text-stone-400 font-medium">
                          ID: PRJ-{String(assignment.proyekId).padStart(3, '0')}
                        </p>
                      </div>
                    </div>

                    {/* Bottom section with Role and CTA Button */}
                    <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                        isPM 
                          ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                          : 'bg-[#e2f1eb] text-[#117a5b] border border-emerald-100'
                      }`}>
                        {isPM ? 'Project Manager' : 'Karyawan'}
                      </span>
                      
                      <button 
                        className={`text-xs font-bold flex items-center gap-1 transition-colors ${
                          isPM ? 'text-blue-700 group-hover:text-blue-800' : 'text-[#008f5d] group-hover:text-[#007a4f]'
                        }`}
                      >
                        {isSelecting ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <>
                            Masuk
                            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-3xl p-16 text-center space-y-4 shadow-sm max-w-lg mx-auto">
              <FolderOpen size={48} className="mx-auto text-stone-300" />
              <div className="space-y-2">
                <p className="text-base font-bold text-stone-800">
                  {assignments.length > 0 ? 'Proyek tidak ditemukan' : 'Tidak ada proyek yang ditugaskan'}
                </p>
                <p className="text-xs text-stone-400 leading-relaxed max-w-xs mx-auto">
                  {assignments.length > 0 
                    ? `Tidak ada proyek yang cocok dengan kata pencarian "${searchQuery}".` 
                    : 'Anda belum ditugaskan ke proyek apa pun oleh Direktur. Silakan hubungi manajemen untuk penugasan proyek.'}
                </p>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50"
                >
                  Reset Pencarian
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="w-full border-t border-stone-200/60 bg-white/50 py-4 text-center text-[10px] text-stone-400 font-medium">
        © {new Date().getFullYear()} Digi Money Manager. Hak Cipta Dilindungi.
      </footer>
    </div>
  );
}
