"use client";

import React, { useState } from "react";
import { 
  BookOpen, ArrowUpRight, ArrowDownRight, CheckCircle2, 
  Filter, Download, FileText, Calendar 
} from "lucide-react";

// --- MOCK DATA ---

const JURNAL_UMUM_DATA = Array(5).fill({
  id: "JE-2026-0092",
  tanggal: "18/05/2026",
  keterangan: "Pencairan reimbursement Alif Ihsan - Perlengkapan & ATK",
  ref: "RB-2026-0138",
  lines: [
    { type: "Dr", akun: "5-5101 Beban Material Proyek", debit: "1.875.000", kredit: "—" },
    { type: "Cr", akun: "1-1102 Bank BCA - Operasional", debit: "—", kredit: "1.875.000" }
  ]
});

const BUKU_BESAR_DATA = [
  {
    akun: "5-5101 Beban Material Proyek",
    saldo: "6.695.000",
    lines: [
      { tanggal: "10 Mei", keterangan: "RB-0134 Kabel CCTV", debit: "4.820.000", kredit: "—" },
      { tanggal: "13 Mei", keterangan: "RB-0134 Kabel CCTV", debit: "1.875.000", kredit: "—" }
    ]
  },
  {
    akun: "5-5201 Beban Transportasi Proyek",
    saldo: "68.000",
    lines: [
      { tanggal: "11 Mei", keterangan: "RB-0135 Gojek site visit", debit: "68.000", kredit: "—" }
    ]
  },
  {
    akun: "1-1102 Bank BCA - Operasional",
    saldo: "8.003.000",
    lines: [
      { tanggal: "10 Mei", keterangan: "Pembayaran RB-0134", debit: "—", kredit: "4.820.000" },
      { tanggal: "11 Mei", keterangan: "RB-0135 Gojek site visit", debit: "—", kredit: "68.000" },
      { tanggal: "12 Mei", keterangan: "RB-0135 Gojek site visit", debit: "—", kredit: "1.240.000" },
      { tanggal: "13 Mei", keterangan: "RB-0135 Gojek site visit", debit: "—", kredit: "1.875.000" }
    ]
  }
];

const NERACA_DATA = {
  aset: [
    { nama: "1-1101 Kas", nominal: "120.500.000" },
    { nama: "1-1102 Bank BCA", nominal: "2.840.300.000" },
    { nama: "1-1103 Bank Mandiri", nominal: "1.420.000.000" },
    { nama: "1-1201 Piutang Usaha", nominal: "3.860.000.000" },
    { nama: "1-1301 Persediaan Material", nominal: "540.200.000" }
  ],
  totalAset: "8.781.000.000",
  liabilitasEkuitas: [
    { nama: "2-2101 Hutang Reimbursement", nominal: "120.500.000" },
    { nama: "2-2102 Hutang Usaha", nominal: "1.420.000.000" },
    { nama: "3-3101 Modal Disetor", nominal: "5.000.000.000" },
    { nama: "3-3102 Laba Ditahan", nominal: "1.849.000.000" },
    { nama: "3-3103 Laba Periode Berjalan", nominal: "336.750.000" }
  ],
  totalLiabilitasEkuitas: "8.781.000.000"
};

const LABA_RUGI_DATA = {
  pendapatan: [
    { nama: "4-4101 Pendapatan Jasa Proyek", nominal: "120.500.000" }
  ],
  beban: [
    { nama: "2-2101 Hutang Reimbursement", nominal: "120.500.000" },
    { nama: "2-2102 Hutang Usaha", nominal: "1.420.000.000" },
    { nama: "3-3101 Modal Disetor", nominal: "5.000.000.000" },
    { nama: "3-3102 Laba Ditahan", nominal: "1.849.000.000" },
    { nama: "3-3103 Laba Periode Berjalan", nominal: "336.750.000" }
  ],
  totalBeban: "8.781.000.000",
  labaBersih: "336.750.000"
};

// --- COMPONENTS ---

export default function JurnalAkuntansiPage() {
  const [activeTab, setActiveTab] = useState("Jurnal Umum");

  const TABS = ["Jurnal Umum", "Buku Besar", "Neraca", "Laba Rugi"];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] overflow-y-auto bg-[#fdfcf9] custom-scrollbar">
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
        
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-[26px] font-bold text-stone-900">Jurnal Akuntansi</h1>
            <span className="px-2.5 py-0.5 bg-stone-200 text-stone-700 text-[10px] font-bold rounded-md">Tim Keuangan</span>
          </div>
          <p className="text-[13px] text-stone-500">
            Pencatatan Debit-Kredit otomatis dari setiap transaksi sistem. Sesuai standar PSAK.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[12px] font-medium text-stone-500">Total Jurnal</span>
              <BookOpen size={16} className="text-[#0277bd]" />
            </div>
            <div>
              <p className="text-[28px] font-bold text-stone-900 mb-1">2</p>
              <p className="text-[11px] text-stone-400">Mei 2026</p>
            </div>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[12px] font-medium text-stone-500">Total Debit</span>
              <ArrowUpRight size={16} className="text-[#008f5d]" />
            </div>
            <div>
              <p className="text-[28px] font-bold text-stone-900 mb-1">Rp 1.3 M</p>
            </div>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[12px] font-medium text-stone-500">Total Kredit</span>
              <ArrowDownRight size={16} className="text-rose-500" />
            </div>
            <div>
              <p className="text-[28px] font-bold text-stone-900 mb-1">Rp 1.3 M</p>
            </div>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[12px] font-medium text-stone-500">Saldo</span>
              <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 size={12} className="text-[#008f5d]" />
              </div>
            </div>
            <div>
              <p className="text-[20px] font-bold text-stone-900 mb-1">Seimbang</p>
              <p className="text-[11px] text-stone-400 flex items-center gap-1">
                <CheckCircle2 size={12} /> Dr = Cr
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b border-stone-200/60 pb-4">
          
          {/* Tabs */}
          <div className="flex items-center gap-6">
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[13px] font-bold pb-4 -mb-4 border-b-2 transition-all ${
                    isActive 
                      ? "text-stone-900 border-stone-900" 
                      : "text-stone-400 border-transparent hover:text-stone-600"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[12px] font-medium text-stone-500 mr-2">
              <Calendar size={14} /> Periode: 01 - 31 Mei 2026
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-[12px] font-bold text-stone-700 hover:bg-stone-50 transition shadow-xs">
              <Filter size={14} /> Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-[12px] font-bold text-stone-700 hover:bg-stone-50 transition shadow-xs">
              <Download size={14} /> Export Excel
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-black border border-black rounded-xl text-[12px] font-bold text-white hover:bg-stone-800 transition shadow-xs">
              <FileText size={14} /> Export PDF
            </button>
          </div>
        </div>

        {/* --- TAB CONTENTS --- */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-2">
          
          {/* 1. JURNAL UMUM */}
          {activeTab === "Jurnal Umum" && (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[900px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="py-4 px-6 text-[10px] font-bold text-stone-400 uppercase tracking-wider w-[12%]">NO. JURNAL</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-stone-400 uppercase tracking-wider w-[10%]">TANGGAL</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-stone-400 uppercase tracking-wider w-[25%]">KETERANGAN</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-stone-400 uppercase tracking-wider">AKUN</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-stone-400 uppercase tracking-wider text-right w-[10%]">DEBIT</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-stone-400 uppercase tracking-wider text-right w-[10%]">KREDIT</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-stone-400 uppercase tracking-wider text-right w-[10%]">REF</th>
                  </tr>
                </thead>
                {JURNAL_UMUM_DATA.map((trx: any, idx: number) => (
                  <tbody key={idx} className="border-b border-stone-100 last:border-0 hover:bg-[#faf9f5] transition duration-150">
                    {trx.lines.map((line: any, lIdx: number) => (
                      <tr key={lIdx}>
                        {lIdx === 0 && (
                          <>
                            <td rowSpan={trx.lines.length} className="px-6 py-5 align-top text-[12px] font-mono text-stone-600">{trx.id}</td>
                            <td rowSpan={trx.lines.length} className="px-6 py-5 align-top text-[12px] text-stone-600">{trx.tanggal}</td>
                            <td rowSpan={trx.lines.length} className="px-6 py-5 align-top text-[12px] text-stone-600">{trx.keterangan}</td>
                          </>
                        )}
                        <td className="px-6 py-2">
                          <div className="flex items-center gap-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold w-6 text-center shrink-0 ${
                              line.type === "Dr" ? "bg-emerald-50 border border-emerald-200 text-[#008f5d]" : "bg-rose-50 border border-rose-200 text-rose-600 ml-4"
                            }`}>
                              {line.type}
                            </span>
                            <span className="text-[12px] font-medium text-stone-700">{line.akun}</span>
                          </div>
                        </td>
                        <td className="px-6 py-2 text-right text-[12px] font-bold text-stone-800">{line.debit}</td>
                        <td className="px-6 py-2 text-right text-[12px] font-bold text-stone-800">{line.kredit}</td>
                        {lIdx === 0 && (
                          <td rowSpan={trx.lines.length} className="px-6 py-5 align-top text-right text-[12px] font-bold text-[#0277bd] hover:underline cursor-pointer">
                            {trx.ref}
                          </td>
                        )}
                      </tr>
                    ))}
                    {/* Spacer Row for clean layout inside tbody */}
                    <tr><td colSpan={7} className="h-3"></td></tr>
                  </tbody>
                ))}
              </table>
            </div>
          )}

          {/* 2. BUKU BESAR */}
          {activeTab === "Buku Besar" && (
            <div className="w-full flex flex-col gap-6 p-4">
              {BUKU_BESAR_DATA.map((buku: any, idx: number) => (
                <div key={idx} className="border border-stone-200 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 bg-[#fdfcf9] border-b border-stone-200 flex justify-between items-center">
                    <h3 className="text-[13px] font-bold text-stone-800">{buku.akun}</h3>
                    <p className="text-[12px] font-bold text-stone-600">Saldo: <span className="text-stone-900">{buku.saldo}</span></p>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200">
                        <th className="py-3 px-6 text-[10px] font-bold text-stone-400 uppercase w-[15%]">TANGGAL</th>
                        <th className="py-3 px-6 text-[10px] font-bold text-stone-400 uppercase">KETERANGAN</th>
                        <th className="py-3 px-6 text-[10px] font-bold text-stone-400 uppercase text-right w-[20%]">DEBIT</th>
                        <th className="py-3 px-6 text-[10px] font-bold text-stone-400 uppercase text-right w-[20%]">KREDIT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buku.lines.map((line: any, lIdx: number) => (
                        <tr key={lIdx} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50">
                          <td className="px-6 py-3.5 text-[12px] text-stone-600">{line.tanggal}</td>
                          <td className="px-6 py-3.5 text-[12px] text-stone-700">{line.keterangan}</td>
                          <td className="px-6 py-3.5 text-right text-[12px] font-bold text-stone-800">{line.debit}</td>
                          <td className="px-6 py-3.5 text-right text-[12px] font-bold text-stone-800">{line.kredit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* 3. NERACA */}
          {activeTab === "Neraca" && (
            <div className="flex flex-col lg:flex-row gap-6 p-4">
              
              {/* Kolom Aset */}
              <div className="flex-1 bg-stone-50 border border-stone-200 rounded-xl flex flex-col">
                <div className="p-6 pb-2 border-b border-stone-200/50">
                  <h3 className="text-[15px] font-bold text-stone-900 mb-6">Aset</h3>
                  <div className="space-y-4">
                    {NERACA_DATA.aset.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-[13px]">
                        <span className="text-stone-600 font-medium">{item.nama}</span>
                        <span className="text-stone-900 font-bold">{item.nominal}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-6 mt-auto bg-white rounded-b-xl border-t border-stone-200 flex justify-between items-center">
                  <span className="text-[14px] font-bold text-stone-900">Total Aset</span>
                  <span className="text-[16px] font-black text-stone-900">{NERACA_DATA.totalAset}</span>
                </div>
              </div>

              {/* Kolom Liabilitas & Ekuitas */}
              <div className="flex-1 bg-stone-50 border border-stone-200 rounded-xl flex flex-col">
                <div className="p-6 pb-2 border-b border-stone-200/50">
                  <h3 className="text-[15px] font-bold text-stone-900 mb-6">Liabilitas & Ekuitas</h3>
                  <div className="space-y-4">
                    {NERACA_DATA.liabilitasEkuitas.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-[13px]">
                        <span className="text-stone-600 font-medium">{item.nama}</span>
                        <span className="text-stone-900 font-bold">{item.nominal}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-6 mt-auto bg-white rounded-b-xl border-t border-stone-200 flex justify-between items-center">
                  <span className="text-[14px] font-bold text-stone-900">Total Aset</span>
                  <span className="text-[16px] font-black text-stone-900">{NERACA_DATA.totalLiabilitasEkuitas}</span>
                </div>
              </div>

            </div>
          )}

          {/* 4. LABA RUGI */}
          {activeTab === "Laba Rugi" && (
            <div className="p-4 flex justify-center">
              <div className="w-full max-w-4xl border border-stone-200 rounded-xl overflow-hidden bg-white">
                
                <div className="p-6 border-b border-stone-200 bg-stone-50/50">
                  <h2 className="text-[16px] font-bold text-stone-900">Laporan Laba Rugi - Mei 2026</h2>
                </div>

                <div className="p-6 space-y-6">
                  {/* Pendapatan Section */}
                  <div>
                    <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-4">PENDAPATAN</h3>
                    <div className="space-y-3 pl-2">
                      {LABA_RUGI_DATA.pendapatan.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-[13px]">
                          <span className="text-stone-600 font-medium">{item.nama}</span>
                          <span className="text-stone-900 font-bold">{item.nominal}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-stone-100 w-full my-2"></div>

                  {/* Beban Section */}
                  <div>
                    <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-4">BEBAN OPERASIONAL</h3>
                    <div className="space-y-3 pl-2 mb-6">
                      {LABA_RUGI_DATA.beban.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-[13px]">
                          <span className="text-stone-600 font-medium">{item.nama}</span>
                          <span className="text-stone-900 font-bold">{item.nominal}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center border-t border-stone-200 pt-4">
                      <span className="text-[14px] font-bold text-stone-800">Total Beban</span>
                      <span className="text-[14px] font-bold text-stone-900">{LABA_RUGI_DATA.totalBeban}</span>
                    </div>
                  </div>
                </div>

                {/* Laba Bersih Footer */}
                <div className="p-6 bg-emerald-50 border-t border-emerald-100 flex justify-between items-center rounded-b-xl">
                  <span className="text-[16px] font-bold text-[#008f5d]">Laba Bersih</span>
                  <span className="text-[20px] font-black text-[#008f5d]">Rp {LABA_RUGI_DATA.labaBersih}</span>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}