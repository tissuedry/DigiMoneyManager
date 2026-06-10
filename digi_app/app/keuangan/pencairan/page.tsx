"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { 
  Download, Zap, X
} from "lucide-react";

import Sidebar from '@/components/sidebar';
import Header from '@/components/header';

function formatTanggal(iso: string) {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length < 3) return iso;
  const [y, m, d] = parts;
  const bulan = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  const mIdx = parseInt(m) - 1;
  return `${parseInt(d)} ${bulan[mIdx] || m} ${y}`;
}

function PencairanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const idParam = searchParams.get("id");
  const selectParam = searchParams.get("select");

  const [reimbursements, setReimbursements] = useState<any[]>([]);
  const [coaList, setCoaList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'diteruskan' | 'selesai'>('diteruskan');
  const [selectedId, setSelectedId] = useState<string | null>(idParam);
  const [isAllSelected, setIsAllSelected] = useState(selectParam === 'all');

  const handleSelect = (id: string | null, all = false) => {
    setIsAllSelected(all);
    setSelectedId(id);
    if (all) {
      router.replace(`${pathname}?select=all`, { scroll: false });
    } else if (id) {
      router.replace(`${pathname}?id=${id}`, { scroll: false });
    } else {
      router.replace(pathname, { scroll: false });
    }
  };
  const [debitAccount, setDebitAccount] = useState("");
  const [creditAccount, setCreditAccount] = useState("");
  const [catatan, setCatatan] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [rRes, cRes] = await Promise.all([
        fetch('/api/reimbursements'),
        fetch('/api/coa')
      ]);
      const rData = await rRes.json();
      const cData = await cRes.json();
      
      if (rData.reimbursements) {
        setReimbursements(rData.reimbursements);
      }
      if (cData.coa) {
        setCoaList(cData.coa);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter list based on active tab
  const filteredList = reimbursements.filter((item) => {
    const matchesTab = activeTab === 'diteruskan' 
      ? item.status === 'APPROVED_BY_PM'
      : (item.status === 'APPROVED' || item.status === 'REJECTED');
    
    const matchesSearch = searchQuery 
      ? (item.user?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         item.proyek?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         String(item.id).toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    return matchesTab && matchesSearch;
  });

  // Count items for each tab
  const countDiteruskan = reimbursements.filter(item => item.status === 'APPROVED_BY_PM').length;
  const countSelesai = reimbursements.filter(item => item.status === 'APPROVED' || item.status === 'REJECTED').length;

  // Selected item
  const selectedItem = filteredList.find(item => String(item.id) === String(selectedId)) || filteredList[0] || null;

  // Update selectedId if selectedItem is not in the filtered list
  useEffect(() => {
    if (selectedItem && String(selectedItem.id) !== String(selectedId)) {
      setSelectedId(String(selectedItem.id));
    }
  }, [filteredList, selectedItem, selectedId]);

  // Set default debit/credit accounts based on posAnggaran
  useEffect(() => {
    if (selectedItem && selectedItem.status === 'APPROVED_BY_PM') {
      setCreditAccount("10000");

      // Guess debit account based on posAnggaran name
      const posName = selectedItem.posAnggaran?.deskripsi?.toLowerCase() || "";
      if (posName.includes("perlengkapan") || posName.includes("atk")) {
        setDebitAccount("50001");
      } else if (posName.includes("bahan") || posName.includes("sipil") || posName.includes("bangunan")) {
        setDebitAccount("50002");
      } else if (posName.includes("transportasi") || posName.includes("logistik")) {
        setDebitAccount("50003");
      } else {
        setDebitAccount("");
      }
      setCatatan("");
    }
  }, [selectedId, selectedItem]);

  const handleProcess = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedItem) return;

    if (action === 'APPROVE') {
      if (!debitAccount || !creditAccount) {
        alert("Harap pilih Akun Debit dan Akun Kredit terlebih dahulu.");
        return;
      }
      if (!confirm("Apakah Anda yakin ingin mencairkan pengajuan ini dan men-generate jurnal?")) {
        return;
      }
    } else {
      if (!confirm("Apakah Anda yakin ingin menolak pengajuan ini?")) {
        return;
      }
    }

    try {
      const res = await fetch(`/api/reimbursements/${selectedItem.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          catatan,
          noAkunDebit: debitAccount,
          noAkunKredit: creditAccount
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(action === 'APPROVE' ? "Pengajuan berhasil dicairkan dan jurnal akuntansi telah di-generate!" : "Pengajuan berhasil ditolak.");
        fetchData();
      } else {
        alert("Gagal memproses pengajuan: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem saat memproses pengajuan.");
    }
  };

  const pmApproval = selectedItem?.approvals?.find((a: any) => a.level === 'PM');
  const financeApproval = selectedItem?.approvals?.find((a: any) => a.level === 'KEUANGAN');

  return (
    <div className="flex min-h-screen w-full bg-[#f4f2ec] text-stone-800 overflow-hidden">
      
      {/* Sidebar */}
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        userRole="Tim Keuangan"
      />

      {/* ================= AREA KONTEN (KANAN) ================= */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f6f4f0]">

        {/* Header dipindah ke sini, di dalam kolom kanan */}
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} />

        {/* Halaman Utama */}
        <main className="flex-1 overflow-hidden flex flex-col px-8 pb-8 pt-2">
          
          {/* Bagian Judul & Filter (Lebar Penuh) */}
          <div className="shrink-0 mb-6">
            <h1 className="text-2xl font-bold text-[#14130F]">Antrian Pencairan</h1>
            <p className="text-[13px] text-stone-500 mt-1.5">
              Pengajuan yang telah divalidasi PM dan siap dicairkan. Jurnal Debit-Kredit akan ter-generate otomatis.
            </p>

            <div className="flex items-center gap-2 mt-6">
              <div className="flex bg-white rounded-full border border-stone-200/80 p-1 shadow-sm">
                <button 
                  onClick={() => { setActiveTab('diteruskan'); handleSelect(null); }}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-full transition ${
                    activeTab === 'diteruskan' 
                      ? "bg-stone-100 text-stone-800 shadow-sm" 
                      : "text-stone-400 hover:text-stone-600"
                  }`}
                >
                  Diteruskan ({countDiteruskan})
                </button>
                <button 
                  onClick={() => { setActiveTab('selesai'); handleSelect(null); }}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-full transition ${
                    activeTab === 'selesai' 
                      ? "bg-stone-100 text-stone-800 shadow-sm" 
                      : "text-stone-400 hover:text-stone-600"
                  }`}
                >
                  Selesai ({countSelesai})
                </button>
              </div>

              <input
                type="text"
                placeholder="Cari nama pengaju atau proyek..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ml-auto px-4 py-1.5 text-xs font-medium bg-white border border-stone-200 rounded-full shadow-sm outline-none focus:border-stone-400 transition w-48 sm:w-64"
              />
            </div>
          </div>

          {/* Kolom Flex Bawah (List dan Detail) */}
          <div className="flex flex-col lg:flex-row flex-1 gap-6 min-h-0 overflow-y-auto lg:overflow-hidden">
            
            {/* === KOLOM KIRI: DAFTAR ANTRIAN === */}
            <div className="w-full lg:w-[45%] flex flex-col gap-3 shrink-0 lg:overflow-y-auto pb-4 pr-1 custom-scrollbar">
              {isLoading ? (
                <div className="text-center py-8 text-xs font-semibold text-stone-400">Memuat antrian pencairan...</div>
              ) : filteredList.length === 0 ? (
                <div className="text-center py-8 text-xs font-semibold text-stone-400">Tidak ada pengajuan.</div>
              ) : (
                filteredList.map((item) => {
                  const initials = item.user?.nama ? item.user.nama.split(' ').map((n: any) => n[0]).join('').substring(0, 2).toUpperCase() : 'KY';
                  const active = isAllSelected || String(selectedItem?.id) === String(item.id);
                  const formattedNominal = `Rp ${Number(item.nominal).toLocaleString('id-ID')}`;
                  
                  // Get project desc
                  const projectDesc = `${item.proyek?.nama || 'Proyek'} · ${item.posAnggaran?.deskripsi || 'Kategori'}`;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(String(item.id))}
                      className={`p-4 rounded-xl border flex flex-col gap-2 transition cursor-pointer ${
                        active
                          ? "bg-[#e2f1eb] border-[#b8e0d0] shadow-sm"
                          : "bg-white border-stone-200 hover:border-stone-300 shadow-sm"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                            active ? "bg-[#b8e0d0] text-[#117a5b]" : "bg-[#e0e0e0] text-stone-600"
                          }`}>
                            {initials}
                          </div>
                          <div className="mt-0.5">
                            <div className="flex items-center gap-1">
                              <span className="text-[13px] font-bold text-stone-900">{item.user?.nama || 'Karyawan'}</span>
                              <span className="text-[11px] text-stone-400">· {String(item.id).substring(0, 8).toUpperCase()}</span>
                            </div>
                            <p className="text-[11px] text-stone-500 mt-0.5">{projectDesc}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="text-sm font-bold text-stone-900">{formattedNominal}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            item.status === 'APPROVED_BY_PM' ? 'text-[#0277bd] bg-[#e1f5fe] border-[#b3e5fc]' :
                            item.status === 'APPROVED' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                            'text-red-700 bg-red-50 border-red-200'
                          }`}>
                            {item.status === 'APPROVED_BY_PM' ? 'Verifikasi Keuangan' :
                             item.status === 'APPROVED' ? 'Dicairkan' : 'Ditolak'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* === KOLOM KANAN: DETAIL PENGAJUAN === */}
            <div className="flex-1 flex flex-col bg-white border border-stone-200/80 rounded-2xl shadow-sm overflow-hidden h-full">
              {!selectedItem ? (
                <div className="flex-1 flex items-center justify-center text-stone-400 font-semibold text-xs">
                  Pilih pengajuan dari daftar antrian untuk melihat detail
                </div>
              ) : (
                <>
                  {/* Body Detail (Scrollable) */}
                  <div className="flex-1 overflow-y-auto p-7 space-y-6">
                    
                    {/* Header Detail */}
                    <div className="flex justify-between items-start border-b border-stone-100 pb-5">
                      <div>
                        <span className="text-[11px] text-stone-400 font-mono tracking-wider">{selectedItem.id}</span>
                        <h2 className="text-2xl font-bold text-stone-900 mt-1">{selectedItem.proyek?.nama}</h2>
                        <p className="text-[11px] text-stone-500 mt-1.5">
                          oleh <span className="font-semibold text-stone-800">{selectedItem.user?.nama}</span> · {selectedItem.ocrData?.tanggal ? formatTanggal(selectedItem.ocrData.tanggal) : '-'}
                        </p>
                      </div>
                      <span className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border ${
                        selectedItem.status === 'APPROVED_BY_PM' ? 'text-[#0277bd] bg-[#e1f5fe] border-[#b3e5fc]' :
                        selectedItem.status === 'APPROVED' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                        'text-red-700 bg-red-50 border-red-200'
                      }`}>
                        {selectedItem.status === 'APPROVED_BY_PM' ? 'Verifikasi Keuangan' :
                         selectedItem.status === 'APPROVED' ? 'Dicairkan' : 'Ditolak'}
                      </span>
                    </div>

                    {/* Tabel Informasi */}
                    <div className="space-y-0.5 text-[12px]">
                      <div className="grid grid-cols-3 py-2.5 border-b border-stone-100">
                        <span className="text-stone-400">Proyek</span>
                        <span className="col-span-2 font-medium text-stone-800 text-right md:text-left">{selectedItem.proyek?.nama}</span>
                      </div>
                      <div className="grid grid-cols-3 py-2.5 border-b border-stone-100">
                        <span className="text-stone-400">Pos Anggaran</span>
                        <span className="col-span-2 font-medium text-stone-800 text-right md:text-left">{selectedItem.posAnggaran?.deskripsi}</span>
                      </div>
                      <div className="grid grid-cols-3 py-2.5 border-b border-stone-100">
                        <span className="text-stone-400">Tanggal Transaksi</span>
                        <span className="col-span-2 font-medium text-stone-800 text-right md:text-left">{selectedItem.ocrData?.tanggal ? formatTanggal(selectedItem.ocrData.tanggal) : '-'}</span>
                      </div>
                      <div className="grid grid-cols-3 py-2.5 border-b border-stone-100">
                        <span className="text-stone-400">Pengaju</span>
                        <span className="col-span-2 font-medium text-stone-800 text-right md:text-left">{selectedItem.user?.nama}</span>
                      </div>
                      <div className="grid grid-cols-3 py-2.5 border-b border-stone-100">
                        <span className="text-stone-400">Divalidasi PM</span>
                        <span className="col-span-2 font-medium text-stone-800 text-right md:text-left">{pmApproval?.approver?.nama || '-'}</span>
                      </div>
                      <div className="grid grid-cols-3 py-2.5 border-b border-stone-100">
                        <span className="text-stone-400">Nominal</span>
                        <span className="col-span-2 font-bold text-stone-900 text-right md:text-left">Rp {Number(selectedItem.nominal).toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    {/* Preview Struk Upload */}
                    {selectedItem.strukUrl && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-stone-500">Bukti Struk</label>
                        <div className="border border-stone-200 rounded-xl overflow-hidden max-w-xs bg-stone-50 p-2 flex items-center justify-center">
                          <img 
                            src={selectedItem.strukUrl} 
                            alt="Bukti Struk" 
                            className="w-full h-auto object-contain max-h-48 rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/bukti_struk.png';
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Box Jurnal Akuntansi */}
                    <div className="bg-[#f9f8f6] border border-stone-200/80 rounded-xl p-4">
                      <div className="flex justify-between items-center text-[10px] text-stone-400 mb-3">
                        <span>Preview Jurnal Akuntansi (Auto-generated)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <h4 className="text-[13px] font-bold text-stone-800 bg-stone-200/50 px-2 py-0.5 rounded font-mono">
                          {selectedItem.jurnalAkuntansi?.[0] ? `JE-${String(selectedItem.jurnalAkuntansi[0].id).substring(0, 8).toUpperCase()}` : 'JE-DRAFT'}
                        </h4>
                        <span className="text-[11px] text-stone-400">
                          {selectedItem.ocrData?.tanggal ? formatTanggal(selectedItem.ocrData.tanggal) : '-'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mb-4 mt-2">
                        Pencairan reimbursement {selectedItem.user?.nama} - {selectedItem.posAnggaran?.deskripsi}
                      </p>
                      
                      {selectedItem.status === 'APPROVED_BY_PM' ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                              Akun Debit (Dr) - Beban Proyek
                            </label>
                            <select
                              value={debitAccount}
                              onChange={(e) => setDebitAccount(e.target.value)}
                              className="w-full text-xs font-mono bg-white border border-stone-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                              <option value="">-- Pilih Akun Debit --</option>
                              {coaList.map((coa) => (
                                <option key={coa.nomorAkun} value={coa.nomorAkun}>
                                  {coa.nomorAkun} - {coa.namaAkun} ({coa.tipe})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                              Akun Kredit (Cr) - Kas & Bank
                            </label>
                            <select
                              value={creditAccount}
                              onChange={(e) => setCreditAccount(e.target.value)}
                              className="w-full text-xs font-mono bg-white border border-stone-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                              <option value="">-- Pilih Akun Kredit --</option>
                              {coaList.map((coa) => (
                                <option key={coa.nomorAkun} value={coa.nomorAkun}>
                                  {coa.nomorAkun} - {coa.namaAkun} ({coa.tipe})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 text-[11px] font-mono">
                          {selectedItem.jurnalAkuntansi && selectedItem.jurnalAkuntansi.length > 0 ? (
                            selectedItem.jurnalAkuntansi.map((j: any) => (
                              <React.Fragment key={j.id}>
                                <div className="flex justify-between items-center">
                                  <span className="text-stone-600">
                                    <span className="text-emerald-600 font-bold mr-1">Dr</span> {j.noAkunDebit} - {coaList.find(c => c.nomorAkun === j.noAkunDebit)?.namaAkun || 'Beban'}
                                  </span>
                                  <span className="text-stone-800 font-medium">Rp {Number(j.nominal).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between items-center pl-4">
                                  <span className="text-stone-600">
                                    <span className="text-red-600 font-bold mr-1">Cr</span> {j.noAkunKredit} - {coaList.find(c => c.nomorAkun === j.noAkunKredit)?.namaAkun || 'Kas/Bank'}
                                  </span>
                                  <span className="text-stone-800 font-medium">Rp {Number(j.nominal).toLocaleString('id-ID')}</span>
                                </div>
                              </React.Fragment>
                            ))
                          ) : (
                            <div className="text-stone-400 italic text-[11px]">Tidak ada rincian jurnal.</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Keterangan */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-stone-500">Keterangan dari pengaju</label>
                      <div className="bg-[#fcfbf9] border border-stone-200 rounded-xl p-3.5 text-[12px] text-stone-600 italic leading-relaxed">
                        "{selectedItem.ocrData?.keterangan || selectedItem.ocrData?.raw || '-'}"
                      </div>
                    </div>

                    {/* Catatan PM */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-stone-500">Catatan dari Project Manager ({pmApproval?.approver?.nama || 'PM'})</label>
                      <div className="bg-[#fcfbf9] border border-stone-200 rounded-xl p-3.5 text-[12px] text-stone-500">
                        {pmApproval?.catatan || '-'}
                      </div>
                    </div>

                    {/* Catatan / Keterangan Keuangan (Input) */}
                    {selectedItem.status === 'APPROVED_BY_PM' && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-stone-500">Catatan Keuangan (Opsional)</label>
                        <textarea
                          placeholder="Tambahkan catatan jika ada..."
                          value={catatan}
                          onChange={(e) => setCatatan(e.target.value)}
                          className="w-full bg-[#fcfbf9] border border-stone-200 rounded-xl p-3.5 text-[12px] text-stone-800 focus:outline-none focus:border-stone-400 transition resize-none h-20"
                        />
                      </div>
                    )}

                    {/* Alur Approval Stepper */}
                    <div className="space-y-3 pt-2">
                      <label className="text-[12px] font-bold text-stone-800">Alur Approval</label>
                      <div className="relative pl-[26px] mt-2 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-stone-200">
                        
                        {/* Step 1 */}
                        <div className="relative flex items-start gap-3">
                          <div className="absolute -left-[30px] bg-[#008f5d] rounded-full w-[20px] h-[20px] flex items-center justify-center z-10 border-[3px] border-white ring-1 ring-white/50">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          </div>
                          <div className="text-[12px] leading-tight mt-0.5">
                            <p className="font-medium text-stone-800">Pengajuan dikirim</p>
                            <p className="text-[10px] text-stone-400 mt-1">
                              {selectedItem.user?.nama} · {selectedItem.ocrData?.tanggal ? formatTanggal(selectedItem.ocrData.tanggal) : '-'}
                            </p>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="relative flex items-start gap-3">
                          <div className={`absolute -left-[30px] rounded-full w-[20px] h-[20px] flex items-center justify-center z-10 border-[3px] border-white ring-1 ring-white/50 ${
                            pmApproval ? "bg-[#008f5d]" : "bg-stone-200"
                          }`}>
                            {pmApproval ? (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            ) : null}
                          </div>
                          <div className="text-[12px] leading-tight mt-0.5">
                            <p className={`font-medium ${pmApproval ? "text-stone-800" : "text-stone-500"}`}>Validasi Project Manager</p>
                            <p className="text-[10px] text-stone-400 mt-1">
                              {pmApproval ? `${pmApproval.approver?.nama} · ${new Date(pmApproval.timestamp).toLocaleDateString('id-ID')}` : 'Menunggu · -'}
                            </p>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className="relative flex items-start gap-3">
                          <div className={`absolute -left-[30px] rounded-full w-[20px] h-[20px] flex items-center justify-center z-10 border-[3px] border-white ring-1 ring-white/50 ${
                            selectedItem.status === 'APPROVED_BY_PM' ? 'bg-[#f59e0b]' :
                            financeApproval ? 'bg-[#008f5d]' : 'bg-stone-200'
                          }`}>
                            {financeApproval ? (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            ) : selectedItem.status === 'APPROVED_BY_PM' ? (
                              <span className="text-[10px] font-bold text-white">3</span>
                            ) : null}
                          </div>
                          <div className="text-[12px] leading-tight mt-0.5">
                            <p className={`font-medium ${selectedItem.status === 'APPROVED_BY_PM' || financeApproval ? 'text-stone-800' : 'text-stone-500'}`}>Verifikasi Tim Keuangan</p>
                            <p className="text-[10px] text-stone-400 mt-1">
                              {financeApproval ? `${financeApproval.approver?.nama} · ${new Date(financeApproval.timestamp).toLocaleDateString('id-ID')}` :
                               selectedItem.status === 'APPROVED_BY_PM' ? 'Menunggu · -' : 'Dilewati / Ditolak'}
                            </p>
                          </div>
                        </div>

                        {/* Step 4 */}
                        <div className="relative flex items-start gap-3">
                          <div className={`absolute -left-[30px] rounded-full w-[20px] h-[20px] flex items-center justify-center z-10 border-[3px] border-white ring-1 ring-white/50 ${
                            selectedItem.status === 'APPROVED' ? 'bg-[#008f5d]' : 'bg-stone-200'
                          }`}>
                            {selectedItem.status === 'APPROVED' ? (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            ) : null}
                          </div>
                          <div className="text-[12px] leading-tight mt-0.5">
                            <p className={`font-medium ${selectedItem.status === 'APPROVED' ? 'text-stone-800' : 'text-stone-500'}`}>Dicairkan</p>
                            <p className="text-[10px] text-stone-400 mt-1">
                              {selectedItem.status === 'APPROVED' ? 'Jurnal otomatis generated' : '-'}
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* Action Footer (Fixed di bawah) */}
                  <div className="border-t border-stone-200 px-7 py-4 bg-white flex items-center justify-between shrink-0">
                    <a 
                      href={selectedItem.strukUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 transition px-3 py-2 rounded-lg border border-stone-200"
                    >
                      <Download size={14} />
                      <span>Lihat bukti</span>
                    </a>

                    {selectedItem.status === 'APPROVED_BY_PM' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleProcess('REJECT')}
                          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#9c3131] hover:bg-[#832626] transition px-5 py-2.5 rounded-lg shadow-sm cursor-pointer"
                        >
                          <X size={14} strokeWidth={2.5} />
                          <span>Tolak</span>
                        </button>
                        <button 
                          onClick={() => handleProcess('APPROVE')}
                          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#008f5d] hover:bg-[#00754c] transition px-5 py-2.5 rounded-lg shadow-sm cursor-pointer"
                        >
                          <Zap size={14} fill="currentColor" className="text-white" />
                          <span>Cairkan & Generate Jurnal</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function PencairanPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen w-full items-center justify-center bg-[#f6f4f0]">
        <div className="text-stone-400 font-medium text-xs">Memuat halaman...</div>
      </div>
    }>
      <PencairanContent />
    </Suspense>
  );
}