"use client";

import React, { useState, useEffect } from "react";
import { Filter, Eye, X } from "lucide-react";
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';

// Tipe Data untuk Tabel
type Submission = {
  id: string;
  dbId: string;
  date: string;
  merchant: string;
  project: string;
  pos: string;
  amount: string;
  status: "Menunggu PM" | "Verifikasi Keuangan" | "Dicairkan" | "Ditolak";
};

const TABS = ["Semua", "Menunggu PM", "Menunggu Keuangan", "Dicairkan", "Ditolak"];

function formatTanggal(iso: string) {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length < 3) return iso;
  const [y, m, d] = parts;
  const bulan = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  const mIdx = parseInt(m) - 1;
  return `${parseInt(d)} ${bulan[mIdx] || m} ${y}`;
}

// Helper untuk warna Badge Status
const getStatusBadge = (status: Submission["status"]) => {
  switch (status) {
    case "Menunggu PM":
      return "bg-[#fdf3e6] text-[#b46b2b]"; // Oranye
    case "Verifikasi Keuangan":
      return "bg-[#e1f5fe] text-[#0277bd]"; // Biru
    case "Dicairkan":
      return "bg-[#e2f1eb] text-[#117a5b]"; // Hijau
    case "Ditolak":
      return "bg-[#fee2e2] text-[#be123c]"; // Merah
    default:
      return "bg-stone-100 text-stone-600";
  }
};

export default function RiwayatPengajuanPage() {
  const [activeTab, setActiveTab] = useState("Semua");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [rawReimbursements, setRawReimbursements] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetch('/api/reimbursements')
      .then(res => res.json())
      .then(data => {
        if (data.reimbursements) {
          setRawReimbursements(data.reimbursements);
          const mapped = data.reimbursements.map((r: any) => ({
            id: r.id.substring(0, 8).toUpperCase(),
            dbId: r.id,
            date: r.ocrData?.tanggal ? formatTanggal(r.ocrData.tanggal) : 'N/A',
            merchant: r.ocrData?.merchant || 'N/A',
            project: r.proyek?.nama || 'N/A',
            pos: r.posAnggaran?.deskripsi || 'N/A',
            amount: `Rp ${Number(r.nominal).toLocaleString('id-ID')}`,
            status: r.status === 'SUBMITTED' ? 'Menunggu PM' :
                    r.status === 'APPROVED_BY_PM' ? 'Verifikasi Keuangan' :
                    r.status === 'APPROVED' ? 'Dicairkan' : 'Ditolak'
          }));
          setSubmissions(mapped);
        }
      })
      .catch(err => console.error('Error fetching submissions:', err))
      .finally(() => setIsLoading(false));
  }, []);

  // Logika Filtering berdasarkan Tab
  const filteredData = submissions.filter((item) => {
    if (activeTab === "Semua") return true;
    if (activeTab === "Menunggu Keuangan") return item.status === "Verifikasi Keuangan";
    return item.status === activeTab;
  });

  const handleOpenDetail = (dbId: string) => {
    const raw = rawReimbursements.find(r => r.id === dbId);
    if (raw) {
      setSelectedItem(raw);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#f9f8f4] font-sans text-stone-800">
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        userRole="Karyawan"
      />

      {/* Area Konten Kanan */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-8 overflow-y-auto">
          {/* Judul Halaman */}
          <div className="mb-8">
            <h1 className="text-[24px] font-bold text-stone-900">Riwayat Pengajuan</h1>
            <p className="text-[14px] text-stone-500 mt-1.5">
              Semua reimbursement yang pernah kamu ajukan, lengkap dengan status dan jejak audit.
            </p>
          </div>

          {/* Baris Filter & Tabs */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-1.5 p-1 bg-stone-200/40 rounded-full border border-stone-200/60">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 text-[13px] rounded-full transition-all duration-200 cursor-pointer ${
                    activeTab === tab
                      ? "bg-white text-stone-900 font-semibold shadow-sm"
                      : "text-stone-500 font-medium hover:text-stone-700 hover:bg-stone-200/50"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm text-[13px] font-medium text-stone-700 hover:bg-stone-50 transition cursor-pointer">
              <Filter size={14} className="text-stone-500" /> Filter
            </button>
          </div>

          {/* Tabel Data */}
          <div className="bg-white border border-stone-200 rounded-2xl overflow-x-auto shadow-sm">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[#f5f4ef] border-b border-stone-200 text-[11px] text-stone-400 uppercase tracking-wider font-semibold">
                  <th className="px-6 py-4 rounded-tl-2xl">ID Pengajuan</th>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Merchant</th>
                  <th className="px-6 py-4">Proyek</th>
                  <th className="px-6 py-4">Pos</th>
                  <th className="px-6 py-4">Nominal</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center rounded-tr-2xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-stone-600">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-stone-400">
                      Memuat data pengajuan...
                    </td>
                  </tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <tr
                      key={item.dbId}
                      className={`hover:bg-stone-50 transition border-b border-stone-100 ${
                        index === filteredData.length - 1 ? "border-none" : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-stone-500 font-mono">{item.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-stone-800">{item.merchant}</td>
                      <td className="px-6 py-4">{item.project}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-stone-100 border border-stone-200/60 px-2 py-1 rounded-md text-[11px] font-medium text-stone-600">
                          {item.pos}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-stone-800">{item.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-bold ${getStatusBadge(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button 
                          onClick={() => handleOpenDetail(item.dbId)}
                          className="text-stone-400 hover:text-stone-800 transition p-1.5 hover:bg-stone-100 rounded-lg cursor-pointer"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-stone-400">
                      Tidak ada data yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Modal Detail */}
          {selectedItem && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-stone-200 shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header Modal */}
                <div className="px-6 py-4 border-b border-stone-150 flex justify-between items-center bg-stone-50">
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">Detail Pengajuan Reimbursement</h3>
                    <p className="text-[11px] text-stone-400 font-mono mt-0.5">{selectedItem.id}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="w-8 h-8 rounded-lg hover:bg-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Body Modal (Scrollable) */}
                <div className="p-6 overflow-y-auto space-y-6 text-xs text-stone-700 font-medium">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-stone-400 block mb-0.5 font-bold text-[10px] uppercase">Proyek</span>
                      <span className="text-stone-850 font-bold text-xs">{selectedItem.proyek?.nama || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block mb-0.5 font-bold text-[10px] uppercase">Pos Anggaran</span>
                      <span className="text-stone-850 font-bold text-xs">{selectedItem.posAnggaran?.deskripsi || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block mb-0.5 font-bold text-[10px] uppercase">Merchant</span>
                      <span className="text-stone-850 font-bold text-xs">{selectedItem.ocrData?.merchant || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block mb-0.5 font-bold text-[10px] uppercase">Tanggal Transaksi</span>
                      <span className="text-stone-850 font-bold text-xs">{selectedItem.ocrData?.tanggal ? formatTanggal(selectedItem.ocrData.tanggal) : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block mb-0.5 font-bold text-[10px] uppercase">Nominal</span>
                      <span className="text-stone-900 font-extrabold text-sm font-sans block mt-1">Rp {Number(selectedItem.nominal).toLocaleString('id-ID')}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block mb-0.5 font-bold text-[10px] uppercase">Status</span>
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold mt-1 ${
                        selectedItem.status === 'SUBMITTED' ? 'bg-[#fdf3e6] text-[#b46b2b]' :
                        selectedItem.status === 'APPROVED_BY_PM' ? 'bg-[#e1f5fe] text-[#0277bd]' :
                        selectedItem.status === 'APPROVED' ? 'bg-[#e2f1eb] text-[#117a5b]' :
                        'bg-[#fee2e2] text-[#be123c]'
                      }`}>
                        {selectedItem.status === 'SUBMITTED' ? 'Menunggu PM' :
                         selectedItem.status === 'APPROVED_BY_PM' ? 'Verifikasi Keuangan' :
                         selectedItem.status === 'APPROVED' ? 'Dicairkan' : 'Ditolak'}
                      </span>
                    </div>
                  </div>

                  {selectedItem.ocrData?.keterangan && (
                    <div className="space-y-1.5">
                      <span className="text-stone-450 block font-bold text-[10px] uppercase">Keterangan Pengaju</span>
                      <div className="bg-[#fcfbf9] border border-stone-200 rounded-xl p-3.5 text-stone-600 italic">
                        "{selectedItem.ocrData.keterangan}"
                      </div>
                    </div>
                  )}

                  {/* Timeline / Approval History */}
                  <div className="space-y-3">
                    <span className="text-stone-850 font-bold block text-[10px] uppercase">Jejak Validasi & Approval</span>
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-stone-200">
                      {/* Step 1: Submit */}
                      <div className="relative flex flex-col">
                        <span className="absolute -left-5.5 w-3 h-3 rounded-full bg-emerald-600 border-2 border-white ring-4 ring-emerald-100" />
                        <p className="font-bold text-stone-800 text-xs">Pengajuan Terkirim</p>
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          {selectedItem.ocrData?.tanggal ? formatTanggal(selectedItem.ocrData.tanggal) : '-'}
                        </p>
                      </div>

                      {/* Step 2: PM / Finance approvals */}
                      {selectedItem.approvals && selectedItem.approvals.length > 0 ? (
                        selectedItem.approvals.map((app: any, idx: number) => (
                          <div key={idx} className="relative flex flex-col">
                            <span className={`absolute -left-5.5 w-3 h-3 rounded-full border-2 border-white ring-4 ${
                              app.status === 'REJECTED' ? 'bg-red-600 ring-red-100' : 'bg-emerald-600 ring-emerald-100'
                            }`} />
                            <p className="font-bold text-stone-800 text-xs">
                              {app.level === 'PM' ? 'Validasi Project Manager' : 'Verifikasi Tim Keuangan'}
                            </p>
                            <p className="text-stone-600 mt-0.5 text-xs">
                              Status: <span className="font-bold">{app.status === 'REJECTED' ? 'Ditolak' : 'Disetujui'}</span>
                              {app.catatan ? ` (Catatan: "${app.catatan}")` : ''}
                            </p>
                            <p className="text-[10px] text-stone-400 mt-0.5">
                              Oleh {app.approver?.nama || 'System'} · {new Date(app.timestamp).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="relative flex flex-col">
                          <span className="absolute -left-5.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-white ring-4 ring-amber-100" />
                          <p className="font-bold text-stone-800 text-xs">Menunggu Validasi</p>
                          <p className="text-[10px] text-stone-400 mt-0.5">Sedang dalam antrian persetujuan Project Manager</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedItem.strukUrl && (
                    <div className="space-y-2">
                      <span className="text-stone-400 block font-bold text-[10px] uppercase">Struk / Nota Pembelian</span>
                      <div className="border border-stone-200 rounded-xl p-2 bg-stone-50 flex items-center justify-center max-w-sm">
                        <img 
                          src={selectedItem.strukUrl} 
                          alt="Struk Pembelian" 
                          className="w-full h-auto object-contain max-h-48 rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/bukti_struk.png';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Modal */}
                <div className="px-6 py-4 border-t border-stone-150 flex justify-end bg-stone-50">
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold transition cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}