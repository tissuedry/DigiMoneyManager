'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/sidebar-karyawan';
import Header from '@/components/header-karyawan';
import { 
  PlusCircle,  
  Camera, 
  Upload, 
  Check, 
  ChevronDown, 
  ArrowLeft,
  RefreshCw
} from 'lucide-react';

export default function AjukanReimbursement() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentState, setCurrentState] = useState<'upload' | 'ocr' | 'review' | 'success'>('upload');
  const [proyek, setProyek] = useState("Renovasi Kantor Cabang Bandung");
  const [posAnggaran, setPosAnggaran] = useState("Perlengkapan & ATK");
  const [merchant, setMerchant] = useState("Gramedia Merdeka");
  const [tanggal, setTanggal] = useState("2026-05-18");
  const [nominal, setNominal] = useState("450.000");
  const [kategoriBukti, setKategoriBukti] = useState("Struk Pembelian");
  const [keterangan, setKeterangan] = useState("Pembelian kertas A4, log book, dan papan klip untuk kebutuhan administrasi site.");

  const handleUploadAction = () => setCurrentState('ocr');
  const handleOcrFinished = () => setCurrentState('review');
  const handleFormSubmit = () => setCurrentState('success');
  const handleResetForm = () => {
    setCurrentState('upload');
    setProyek("Renovasi Kantor Cabang Bandung");
    setPosAnggaran("Perlengkapan & ATK");
    setMerchant("Gramedia Merdeka");
    setTanggal("2026-05-18");
    setNominal("450.000");
    setKategoriBukti("Struk Pembelian");
    setKeterangan("Pembelian kertas A4, log book, dan papan klip untuk kebutuhan administrasi site.");
  };

  return (
    <div className="min-h-screen bg-background flex text-stone-800 font-sans selection:bg-emerald-100">
      
      {/* 1. SIDEBAR KARYAWAN */}
      <Sidebar />

      {/* OVERLAY FOR MOBILE */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* 2. MAIN AREA CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* GLOBAL HEADER BAR */}
        <Header />

        {/* CONTAINER CONTENT UTAMA */}
        <main className="p-4 lg:p-8 space-y-6 w-full mx-auto">

          <div className="space-y-1">
            <h1 className="text-[24px] font-bold tracking-tight text-stone-900">Ajukan Reimbursement</h1>
            <p className="text-[14px] text-stone-400 mt-1.5">
              Foto struk-mu, biarkan AI yang mengisi. Pengajuan akan diteruskan ke Project Manager untuk validasi.
            </p>
          </div>

          {/* 3. COMPONENT STEPPER PROGRESS BAR */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0 text-xs font-semibold px-2 relative">
              
              <div className="flex items-center gap-3 z-10">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check size={16} className="stroke-3" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-800 leading-tight">Upload struk</h4>
                  <p className="text-[10px] text-stone-400 font-medium">Foto atau gambar</p>
                </div>
              </div>

              <div className={`hidden md:block flex-1 h-0.5 mx-4 transition-colors duration-300 ${
                currentState === 'upload' ? 'bg-stone-200' : 'bg-emerald-600'
              }`} />

              <div className="flex items-center gap-3 z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 transition-all duration-300 ${
                  currentState === 'upload' ? 'bg-stone-100 text-stone-400 border border-stone-200' :
                  currentState === 'ocr' ? 'bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]' : 
                  'bg-emerald-600 text-white'
                }`}>
                  {currentState === 'upload' || currentState === 'ocr' ? '2' : <Check size={16} className="stroke-3" />}
                </div>
                <div>
                  <h4 className={`font-bold leading-tight ${currentState === 'upload' ? 'text-stone-400' : 'text-stone-800'}`}>AI OCR</h4>
                  <p className="text-[10px] text-stone-400 font-medium">Otomatis baca data</p>
                </div>
              </div>

              <div className={`hidden md:block flex-1 h-0.5 mx-4 transition-colors duration-300 ${
                currentState === 'upload' || currentState === 'ocr' ? 'bg-stone-200' : 'bg-emerald-600'
              }`} />

              <div className="flex items-center gap-3 z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 transition-all duration-300 ${
                  currentState === 'review' ? 'bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]' : 
                  currentState === 'success' ? 'bg-emerald-600 text-white' : 
                  'bg-stone-100 text-stone-400 border border-stone-200'
                }`}>
                  {currentState === 'success' ? <Check size={16} className="stroke-3" /> : '3'}
                </div>
                <div>
                  <h4 className={`font-bold leading-tight ${currentState === 'review' || currentState === 'success' ? 'text-stone-800' : 'text-stone-400'}`}>Review & kirim</h4>
                  <p className="text-[10px] text-stone-400 font-medium">Verifikasi data</p>
                </div>
              </div>

              <div className={`hidden md:block flex-1 h-0.5 mx-4 transition-colors duration-300 ${
                currentState === 'success' ? 'bg-emerald-600' : 'bg-stone-200'
              }`} />

              <div className="flex items-center gap-3 z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 transition-all duration-300 ${
                  currentState === 'success' ? 'bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]' : 
                  'bg-stone-100 text-stone-400 border border-stone-200'
                }`}>
                  4
                </div>
                <div>
                  <h4 className={`font-bold leading-tight ${currentState === 'success' ? 'text-stone-800' : 'text-stone-400'}`}>Terkirim</h4>
                  <p className="text-[10px] text-stone-400 font-medium">Menunggu approval</p>
                </div>
              </div>

            </div>
          </div>
          
          {/* STATE 1: UPLOAD STRUK */}
          {currentState === 'upload' && (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-6 space-y-4">
                <h2 className="text-lg font-bold text-stone-900">Upload foto struk atau nota</h2>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Pastikan struk terlihat jelas, tidak terlipat, dan seluruh informasi (merchant, tanggal, total) terbaca. Format yang didukung: JPG, PNG, HEIC, atau PDF dengan ukuran maksimal 10MB.
                </p>
                <div className="flex items-center gap-2.5 pt-2">
                  <button onClick={handleUploadAction} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#008F5D] hover:bg-[#007A4F] text-white text-xs font-bold rounded-xl transition shadow-sm">
                    <Camera size={14} /> Ambil foto
                  </button>
                  <button onClick={handleUploadAction} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold rounded-xl transition shadow-sm">
                    <Upload size={14} /> Unggah File
                  </button>
                </div>
              </div>
              
              <div onClick={handleUploadAction} className="md:col-span-6 border-2 border-dashed border-stone-200 hover:border-emerald-500 bg-stone-50/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition group">
                <div className="w-9 h-9 bg-white border border-stone-100 rounded-xl flex items-center justify-center text-stone-400 group-hover:text-emerald-600 shadow-sm transition">
                  <Upload size={16} />
                </div>
                <span className="text-xs font-bold text-stone-700">Klik atau drop struk di sini</span>
                <span className="text-[10px] text-stone-400">JPG, PNG, HEIC, PDF maks. 10MB</span>
              </div>
            </div>
          )}

          {/* STATE 2: AI OCR SEDANG MEMPROSES */}
          {currentState === 'ocr' && (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Sisi Kiri Mockup Gambar Struk */}
              <div className="md:col-span-4 bg-stone-100 rounded-xl overflow-hidden shadow-sm relative group aspect-3/4 max-w-60 mx-auto md:mx-0 flex items-center justify-center">
                <div className="animate-scan" />
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 pointer-events-none z-10 animate-pulse" />

                <img 
                  src="/bukti_struk.png" 
                  alt="Bukti Struk" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Sisi Kanan Logika Loading Stepper Progress */}
              <div className="md:col-span-8 space-y-5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#DDF2E8] text-[#198754] text-[10px] font-bold rounded-md">
                  <RefreshCw size={11} className="animate-spin" /> AI OCR sedang memproses
                </div>
                
                <div className="space-y-1">
                  <h2 className="text-xl font-extrabold text-stone-900">Membaca strukmu..</h2>
                  <p className="text-xs text-stone-400">
                    Sistem sedang mengekstrak nominal, tanggal transaksi, dan nama merchant. Proses biasanya selesai dalam 2 detik.
                  </p>
                </div>

                {/* Sublist Tracker Status OCR */}
                <div className="space-y-3 pt-2 text-xs font-semibold">
                  <div className="flex items-center gap-2.5 text-stone-800">
                    <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center"><Check size={10} className="stroke-3" /></div>
                    <span>Deteksi tepi struk</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-stone-800">
                    <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center"><Check size={10} className="stroke-3" /></div>
                    <span>Extrak teks (OCR)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-stone-800">
                    <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-white" /></div>
                    <span>Parsing nominal & tanggal</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-stone-300">
                    <div className="w-4 h-4 rounded-full bg-stone-100 border border-stone-200" />
                    <span>Validasi anti-fraud</span>
                  </div>
                </div>

                <div className="pt-4">
                  <button onClick={handleOcrFinished} className="px-4 py-2 bg-stone-900 text-white font-bold text-xs rounded-xl hover:bg-stone-800 transition">
                    Simulasikan Selesai Ekstrak
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STATE 3: REVIEW & LENGKAPI DATA */}
          {currentState === 'review' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Form Input Sisi Kiri */}
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm lg:col-span-8 space-y-5">
                <div className="space-y-1">
                  <div className="inline-block px-2.5 py-0.5 bg-[#DDF2E8] text-[#198754] text-[10px] font-bold rounded-md">
                    Data berhasil diekstrak
                  </div>
                  <h2 className="text-xl font-extrabold text-stone-900">Review & lengkapi data</h2>
                  <p className="text-xs text-stone-400">
                    Periksa data yang dibaca AI. Field yang ditandai dapat kamu ubah jika ada yang tidak sesuai.
                  </p>
                </div>

                <form className="space-y-4 text-xs font-bold text-stone-700" onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }}>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-stone-500 font-bold">Proyek</label>
                      <div className="relative">
                        <select 
                          value={proyek} 
                          onChange={(e) => setProyek(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-xl pl-3 pr-10 py-3 font-medium text-stone-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#008F5D] transition-all"
                        >
                          <option value="Renovasi Kantor Cabang Bandung">Renovasi Kantor Cabang Bandung</option>
                          <option value="Pembangunan Gudang Fase 2">Pembangunan Gudang Fase 2</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-4 text-stone-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-stone-500 font-bold">Pos anggaran</label>
                      <div className="relative">
                        <select 
                          value={posAnggaran}
                          onChange={(e) => setPosAnggaran(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-xl pl-3 pr-10 py-3 font-medium text-stone-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#008F5D] transition-all"
                        >
                          <option value="Perlengkapan & ATK">Perlengkapan & ATK</option>
                          <option value="Bahan Bangunan & Sipil">Bahan Bangunan & Sipil</option>
                          <option value="Transportasi & Logistik">Transportasi & Logistik</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-4 text-stone-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center gap-2">
                        <label className="text-stone-500 font-bold">Merchant</label>
                        <span className="bg-[#E0F2FE] text-[#0369A1] font-bold text-[9px] px-1.5 py-0.5 rounded-md leading-none shadow-sm select-none">dari OCR</span>
                      </div>
                      <input 
                        type="text" 
                        value={merchant} 
                        onChange={(e) => setMerchant(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-3 font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#008F5D] transition-all" 
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center gap-2">
                        <label className="text-stone-500 font-bold">Tanggal Transaksi</label>
                        <span className="bg-[#E0F2FE] text-[#0369A1] font-bold text-[9px] px-1.5 py-0.5 rounded-md leading-none shadow-sm select-none">dari OCR</span>
                      </div>
                      <div className="relative">
                        <input 
                          type="date" 
                          value={tanggal} 
                          onChange={(e) => setTanggal(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-xl px-3 py-3 font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#008F5D] transition-all [color-scheme:light]" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center gap-2">
                        <label className="text-stone-500 font-bold">Nominal (IDR)</label>
                        <span className="bg-[#E0F2FE] text-[#0369A1] font-bold text-[9px] px-1.5 py-0.5 rounded-md leading-none shadow-sm select-none">dari OCR</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3.5 font-medium text-stone-400 select-none">Rp</span>
                        <input 
                          type="text" 
                          value={nominal} 
                          onChange={(e) => setNominal(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-3 font-medium text-stone-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#008F5D] transition-all" 
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-stone-500 font-bold">Kategori Bukti</label>
                      <div className="relative">
                        <select 
                          value={kategoriBukti}
                          onChange={(e) => setKategoriBukti(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-xl pl-3 pr-10 py-3 font-medium text-stone-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#008F5D] transition-all"
                        >
                          <option value="Struk Pembelian">Struk Pembelian</option>
                          <option value="Kuitansi Resmi">Kuitansi Resmi</option>
                          <option value="Nota Kontan">Nota Kontan</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-4 text-stone-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-stone-500 font-bold">Keterangan</label>
                    <textarea 
                      rows={3} 
                      value={keterangan} 
                      onChange={(e) => setKeterangan(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-3 font-medium text-stone-800 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#008F5D] transition-all" 
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                    <button type="button" onClick={handleResetForm} className="inline-flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-stone-800 transition">
                      <ArrowLeft size={14} /> Upload ulang
                    </button>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={handleFormSubmit} className="px-4 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold rounded-xl transition">
                        Simpan sebagai draft
                      </button>
                      <button type="submit" className="px-4 py-2.5 bg-[#008F5D] hover:bg-[#007A4F] text-white text-xs font-bold rounded-xl transition shadow-sm">
                        Kirim ke project manager
                      </button>
                    </div>
                  </div>

                </form>
              </div>

              {/* Tampilan Ringkasan Bukti Struk Sisi Kanan */}
              <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm lg:col-span-4 space-y-3">
                <div>
                  <h3 className="font-extrabold text-sm text-stone-900">Bukti Struk</h3>
                  <p className="text-[10px] text-stone-400 font-medium">Hasil scan.</p>
                </div>
                <div className="w-full rounded-xl overflow-hidden bg-stone-50 border border-stone-200 aspect-3/4 relative flex items-center justify-center shadow-inner">
                  <img 
                    src="/bukti_struk.png" 
                    alt="Bukti Struk" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STATE 4: KONFIRMASI TERKIRIM */}
          {currentState === 'success' && (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm max-w-2xl mx-auto text-center space-y-6">
              <div className="w-16 h-16 bg-[#008F5D] text-white rounded-full flex items-center justify-center mx-auto shadow-md shadow-emerald-700/20">
                <Check size={36} className="stroke-3" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h2 className="text-xl font-extrabold text-stone-900">Pengajuan terkirim!</h2>
                <p className="text-xs text-stone-500 leading-relaxed font-medium">
                  Pengajuan <span className="font-mono font-bold text-stone-700">RB-2026-0143</span> senilai <span className="font-bold text-stone-900">Rp {nominal}</span> telah diteruskan ke <span className="font-bold text-stone-800">Muhammad Alvin Ababil</span> (Project Manager) untuk validasi. Kamu akan mendapat notifikasi saat statusnya berubah.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button onClick={handleResetForm} className="px-4 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold rounded-xl transition shadow-sm">
                  Kembali ke dashboard
                </button>
                <button onClick={handleResetForm} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#008F5D] hover:bg-[#007A4F] text-white text-xs font-bold rounded-xl transition shadow-sm">
                  <PlusCircle size={14} /> Ajukan lagi
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}