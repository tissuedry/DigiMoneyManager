"use client";

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';

import { 
  Plus, 
  AlertCircle,
  ChevronDown,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function BudgetProyek() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [reimbursements, setReimbursements] = useState<any[]>([]);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchDashboardData = () => {
    Promise.all([
      fetch('/api/proyek').then(res => res.json()),
      fetch('/api/reimbursements').then(res => res.json())
    ])
    .then(([projectsData, reimbursementsData]) => {
      if (projectsData.projects) {
        setProjects(projectsData.projects);
      }
      if (reimbursementsData.reimbursements) {
        setReimbursements(reimbursementsData.reimbursements);
      }
    })
    .catch(err => console.error('Error fetching dashboard data:', err))
    .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApproval = async (id: string, action: 'APPROVE' | 'REJECT') => {
    const actionText = action === 'APPROVE' ? 'menyetujui' : 'menolak';
    if (!confirm(`Apakah Anda yakin ingin ${actionText} pengajuan ini?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/reimbursements/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(action === 'APPROVE' ? 'Pengajuan berhasil disetujui!' : 'Pengajuan berhasil ditolak!');
        fetchDashboardData();
      } else {
        alert(data.message || 'Gagal memproses approval');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat memproses data');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-slate-500 font-semibold">
        Memuat data budget proyek...
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-[#F6F4EF] flex items-center justify-center text-slate-500 font-semibold font-sans">
        Belum ada proyek yang dikonfigurasi di sistem.
      </div>
    );
  }

  const currentProject = projects[selectedProjectIndex];
  
  const projectTitle = currentProject.nama;
  const projectId = currentProject.id;
  const projectClient = currentProject.deskripsi || "Client";
  const projectTimeline = `${new Date(currentProject.tanggalMulai).toLocaleDateString('id-ID')} - ${currentProject.tanggalSelesai ? new Date(currentProject.tanggalSelesai).toLocaleDateString('id-ID') : 'Selesai'}`;
  const projectPM = currentProject.users?.find((u: any) => u.role === 'Project Manager')?.nama || 'Alvin PM';
  
  const totalRAB = Number(currentProject.budget?.rabTotal || 0);
  const totalPengeluaran = Number(currentProject.budget?.totalPengeluaran || 0);
  const totalReimbursement = Number(currentProject.budget?.totalReimbursement || 0);
  const sisaBudget = Number(currentProject.budget?.sisaBudget || 0);
  
  const posAnggaran = currentProject.budget?.posAnggaran?.map((pos: any) => ({
    id: pos.id,
    name: pos.deskripsi,
    used: Number(pos.nominalTerpakai),
    total: Number(pos.nominalAlokasi)
  })) || [];

  const projectReimbursements = reimbursements.filter(r => r.proyekId === projectId);

  const mappedReimbursements = projectReimbursements.map((r: any) => {
    const initials = r.user?.nama ? r.user.nama.split(' ').map((n: any) => n[0]).join('').substring(0, 2).toUpperCase() : 'KY';
    const statusText = r.status === 'SUBMITTED' ? 'Menunggu PM' :
                       r.status === 'APPROVED_BY_PM' ? 'Verifikasi Keuangan' :
                       r.status === 'APPROVED' ? 'Dicairkan' : 'Ditolak';
    const statusColor = r.status === 'SUBMITTED' ? 'bg-[#FCEFD9] text-[#A76F28]' :
                        r.status === 'APPROVED_BY_PM' ? 'bg-[#E3F2FD] text-[#1D63B8]' :
                        r.status === 'APPROVED' ? 'bg-[#E2F0D9] text-[#385723]' : 'bg-red-50 text-red-700';

    return {
      dbId: r.id,
      id: r.id.substring(0, 8).toUpperCase(),
      pemohon: r.user?.nama || 'Karyawan',
      initials,
      merchant: r.ocrData?.merchant || 'N/A',
      pos: r.posAnggaran?.deskripsi || 'N/A',
      nominal: `Rp ${Number(r.nominal).toLocaleString('id-ID')}`,
      status: statusText,
      statusColor
    };
  });

  const pctTotalPengeluaran = totalRAB > 0 ? (totalPengeluaran / totalRAB) * 100 : 0;
  const pctReimbursement = totalRAB > 0 ? (totalReimbursement / totalRAB) * 100 : 0;
  const pctMurniPengeluaran = pctTotalPengeluaran - pctReimbursement;

  const formatRupiahShort = (value: number): string => {
    if (value >= 1_000_000_000) {
      return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
    } else if (value >= 1_000_000) {
      return `Rp ${(value / 1_000_000).toFixed(1)} jt`;
    } else {
      return `Rp ${new Intl.NumberFormat('id-ID').format(value)}`;
    }
  };

  const displayMetrics = {
    total: formatRupiahShort(totalRAB),
    pengeluaran: formatRupiahShort(totalPengeluaran),
    reimbursement: formatRupiahShort(totalReimbursement),
    sisa: formatRupiahShort(sisaBudget)
  };

  const entriesPerPage = 5;
  const totalEntries = mappedReimbursements.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);

  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = mappedReimbursements.slice(indexOfFirstEntry, indexOfLastEntry);

  return (
    <div className="min-h-screen bg-background flex text-slate-800 font-sans">

      <Sidebar
        isSidebarOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        userRole="Project Manager"
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header
          onOpenSidebar={() => setIsSidebarOpen(true)} 
        />

        <main className="p-4 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold text-stone-900">
                Budget Proyek
              </h1>
              <p className="text-sm font-medium text-slate-500 flex items-center flex-wrap gap-x-1.5">
                <span>{projectClient}</span>
                <span className="text-slate-300">•</span>
                <span>{projectTimeline}</span>
                <span className="text-slate-300">•</span>
                <span>PM: {projectPM}</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start lg:self-center w-full sm:w-auto" ref={dropdownRef}>
              <div className="relative w-full sm:w-64">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all"
                >
                  <span className="truncate">{projectTitle}</span>
                  <ChevronDown size={14} className={`text-slate-400 ml-2 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden py-1">
                    {projects.map((proj, idx) => (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => { setSelectedProjectIndex(idx); setCurrentPage(1); setIsDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 block transition ${idx === selectedProjectIndex ? 'text-blue-600 bg-blue-50/40' : 'text-slate-700'}`}
                      >
                        {proj.nama}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition shrink-0">
                <Download size={14} className="stroke-[2.5]" />
                Laporan
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{projectTitle}</h2>
                  <span className="inline-flex text-[10px] font-bold bg-[#E2F0D9] text-[#385723] px-2.5 py-0.5 rounded-md">
                    {currentProject.status}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-400 font-mono tracking-wide">
                  {projectId} · {projectClient}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 block uppercase">TOTAL RAB</span>
                <span className="text-xl font-extrabold tracking-tight text-slate-900 font-mono">
                  {displayMetrics.total}
                </span>
              </div>
            </div>

            <div className="w-full bg-white border border-slate-200 p-0.5 h-8 rounded-full flex overflow-hidden shadow-inner">
              <div 
                className="bg-[#004D34] h-full rounded-l-full transition-all duration-500"
                style={{ width: `${pctMurniPengeluaran}%` }}
              />
              <div 
                className="bg-[#00A86B] h-full transition-all duration-500"
                style={{ width: `${pctReimbursement}%` }}
              />
              <div className="h-full bg-transparent flex-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#F6F5F1] rounded-xl p-4 flex items-start gap-3 border border-slate-100">
                <div className="w-3.5 h-3.5 bg-[#004D34] rounded mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 block uppercase">PENGELUARAN (termasuk reimbursement)</span>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xl font-extrabold text-[#8B2635] font-mono">{displayMetrics.pengeluaran}</span>
                    <span className="text-[11px] font-semibold text-slate-400">{pctTotalPengeluaran.toFixed(1)}% dari RAB</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#F6F5F1] rounded-xl p-4 flex items-start gap-3 border border-slate-100">
                <div className="w-3.5 h-3.5 bg-[#00A86B] rounded mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 block uppercase">REIMBURSEMENT</span>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xl font-extrabold text-[#1D63B8] font-mono">{displayMetrics.reimbursement}</span>
                    <span className="text-[11px] font-semibold text-slate-400">{pctTotalPengeluaran > 0 ? ((totalReimbursement / totalPengeluaran) * 100).toFixed(1) : 0}% dari pengeluaran</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#F6F5F1] rounded-xl p-4 flex items-start gap-3 border border-slate-100">
                <div className="w-3.5 h-3.5 border border-dashed border-slate-400 bg-transparent rounded mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 block uppercase">SISA</span>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xl font-extrabold text-[#036240] font-mono">{displayMetrics.sisa}</span>
                    <span className="text-[11px] font-semibold text-slate-400">{totalRAB > 0 ? ((sisaBudget / totalRAB) * 100).toFixed(1) : 0}% dari RAB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
              
              {/* REALISASI PER POS ANGGARAN */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 lg:col-span-7 h-full">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-xl flex items-center gap-2 text-slate-900">
                     Realisasi per Pos Anggaran
                  </h3>
                  <button className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition">
                    <Plus size={14} /> Tambah Pos
                  </button>
                </div>

                <div className="space-y-4 pt-1">
                  {posAnggaran.map((pos: any, idx: number) => {
                    const percentage = pos.total > 0 ? Math.min(Math.round((pos.used / pos.total) * 100), 100) : 0;
                    const isWarning = percentage >= 80;

                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <div>
                            <span className="font-bold text-slate-800">{pos.name}</span>
                            <span className="ml-1.5 text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                              {pos.id.substring(0, 8).toUpperCase()}
                            </span>
                          </div>
                          <div className="text-slate-500 font-mono">
                            <span className="font-bold text-slate-800">Rp {pos.used.toLocaleString('id-ID')}</span> / Rp {pos.total.toLocaleString('id-ID')}
                          </div>
                        </div>
                        
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isWarning ? 'bg-amber-500' : 'bg-blue-600'}`} 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span>Terpakai: {percentage}%</span>
                          {isWarning && (
                            <span className="text-amber-600 font-medium flex items-center gap-0.5">
                              <AlertCircle size={10} /> Mendekati batas limit anggaran
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ANALYTICS IMAGE CARD */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 lg:col-span-5 h-full flex flex-col justify-between min-h-[420px]">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-xl text-slate-900">
                     Grafik Anggaran
                  </h3>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition duration-300 relative overflow-hidden group min-h-[250px]">
                  <img 
                    src="/budget_chart.png" 
                    alt="Analisis Visual Anggaran" 
                    className="max-h-[230px] w-full object-contain rounded-lg shadow-sm transition-transform duration-500 group-hover:scale-102"
                  />
                </div>
                <div className="text-center pt-2">
                  <p className="text-xs font-semibold text-slate-700">Grafik Ringkasan Pemakaian Pos Anggaran</p>
                  <p className="text-[10px] text-slate-400 mt-1">Diperbarui secara berkala berdasarkan transaksi riil</p>
                </div>
              </div>

            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[800px] border-collapse">
                  <thead>
                    <tr className="bg-[#F5F4F0] text-[#A3A29D] font-bold text-[11px] tracking-wider border-b border-slate-200">
                      <th className="py-4 px-6 font-medium">ID PENGAJUAN</th>
                      <th className="py-4 px-4 font-medium">PENGAJU</th>
                      <th className="py-4 px-4 font-medium">MERCHANT</th>
                      <th className="py-4 px-4 font-medium">POS</th>
                      <th className="py-4 px-4 font-medium">NOMINAL</th>
                      <th className="py-4 px-6 font-medium text-center">STATUS</th>
                      <th className="py-4 px-6 font-medium text-center">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentEntries.length > 0 ? (
                      currentEntries.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/40 transition">
                          <td className="py-4 px-6 font-mono text-slate-400 text-xs">
                            {item.id}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 bg-[#DDF2E8] text-[#198754] rounded-full flex items-center justify-center font-bold text-[11px] select-none shrink-0">
                                {item.initials}
                              </div>
                              <span className="font-bold text-slate-800 text-xs">{item.pemohon}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-800 text-xs">
                            {item.merchant}
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-block px-3 py-1 rounded-full bg-[#F5F4F0] text-slate-500 font-medium text-[11px]">
                              {item.pos}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-800 text-xs font-sans">
                            {item.nominal}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-block px-3 py-1 rounded-xl text-[11px] font-bold text-center min-w-32.5 ${item.statusColor}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            {item.status === 'Menunggu PM' ? (
                              <div className="flex gap-2 justify-center">
                                <button 
                                  onClick={() => handleApproval(item.dbId, 'APPROVE')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer"
                                >
                                  Setujui
                                </button>
                                <button 
                                  onClick={() => handleApproval(item.dbId, 'REJECT')}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold cursor-pointer"
                                >
                                  Tolak
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-medium">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                          Tidak ada pengajuan reimbursement untuk proyek ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center py-4 bg-white border-t border-slate-100">
                  <div className="flex items-center gap-4 bg-[#F5F4F0] px-4 py-2 rounded-full shadow-inner text-xs font-medium select-none text-slate-600">
          
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`w-5 h-5 rounded-full bg-[#8A6240] text-white flex items-center justify-center font-bold text-[10px] hover:opacity-90 transition ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <ChevronLeft size={18}/>
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, idx) => {
                      const pageNum = idx + 1;
                      const isActive = pageNum === currentPage;
                      return isActive ? (
                        <span key={pageNum} className="w-4 h-4 rounded bg-[#EBE9E1] text-slate-800 font-bold flex items-center justify-center cursor-pointer">
                          {pageNum}
                        </span>
                      ) : (
                        <span key={pageNum} onClick={() => setCurrentPage(pageNum)} className="hover:text-slate-900 cursor-pointer transition">
                          {pageNum}
                        </span>
                      );
                    })}
                    
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className={`w-5 h-5 rounded-full bg-[#8A6240] text-white flex items-center justify-center font-bold text-[10px] hover:opacity-90 transition ${currentPage === totalPages || totalPages === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <ChevronRight size={18}/>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </main>
      </div>
    </div>
  );
}