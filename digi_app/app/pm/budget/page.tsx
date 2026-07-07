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
  const [chartType, setChartType] = useState<"alokasi" | "terpakai">("alokasi");
  const [isAddPosModalOpen, setIsAddPosModalOpen] = useState(false);
  const [newPosName, setNewPosName] = useState("");
  const [newPosAllocation, setNewPosAllocation] = useState("");
  const [isSubmittingPos, setIsSubmittingPos] = useState(false);

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
      fetch('/api/auth/me').then(res => res.ok ? res.json() : null),
      fetch('/api/proyek?role=Project+Manager').then(res => res.json()),
      fetch('/api/reimbursements?role=Project+Manager').then(res => res.json())
    ])
    .then(([meData, projectsData, reimbursementsData]) => {
      let loadedProjects = [];
      if (projectsData.projects) {
        setProjects(projectsData.projects);
        loadedProjects = projectsData.projects;
      }
      if (reimbursementsData.reimbursements) {
        setReimbursements(reimbursementsData.reimbursements);
      }

      // Tentukan index proyek yang aktif berdasarkan session
      const sessionProyekId = meData?.user?.proyekId;
      if (sessionProyekId && loadedProjects.length > 0) {
        const foundIndex = loadedProjects.findIndex((p: any) => p.id === sessionProyekId);
        if (foundIndex !== -1) {
          setSelectedProjectIndex(foundIndex);
        } else {
          setSelectedProjectIndex(0);
        }
      } else {
        setSelectedProjectIndex(0);
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

  const handleAddPos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPosName.trim()) {
      alert("Nama Pos Anggaran tidak boleh kosong");
      return;
    }
    const allocation = parseFloat(newPosAllocation);
    if (isNaN(allocation) || allocation <= 0) {
      alert("Nominal alokasi harus berupa angka positif");
      return;
    }

    setIsSubmittingPos(true);
    try {
      const res = await fetch(`/api/proyek/${projectId}/pos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          namaPos: newPosName.trim(),
          nominalAlokasi: allocation,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Pos Anggaran berhasil ditambahkan!");
        setIsAddPosModalOpen(false);
        setNewPosName("");
        setNewPosAllocation("");
        fetchDashboardData();
      } else {
        alert(data.message || "Gagal menambahkan Pos Anggaran");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menghubungi server");
    } finally {
      setIsSubmittingPos(false);
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
    name: pos.namaPos || pos.deskripsi || "N/A",
    used: Number(pos.nominalTerpakai),
    total: Number(pos.nominalAlokasi)
  })) || [];

  const chartColors = ["#004D34", "#008f5d", "#1D63B8", "#D97706", "#7c3aed", "#ec4899"];
  const donutItems = posAnggaran.map((pos: any, idx: number) => ({
    name: pos.name,
    value: chartType === "alokasi" ? pos.total : pos.used,
    color: chartColors[idx % chartColors.length]
  }));
  const donutTotal = donutItems.reduce((sum: number, item: any) => sum + item.value, 0);

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
      id: String(r.id).substring(0, 8).toUpperCase(),
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

  const handleDownloadLaporanPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Gagal membuka jendela baru. Silakan izinkan pop-up untuk situs ini.");
      return;
    }

    const todayStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const posAnggaranRows = posAnggaran.map((pos: any) => {
      const percentage = pos.total > 0 ? ((pos.used / pos.total) * 100).toFixed(1) : "0.0";
      const sisa = pos.total - pos.used;
      return `
        <tr class="border-b border-slate-200 text-slate-700 text-xs">
          <td class="py-3 px-4 font-semibold">${pos.name}</td>
          <td class="py-3 px-4 font-mono text-right">Rp ${pos.total.toLocaleString('id-ID')}</td>
          <td class="py-3 px-4 font-mono text-right text-amber-700">Rp ${pos.used.toLocaleString('id-ID')}</td>
          <td class="py-3 px-4 text-center font-bold">${percentage}%</td>
          <td class="py-3 px-4 font-mono text-right text-emerald-800">Rp ${sisa.toLocaleString('id-ID')}</td>
        </tr>
      `;
    }).join('');

    const reimbursementRows = mappedReimbursements.map((item: any) => {
      return `
        <tr class="border-b border-slate-100 text-slate-700 text-[11px]">
          <td class="py-2.5 px-4 font-mono">${item.id}</td>
          <td class="py-2.5 px-4 font-semibold">${item.pemohon}</td>
          <td class="py-2.5 px-4">${item.merchant}</td>
          <td class="py-2.5 px-4"><span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">${item.pos}</span></td>
          <td class="py-2.5 px-4 font-mono text-right font-semibold">${item.nominal}</td>
          <td class="py-2.5 px-4 text-center"><span class="font-bold">${item.status}</span></td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Laporan Keuangan - ${currentProject.nama}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #ffffff;
          }
          @media print {
            body {
              background-color: #ffffff;
            }
            .no-print {
              display: none;
            }
            @page {
              margin: 1.5cm;
            }
          }
        </style>
      </head>
      <body class="p-6 md:p-12 max-w-5xl mx-auto">
        <!-- Floating Print Action for preview mode -->
        <div class="no-print mb-8 flex justify-between items-center bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div class="space-y-0.5">
            <h4 class="font-bold text-slate-800 text-sm">Pratinjau Laporan Keuangan</h4>
            <p class="text-xs text-slate-500">Gunakan dialog cetak browser untuk menyimpannya sebagai file PDF.</p>
          </div>
          <button 
            onclick="window.print()" 
            class="px-5 py-2.5 bg-[#004D34] hover:bg-[#003d29] text-white text-xs font-bold rounded-xl transition shadow-md cursor-pointer"
          >
            Cetak / Simpan PDF
          </button>
        </div>

        <!-- Document Header -->
        <div class="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
          <div>
            <h1 class="text-2xl font-extrabold text-[#004D34] tracking-tight">DIGI MONEY MANAGER</h1>
            <p class="text-xs text-slate-500 font-semibold tracking-wide uppercase mt-1">Platform Manajemen Finansial Proyek</p>
          </div>
          <div class="text-right">
            <h2 class="text-lg font-bold text-slate-800 uppercase tracking-wide">Laporan Keuangan Proyek</h2>
            <p class="text-xs text-slate-400 mt-1 font-mono">${todayStr}</p>
          </div>
        </div>

        <!-- Project Meta Info -->
        <div class="grid grid-cols-2 gap-6 bg-[#F9F8F4] border border-[#EBE9E1] rounded-2xl p-6 mb-8">
          <div class="space-y-2">
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NAMA PROYEK</span>
              <span class="text-base font-bold text-slate-800">${currentProject.nama}</span>
            </div>
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ID PROYEK</span>
              <span class="text-xs font-mono font-bold text-slate-500">${currentProject.id}</span>
            </div>
          </div>
          <div class="space-y-2">
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PROJECT MANAGER</span>
              <span class="text-sm font-bold text-slate-800">${projectPM}</span>
            </div>
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CLIENT / TIMELINE</span>
              <span class="text-xs font-semibold text-slate-600">${projectClient} · ${projectTimeline}</span>
            </div>
          </div>
        </div>

        <!-- Financial Summary Cards -->
        <div class="mb-8">
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-l-4 border-[#004D34] pl-2.5">
            Ringkasan Anggaran (RAB)
          </h3>
          <div class="grid grid-cols-4 gap-4">
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              <span class="text-[9px] font-bold text-slate-400 block uppercase">TOTAL RAB</span>
              <span class="text-base font-extrabold text-slate-800 font-mono mt-1 block">
                Rp ${totalRAB.toLocaleString('id-ID')}
              </span>
            </div>
            <div class="bg-[#FDF3F3] border border-[#FADAD9] rounded-xl p-4 text-center">
              <span class="text-[9px] font-bold text-red-500 block uppercase">TOTAL PENGELUARAN</span>
              <span class="text-base font-extrabold text-red-700 font-mono mt-1 block">
                Rp ${totalPengeluaran.toLocaleString('id-ID')}
              </span>
            </div>
            <div class="bg-[#EEF6FC] border border-[#D5E9FA] rounded-xl p-4 text-center">
              <span class="text-[9px] font-bold text-blue-500 block uppercase">REIMBURSEMENT</span>
              <span class="text-base font-extrabold text-blue-700 font-mono mt-1 block">
                Rp ${totalReimbursement.toLocaleString('id-ID')}
              </span>
            </div>
            <div class="bg-[#EDF8F4] border border-[#D1EFE4] rounded-xl p-4 text-center">
              <span class="text-[9px] font-bold text-emerald-600 block uppercase">SISA SALDO</span>
              <span class="text-base font-extrabold text-emerald-800 font-mono mt-1 block">
                Rp ${sisaBudget.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        <!-- Pos Anggaran Breakdown -->
        <div class="mb-8 page-break">
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-l-4 border-[#004D34] pl-2.5">
            Realisasi per Pos Anggaran
          </h3>
          <table class="w-full text-left border-collapse border border-slate-200">
            <thead>
              <tr class="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold text-[10px] tracking-wider uppercase">
                <th class="py-3 px-4">Nama Pos Anggaran</th>
                <th class="py-3 px-4 text-right">Alokasi RAB</th>
                <th class="py-3 px-4 text-right">Realisasi Pengeluaran</th>
                <th class="py-3 px-4 text-center">Persentase</th>
                <th class="py-3 px-4 text-right">Sisa Saldo</th>
              </tr>
            </thead>
            <tbody>
              ${posAnggaranRows}
            </tbody>
          </table>
        </div>

        <!-- Reimbursement Logs -->
        <div class="mb-8">
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-l-4 border-[#004D34] pl-2.5">
            Riwayat Pengajuan Reimbursement Proyek
          </h3>
          <table class="w-full text-left border-collapse border border-slate-200">
            <thead>
              <tr class="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold text-[10px] tracking-wider uppercase">
                <th class="py-3 px-4">ID</th>
                <th class="py-3 px-4">Pengaju</th>
                <th class="py-3 px-4">Merchant</th>
                <th class="py-3 px-4">Pos Anggaran</th>
                <th class="py-3 px-4 text-right">Nominal</th>
                <th class="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              ${reimbursementRows.length > 0 ? reimbursementRows : '<tr><td colspan="6" class="py-6 text-center text-slate-400 text-xs font-semibold">Tidak ada transaksi ditemukan</td></tr>'}
            </tbody>
          </table>
        </div>

        <!-- Footer / Signature -->
        <div class="mt-16 pt-12 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400">
          <div>
            <p>© ${new Date().getFullYear()} Digi Money Manager. Semua Hak Cipta Dilindungi.</p>
          </div>
          <div class="text-right">
            <p>Disetujui Oleh,</p>
            <div class="h-12"></div>
            <p class="font-bold text-slate-700">${projectPM}</p>
            <p>Project Manager</p>
          </div>
        </div>

        <!-- Auto trigger print dialog -->
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="h-screen bg-background flex text-slate-800 font-sans overflow-hidden">

      <Sidebar
        isSidebarOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        userRole="Project Manager"
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onOpenSidebar={() => setIsSidebarOpen(true)} 
        />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          
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
                        onClick={async () => {
                          setIsDropdownOpen(false);
                          try {
                            const res = await fetch("/api/auth/select-project", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ proyekId: proj.id }),
                            });
                            if (res.ok) {
                              setSelectedProjectIndex(idx);
                              setCurrentPage(1);
                            } else {
                              console.error("Gagal memperbarui session proyek");
                              setSelectedProjectIndex(idx);
                              setCurrentPage(1);
                            }
                          } catch (err) {
                            console.error(err);
                            setSelectedProjectIndex(idx);
                            setCurrentPage(1);
                          }
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 block transition ${idx === selectedProjectIndex ? 'text-blue-600 bg-blue-50/40' : 'text-slate-700'}`}
                      >
                        {proj.nama}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={handleDownloadLaporanPDF}
                className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition shrink-0 cursor-pointer"
              >
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

            <div className="w-full bg-stone-100 h-5 rounded-full overflow-hidden flex shadow-inner">
              <div 
                className="bg-[#004D34] h-full transition-all duration-500"
                style={{ width: `${pctMurniPengeluaran}%` }}
              />
              <div 
                className="bg-[#00A86B] h-full transition-all duration-500"
                style={{ width: `${pctReimbursement}%` }}
              />
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
                  <button 
                    onClick={() => setIsAddPosModalOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                  >
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
                              {String(pos.id).substring(0, 8).toUpperCase()}
                            </span>
                          </div>
                          <div className="text-slate-500 font-mono">
                            <span className="font-bold text-slate-800">Rp {pos.used.toLocaleString('id-ID')}</span> / Rp {pos.total.toLocaleString('id-ID')}
                          </div>
                        </div>
                        
                        <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden relative">
                          <div 
                            className={`h-full transition-all duration-500 ${isWarning ? 'bg-amber-500' : 'bg-blue-600'}`} 
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

              {/* ANALYTICS CARD */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 lg:col-span-5 h-full flex flex-col justify-between min-h-[420px]">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-xl text-slate-900">
                     Grafik Anggaran
                  </h3>
                  
                  {/* Toggle buttons */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold shadow-inner">
                    <button
                      onClick={() => setChartType("alokasi")}
                      className={`px-3 py-1.5 rounded-md transition duration-150 cursor-pointer ${chartType === "alokasi" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                    >
                      Alokasi
                    </button>
                    <button
                      onClick={() => setChartType("terpakai")}
                      className={`px-3 py-1.5 rounded-md transition duration-150 cursor-pointer ${chartType === "terpakai" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                    >
                      Pemakaian
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-4 border border-dashed border-slate-200 rounded-xl bg-[#fcfbf9] hover:bg-[#faf9f4] transition duration-300 relative overflow-hidden min-h-[250px]">
                  {donutItems.length > 0 ? (
                    <DonutChart items={donutItems} totalValue={donutTotal} chartType={chartType} />
                  ) : (
                    <p className="text-xs text-slate-400 font-semibold">Tidak ada data pos anggaran</p>
                  )}
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

      {isAddPosModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-all duration-300">
          <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">Tambah Pos Anggaran</h3>
              <button
                type="button"
                onClick={() => setIsAddPosModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-semibold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddPos} className="space-y-4 pt-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Nama Pos Anggaran
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Operasional & Logistik"
                  value={newPosName}
                  onChange={(e) => setNewPosName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Nominal Alokasi (Rupiah)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Contoh: 10000000"
                  value={newPosAllocation}
                  onChange={(e) => setNewPosAllocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddPosModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl border border-slate-200 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPos}
                  className="px-4 py-2 text-xs font-bold bg-[#004D34] hover:bg-[#003d29] text-white rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingPos ? "Menyimpan..." : "Simpan Pos"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const DonutChart = ({ items, totalValue, chartType }: { items: any[], totalValue: number, chartType: string }) => {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const r = 50;
  const circ = 2 * Math.PI * r;

  // Precompute accumulated percentages for segments and labels
  let currentAccum = 0;
  const positionedItems = items.map((item: any, idx: number) => {
    if (item.value <= 0) return { ...item, percentage: 0, isValid: false };
    const percentage = (item.value / totalValue) * 100;
    const startPercent = currentAccum;
    const endPercent = currentAccum + percentage;
    currentAccum = endPercent;
    return {
      ...item,
      percentage,
      startPercent,
      endPercent,
      midPercent: (startPercent + endPercent) / 2,
      isValid: true
    };
  });

  const activeItem = hoveredIndex !== null ? items[hoveredIndex] : null;
  const centerTitle = activeItem ? activeItem.name : (chartType === "alokasi" ? "TOTAL RAB" : "TERPAKAI");
  const centerValue = activeItem ? activeItem.value : totalValue;

  // Smart label splitting helper to prevent long category names from overflowing
  const getSplitLines = (name: string) => {
    if (name.includes(" & ")) {
      const parts = name.split(" & ");
      return [parts[0], `& ${parts[1]}`];
    }
    if (name.length > 12 && name.includes(" ")) {
      const words = name.split(" ");
      const mid = Math.ceil(words.length / 2);
      return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
    }
    return [name, ""];
  };
  
  return (
    <div className="flex flex-col items-center gap-6 justify-center w-full py-2">
      {/* SVG Donut */}
      <div className="relative w-full max-w-[360px] h-[240px] shrink-0">
        <svg viewBox="0 0 360 240" className="w-full h-full">
          {/* Rotated group for circle segments to start from top (12 o'clock) */}
          <g transform="rotate(-90 180 120)">
            <circle cx="180" cy="120" r={r} fill="transparent" stroke="#f1eff7" strokeWidth="16" />
            {totalValue > 0 ? (
              positionedItems.map((item: any, idx: number) => {
                if (!item.isValid) return null;
                const strokeLength = (item.value / totalValue) * circ;
                const strokeOffset = circ - (item.startPercent / 100) * circ;
                const isHovered = hoveredIndex === idx;
                
                return (
                  <circle
                    key={idx}
                    cx="180"
                    cy="120"
                    r={r}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth={isHovered ? 20 : 16}
                    strokeDasharray={`${strokeLength} ${circ}`}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="transition-all duration-200 cursor-pointer"
                  />
                );
              })
            ) : (
              <circle cx="180" cy="120" r={r} fill="transparent" stroke="#e9e8e3" strokeWidth="16" strokeDasharray="314 314" />
            )}
          </g>

          {/* Unrotated leader lines and labels */}
          {totalValue > 0 && positionedItems.map((item: any, idx: number) => {
            if (!item.isValid) return null;
            const percentage = item.percentage.toFixed(1);
            
            // Calculate midpoint angle in radians
            const angle = (item.midPercent / 100 * 2 * Math.PI) - Math.PI / 2;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            
            // Start of leader line (outer edge of segment, R=58)
            const xStart = 180 + 58 * cos;
            const yStart = 120 + 58 * sin;
            
            // Elbow of leader line (R=74)
            const xElbow = 180 + 74 * cos;
            const yElbow = 120 + 74 * sin;
            
            // End of horizontal extension
            let xEnd = xElbow;
            let textAnchor: "start" | "end" | "middle" = "middle";
            let xText = xElbow;
            let yText = yElbow;
            
            if (cos > 0.1) { // Right side
              xEnd = xElbow + 10;
              textAnchor = "start";
              xText = xEnd + 4;
              yText = yElbow;
            } else if (cos < -0.1) { // Left side
              xEnd = xElbow - 10;
              textAnchor = "end";
              xText = xEnd - 4;
              yText = yElbow;
            } else { // Top or Bottom
              xEnd = xElbow;
              textAnchor = "middle";
              xText = xElbow;
              yText = yElbow + (sin > 0 ? 12 : -16);
            }
            
            const isHovered = hoveredIndex === idx;
            const [line1, line2] = getSplitLines(item.name);
            const hasLine2 = !!line2;
            
            // Vertical offset calculations for text block
            const line1Y = hasLine2 ? yText - 9 : yText - 4;
            const line2Y = yText;
            const percentY = hasLine2 ? yText + 9 : yText + 6;
            
            return (
              <g 
                key={`label-${idx}`}
                className="transition-all duration-200"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Leader Line */}
                <path
                  d={`M ${xStart} ${yStart} L ${xElbow} ${yElbow} L ${xEnd} ${yElbow}`}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={isHovered ? 1.5 : 1}
                  opacity={isHovered ? 0.95 : 0.65}
                  className="transition-all duration-150"
                />
                
                {/* Category Name Line 1 */}
                <text
                  x={xText}
                  y={line1Y}
                  textAnchor={textAnchor}
                  className={`text-[8px] font-bold select-none transition-colors duration-150 ${isHovered ? 'fill-stone-900 font-extrabold' : 'fill-stone-600'}`}
                >
                  {line1}
                </text>
                
                {/* Category Name Line 2 (Optional) */}
                {hasLine2 && (
                  <text
                    x={xText}
                    y={line2Y}
                    textAnchor={textAnchor}
                    className={`text-[8px] font-bold select-none transition-colors duration-150 ${isHovered ? 'fill-stone-900 font-extrabold' : 'fill-stone-600'}`}
                  >
                    {line2}
                  </text>
                )}
                
                {/* Percentage */}
                <text
                  x={xText}
                  y={percentY}
                  textAnchor={textAnchor}
                  fill={item.color}
                  className={`text-[8px] font-extrabold select-none transition-all duration-150 ${isHovered ? 'opacity-100' : 'opacity-85'}`}
                >
                  {percentage}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 select-none pointer-events-none">
          <span className="text-[9px] md:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider line-clamp-2 max-w-[85px] leading-tight">
            {centerTitle}
          </span>
          <span className="text-xs md:text-sm font-extrabold text-slate-800 leading-tight px-1 mt-1 break-all">
            {centerValue >= 1000000 ? `Rp ${(centerValue / 1000000).toFixed(1)} jt` : `Rp ${centerValue.toLocaleString('id-ID')}`}
          </span>
        </div>
      </div>
      
      {/* Legend */}
      <div className="w-full space-y-2.5 text-left pt-4 border-t border-slate-100">
        {items.map((item: any, idx: number) => {
          const percentage = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : "0.0";
          const isHovered = hoveredIndex === idx;
          
          return (
            <div 
              key={idx} 
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center justify-between text-[11px] font-sans border-b border-slate-150/40 pb-2 last:border-none last:pb-0 transition-colors duration-150 p-1 rounded-lg ${isHovered ? 'bg-slate-50 border-slate-200/50' : 'border-transparent'}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <div className="flex flex-col min-w-0 leading-tight">
                  <span className="font-bold text-slate-700 truncate">{item.name}</span>
                  <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    {item.value >= 1000000 ? `Rp ${(item.value / 1000000).toFixed(1)} jt` : `Rp ${item.value.toLocaleString('id-ID')}`}
                  </span>
                </div>
              </div>
              <span className="font-mono font-bold text-slate-500 shrink-0 ml-2 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                {percentage}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};