"use client";

import React, { useState } from "react";
import { 
  Upload, Camera, Check, ChevronLeft, Search, Image as ImageIcon
} from "lucide-react";

export default function AjukanReimbursementPage() {
  // 1: Upload Struk, 2: Scan (Simulated loading), 3: Review & Kirim, 4: Terkirim
  const [step, setStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  
  // State untuk form
  const [formData, setFormData] = useState({
    keterangan: "Pembelian Barang Kena Pajak",
    namaReimbursement: "Makan",
    nominal: "191.475",
    tanggalTransaksi: "24-05-2023",
    kategoriBukti: "Makanan & Minuman",
    catatan: ""
  });

  // Simulasi proses scan struk
  const handleUploadClick = () => {
    setStep(2);
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setStep(3);
    }, 2000); // Simulasi delay 2 detik
  };

  const handleSubmit = () => {
    setStep(4);
  };

  const handleReset = () => {
    setStep(1);
    setFormData({
      keterangan: "Pembelian Barang Kena Pajak",
      namaReimbursement: "Makan",
      nominal: "191.475",
      tanggalTransaksi: "24-05-2023",
      kategoriBukti: "Makanan & Minuman",
      catatan: ""
    });
  };

  // Komponen Stepper UI
  const Stepper = () => (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-6 flex items-center justify-between shadow-sm overflow-x-auto">
      <div className="flex items-center min-w-max w-full">
        {/* Step 1 */}
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${
            step >= 1 ? "bg-[#008f5d] text-white" : "bg-stone-100 text-stone-400"
          }`}>
            {step > 1 ? <Check size={16} /> : "1"}
          </div>
          <div>
            <p className={`text-[13px] font-bold leading-none ${step >= 1 ? "text-stone-900" : "text-stone-400"}`}>Upload struk</p>
            <p className="text-[11px] text-stone-400 mt-1">Foto atau gambar</p>
          </div>
        </div>

        <div className={`flex-1 h-[2px] mx-6 ${step >= 2 ? "bg-[#008f5d]" : "bg-stone-100"}`}></div>

        {/* Step 2 */}
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${
            step >= 2 ? "bg-[#008f5d] text-white" : "bg-stone-100 text-stone-400"
          }`}>
            {step > 2 ? <Check size={16} /> : "2"}
          </div>
          <div>
            <p className={`text-[13px] font-bold leading-none ${step >= 2 ? "text-stone-900" : "text-stone-400"}`}>Scan</p>
            <p className="text-[11px] text-stone-400 mt-1">Otomatis baca data</p>
          </div>
        </div>

        <div className={`flex-1 h-[2px] mx-6 ${step >= 3 ? "bg-[#008f5d]" : "bg-stone-100"}`}></div>

        {/* Step 3 */}
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${
            step >= 3 ? (step > 3 ? "bg-[#008f5d] text-white" : "bg-amber-400 text-amber-900") : "bg-stone-100 text-stone-400"
          }`}>
            {step > 3 ? <Check size={16} /> : "3"}
          </div>
          <div>
            <p className={`text-[13px] font-bold leading-none ${step >= 3 ? "text-stone-900" : "text-stone-400"}`}>Review & kirim</p>
            <p className="text-[11px] text-stone-400 mt-1">Verifikasi data</p>
          </div>
        </div>

        <div className={`flex-1 h-[2px] mx-6 ${step >= 4 ? "bg-[#008f5d]" : "bg-stone-100"}`}></div>

        {/* Step 4 */}
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${
            step >= 4 ? "bg-[#008f5d] text-white" : "bg-stone-100 text-stone-400"
          }`}>
            4
          </div>
          <div>
            <p className={`text-[13px] font-bold leading-none ${step >= 4 ? "text-stone-900" : "text-stone-400"}`}>Terkirim</p>
            <p className="text-[11px] text-stone-400 mt-1">Menunggu approval</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] overflow-y-auto bg-[#fdfcf9] custom-scrollbar">
      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto w-full">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-[26px] font-bold text-stone-900">Ajukan Reimbursement</h1>
            <span className="px-2.5 py-0.5 bg-stone-200 text-stone-700 text-[10px] font-bold rounded-md">Karyawan</span>
          </div>
          <p className="text-[13px] text-stone-500">
            Foto struk-mu, biarkan AI yang mengisi. Pengajuan akan diteruskan ke Project Manager untuk validasi.
          </p>
        </div>

        <Stepper />

        {/* --- KONTEN BERDASARKAN STEP --- */}
        
        {/* STEP 1 & 2: Upload Area */}
        {(step === 1 || step === 2) && (
          <div className="bg-white border border-stone-200 rounded-2xl p-8 flex flex-col md:flex-row gap-8 shadow-sm">
            <div className="flex-1">
              <h2 className="text-[18px] font-bold text-stone-900 mb-2">Upload foto struk atau nota</h2>
              <p className="text-[13px] text-stone-500 leading-relaxed mb-6">
                Pastikan struk terlihat jelas, tidak terlipat, dan seluruh informasi (tanggal, nominal) terbaca.<br/>
                Format yang didukung: JPG, PNG, HEIC, atau format gambar lainnya dengan ukuran maksimal 10MB.
              </p>
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleUploadClick}
                  disabled={isScanning}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#008f5d] text-white rounded-xl text-[13px] font-bold hover:bg-[#007a4f] transition shadow-sm disabled:opacity-50"
                >
                  <Camera size={16} /> Ambil foto
                </button>
                <button 
                  onClick={handleUploadClick}
                  disabled={isScanning}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white border border-stone-200 text-stone-700 rounded-xl text-[13px] font-bold hover:bg-stone-50 transition shadow-sm disabled:opacity-50"
                >
                  <Upload size={16} /> Unggah File
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-stone-50 border border-dashed border-stone-300 rounded-2xl flex flex-col items-center justify-center p-10 min-h-[200px]">
              {isScanning ? (
                <div className="flex flex-col items-center text-center">
                  <div className="w-8 h-8 border-4 border-stone-200 border-t-[#008f5d] rounded-full animate-spin mb-4"></div>
                  <p className="text-[14px] font-bold text-stone-700">Membaca data struk...</p>
                  <p className="text-[12px] text-stone-500 mt-1">AI sedang memproses gambar Anda.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center text-stone-400">
                  <Upload size={24} className="mb-3" />
                  <p className="text-[13px] font-bold text-stone-700 mb-1">Klik atau drop struk di sini</p>
                  <p className="text-[11px]">JPG, PNG, HEIC, dll. maks. 10MB</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Review & Lengkapi Data */}
        {step === 3 && (
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Form Area */}
            <div className="flex-[2] bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
              <div className="mb-6">
                <span className="inline-block px-2 py-1 bg-emerald-50 text-[#008f5d] text-[10px] font-bold rounded mb-3">Data berhasil diekstrak</span>
                <h2 className="text-[20px] font-bold text-stone-900 mb-1">Review & lengkapi data</h2>
                <p className="text-[13px] text-stone-500">Periksa data yang dibaca AI. Field yang ditandai dapat kamu ubah jika ada yang tidak sesuai.</p>
              </div>

              <div className="space-y-6">
                
                {/* Input Keterangan with Search */}
                <div>
                  <label className="block text-[12px] font-medium text-stone-700 mb-2">
                    Keterangan <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={formData.keterangan}
                      onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-[13px] text-stone-800 focus:outline-none focus:border-stone-400"
                    />
                    <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400" />
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[10px] font-medium uppercase tracking-wide">
                    <span className="text-stone-400">MAIN</span>
                    <span className="text-stone-800">Biaya Produksi Proyek</span>
                    <ChevronLeft size={10} className="text-stone-400 rotate-180" />
                    <span className="text-stone-400">SUB</span>
                    <span className="text-stone-800">Biaya Pengadaan Barang dan Jasa</span>
                    <ChevronLeft size={10} className="text-stone-400 rotate-180" />
                    <span className="text-stone-400">KET</span>
                    <span className="text-stone-800 truncate max-w-[150px]">{formData.keterangan}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nama Reimbursement */}
                  <div>
                    <label className="block text-[12px] font-medium text-stone-700 mb-2">
                      Nama Reimbursement <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text"
                      value={formData.namaReimbursement}
                      onChange={(e) => setFormData({...formData, namaReimbursement: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-[13px] text-stone-800 focus:outline-none focus:border-stone-400"
                    />
                  </div>
                  
                  {/* Tanggal Transaksi */}
                  <div>
                    <label className="flex items-center gap-2 text-[12px] font-medium text-stone-700 mb-2">
                      Tanggal Transaksi <span className="text-rose-500">*</span>
                      <span className="px-1.5 py-0.5 bg-sky-50 text-[#0277bd] text-[9px] font-bold rounded">dari VLM</span>
                    </label>
                    <input 
                      type="text"
                      value={formData.tanggalTransaksi}
                      onChange={(e) => setFormData({...formData, tanggalTransaksi: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-[13px] text-stone-800 focus:outline-none focus:border-stone-400"
                    />
                  </div>

                  {/* Nominal */}
                  <div>
                    <label className="flex items-center gap-2 text-[12px] font-medium text-stone-700 mb-2">
                      Nominal (IDR) <span className="text-rose-500">*</span>
                      <span className="px-1.5 py-0.5 bg-sky-50 text-[#0277bd] text-[9px] font-bold rounded">dari VLM</span>
                    </label>
                    <input 
                      type="text"
                      value={formData.nominal}
                      onChange={(e) => setFormData({...formData, nominal: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-[13px] text-stone-800 focus:outline-none focus:border-stone-400"
                    />
                  </div>

                  {/* Kategori Bukti */}
                  <div>
                    <label className="flex items-center gap-2 text-[12px] font-medium text-stone-700 mb-2">
                      Kategori Bukti <span className="text-rose-500">*</span>
                      <span className="px-1.5 py-0.5 bg-sky-50 text-[#0277bd] text-[9px] font-bold rounded">dari VLM</span>
                    </label>
                    <select 
                      value={formData.kategoriBukti}
                      onChange={(e) => setFormData({...formData, kategoriBukti: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-[13px] text-stone-800 focus:outline-none focus:border-stone-400 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center]"
                    >
                      <option value="Makanan & Minuman">Makanan & Minuman</option>
                      <option value="Transportasi">Transportasi</option>
                      <option value="Perlengkapan">Perlengkapan</option>
                    </select>
                  </div>
                </div>

                {/* Catatan */}
                <div>
                  <label className="flex items-center gap-2 text-[12px] font-medium text-stone-700 mb-2">
                    Catatan
                    <span className="px-1.5 py-0.5 bg-sky-50 text-[#0277bd] text-[9px] font-bold rounded">dari VLM</span>
                  </label>
                  <textarea 
                    rows={3}
                    value={formData.catatan}
                    onChange={(e) => setFormData({...formData, catatan: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-[13px] text-stone-800 focus:outline-none focus:border-stone-400 resize-none"
                  />
                </div>

                {/* Actions Bottom */}
                <div className="flex items-center justify-between pt-6 border-t border-stone-100">
                  <button 
                    onClick={() => setStep(1)}
                    className="text-[13px] font-medium text-stone-500 hover:text-stone-800 flex items-center gap-1 transition"
                  >
                    <ChevronLeft size={16} /> Upload ulang
                  </button>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setStep(1)}
                      className="px-6 py-2.5 text-[13px] font-bold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition shadow-sm"
                    >
                      Batal
                    </button>
                    <button 
                      onClick={handleSubmit}
                      className="px-6 py-2.5 text-[13px] font-bold text-white bg-[#008f5d] border border-[#008f5d] rounded-xl hover:bg-[#007a4f] transition shadow-sm"
                    >
                      Kirim ke project manager
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Preview Struk Area */}
            <div className="flex-1 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm h-fit sticky top-6">
              <div className="mb-4">
                <h3 className="text-[15px] font-bold text-stone-900">Bukti Struk</h3>
                <p className="text-[12px] text-stone-500">Hasil scan. Klik gambar untuk memperbesar.</p>
              </div>
              
              {/* Dummy Image Receipt Simulation */}
              <div className="w-full bg-[#f3efe8] rounded-xl border border-stone-200 overflow-hidden flex flex-col relative">
                <div className="absolute inset-0 bg-stone-900/0 hover:bg-stone-900/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer">
                  <div className="bg-white/90 px-3 py-1.5 rounded-lg text-[12px] font-bold text-stone-700 flex items-center gap-2 shadow-sm">
                    <ImageIcon size={14} /> Perbesar
                  </div>
                </div>
                {/* Konten struk mirip dengan gambar asli */}
                <div className="p-6 font-mono text-[10px] leading-tight text-stone-700 flex-1">
                   <p className="text-center font-bold text-[12px] mb-2">BAKSO BOEDJANGAN</p>
                   <p className="text-center mb-4">Jl. Kenang Selatan 1 No.20<br/>Surabaya, 021-33335800</p>
                   
                   <p className="mb-3">Tanggal: 24-05-2023 16:45<br/>Kasir : Hafiz<br/>No Trx : JL/0022305241645/004<br/>Member: CASH<br/>Channel: Dine In</p>
                   
                   <div className="border-t border-dashed border-stone-400 py-3 space-y-2">
                     <div className="flex justify-between">
                       <span>Bakso<br/>2 x 12.000</span><span>24.000</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Cah kangkung<br/>3 x 7.500</span><span>22.500</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Cap Jay<br/>3 x 17.000</span><span>51.000</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Cumi Goreng Tepung Gurih<br/>3 x 25.000</span><span>75.000</span>
                     </div>
                   </div>

                   <div className="border-t border-dashed border-stone-400 pt-3 space-y-1 font-bold">
                     <div className="flex justify-between"><span>Subtotal</span><span>172.500</span></div>
                     <div className="flex justify-between"><span>Pajak</span><span>18.975</span></div>
                     <div className="flex justify-between text-[12px] mt-2"><span>Total</span><span>191.475</span></div>
                     <div className="flex justify-between mt-2"><span>TUNAI</span><span>200.000</span></div>
                     <div className="flex justify-between"><span>Kembalian</span><span>8.525</span></div>
                   </div>
                   
                   <p className="text-center mt-6 text-[9px] text-stone-500">** Supported by bee.id **</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* STEP 4: Success State */}
        {step === 4 && (
          <div className="bg-white border border-stone-200 rounded-2xl p-12 shadow-sm flex flex-col items-center justify-center max-w-2xl mx-auto mt-10">
            <div className="w-16 h-16 bg-[#008f5d] rounded-full flex items-center justify-center mb-6 shadow-md">
              <Check size={32} className="text-white" strokeWidth={3} />
            </div>
            
            <h2 className="text-[24px] font-bold text-stone-900 mb-3 text-center">Pengajuan terkirim!</h2>
            <p className="text-[14px] text-stone-500 text-center max-w-md leading-relaxed mb-8">
              Pengajuan reimbursement senilai <strong className="text-stone-800">Rp {formData.nominal}</strong> telah diteruskan ke Project Manager untuk validasi. Kamu akan mendapat notifikasi saat statusnya berubah.
            </p>

            <div className="flex items-center gap-4">
              <button className="px-6 py-2.5 text-[13px] font-bold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition shadow-sm">
                Kembali ke dashboard
              </button>
              <button 
                onClick={handleReset}
                className="px-6 py-2.5 text-[13px] font-bold text-white bg-[#008f5d] border border-[#008f5d] rounded-xl hover:bg-[#007a4f] transition shadow-sm flex items-center gap-2"
              >
                Ajukan lagi
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}