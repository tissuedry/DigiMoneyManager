"use client";

import React, { useState } from "react";
import { ChevronDown, Edit3, Plus, Check, X, ChevronRight } from "lucide-react";
import DetailAnggaranModal from "./DetailAnggaranModal";
import AjukanRealisasiModal from "./AjukanRealisasiModal"; // <-- Impor modal ajukan realisasi

const PROJECT_LIST = [
  {
    id: "PRJ-2026-014",
    nama: "Penyebaran Laptop Daerah Bojongsoang",
    status: "Active",
    keterangan: "Program dari Zeus",
    totalNilai: "Rp 5.000.000.000",
    realisasi: "Rp 594.000.000",
    sisa: "Rp 4.406.000.000",
    warningSisa: "Rp 1.000.000.000 belum dialokasikan",
    posAnggaran: [
      { nama: "Biaya Marketing Proyek", alokasi: "Rp 1.000.000.000", terpakai: "0%", sisa: "Rp 1.000.000.000", color: "bg-emerald-600" },
      { nama: "Biaya Administrasi Proyek", alokasi: "Rp 1.000.000.000", terpakai: "0%", sisa: "Rp 1.000.000.000", color: "bg-emerald-600" },
      { nama: "Biaya Produksi Proyek", alokasi: "Rp 2.000.000.000", terpakai: "30%", sisa: "Rp 1.406.000.000", color: "bg-emerald-600" },
    ],
    tim: [
      { role: "Project Manager", nama: "Muhammad Zaini", divisi: "-" },
      { role: "Karyawan", nama: "Muhammad Alvin Ababil", divisi: "Cyclops" },
    ],
    reimburseSudah: "Rp 594.000.000",
    reimburseBelum: "Rp 0",
  },
  {
    id: "PRJ-2026-015",
    nama: "FTTH RANCAMANYAR",
    status: "Active",
    keterangan: "Infrastruktur Jaringan",
    totalNilai: "Rp 3.500.000.000",
    realisasi: "Rp 200.000.000",
    sisa: "Rp 3.300.000.000",
    warningSisa: "Rp 500.000.000 belum dialokasikan",
    posAnggaran: [
      { nama: "Biaya Material Fiber", alokasi: "Rp 2.000.000.000", terpakai: "10%", sisa: "Rp 1.800.000.000", color: "bg-emerald-600" },
      { nama: "Biaya Pekerja Lapangan", alokasi: "Rp 1.000.000.000", terpakai: "0%", sisa: "Rp 1.000.000.000", color: "bg-emerald-600" },
    ],
    tim: [
      { role: "Project Manager", nama: "Muhammad Zaini", divisi: "-" },
    ],
    reimburseSudah: "Rp 200.000.000",
    reimburseBelum: "Rp 50.000.000",
  }
];

export default function ProjectManagerPage() {
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAjukanPosOpen, setIsAjukanPosOpen] = useState(false);
  const [isDetailAnggaranOpen, setIsDetailAnggaranOpen] = useState(false);
  const [isAjukanRealisasiOpen, setIsAjukanRealisasiOpen] = useState(false); // State Modal Ajukan Realisasi

  // State interaktif dalam Modal Ajukan Pos
  const [activeSubAccordion, setActiveSubAccordion] = useState(true);
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [isAddingKet, setIsAddingKet] = useState(false);
  const [subName, setSubName] = useState("");
  const [ketName, setKetName] = useState("");
  const [submittedCount, setSubmittedCount] = useState(0);

  const currentProject = PROJECT_LIST[selectedProjectIndex];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-full flex flex-col bg-[#f9f8f4] relative">
      
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[28px] font-bold text-stone-900 leading-tight">Kelola Proyek</h1>
            <span className="px-2.5 py-0.5 bg-stone-200 text-stone-700 text-[11px] font-bold rounded-md">Project Manager</span>
          </div>
          <p className="text-stone-500 mt-1 text-[14px]">
            Pantau anggaran, ajukan pos baru, dan kelola tim untuk proyekmu.
          </p>
        </div>

        {/* Dropdown Pemilih Proyek & Tombol Edit */}
        <div className="flex items-center gap-3 relative">
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-stone-800 text-sm font-bold shadow-xs hover:bg-stone-50 transition cursor-pointer"
            >
              <span className="truncate max-w-[200px]">{currentProject.nama}</span>
              <ChevronDown size={16} className="text-stone-400 shrink-0" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden z-50 animate-in fade-in duration-150">
                <div className="p-2 border-b border-stone-100 bg-[#fdfcf9] text-[11px] font-bold text-stone-400 uppercase tracking-wider px-3">
                  Pilih Proyek Aktif
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {PROJECT_LIST.map((proj, idx) => (
                    <button
                      key={proj.id}
                      onClick={() => {
                        setSelectedProjectIndex(idx);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-[13px] font-medium transition flex items-center justify-between cursor-pointer hover:bg-stone-50 ${
                        selectedProjectIndex === idx ? "bg-emerald-50/50 text-[#008f5d] font-bold" : "text-stone-700"
                      }`}
                    >
                      <div>
                        <p className="leading-snug">{proj.nama}</p>
                        <span className="text-[10px] text-stone-400">{proj.id}</span>
                      </div>
                      {selectedProjectIndex === idx && <Check size={16} className="text-[#008f5d]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-stone-700 text-sm font-bold shadow-xs hover:bg-stone-50 transition cursor-pointer shrink-0">
            <Edit3 size={15} /> Edit Proyek
          </button>
        </div>
      </div>

      {/* Main Card: Ringkasan Proyek */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 mb-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-stone-900">{currentProject.nama}</h2>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-[#008f5d] border border-emerald-200 text-[11px] font-bold rounded-md">
                {currentProject.status}
              </span>
            </div>
            <p className="text-[12px] text-stone-400 mt-0.5">{currentProject.id} · {currentProject.keterangan}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Total Nilai Proyek</span>
            <p className="text-[20px] font-black text-stone-900">{currentProject.totalNilai}</p>
          </div>
        </div>

        <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#008f5d] w-[35%]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-stone-50/80 border border-stone-200/60 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#008f5d]" /> Realisasi
            </span>
            <p className="text-[18px] font-bold text-stone-900">{currentProject.realisasi}</p>
          </div>
          <div className="p-4 bg-stone-50/80 border border-stone-200/60 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-stone-300" /> Sisa
              </span>
              <p className="text-[18px] font-bold text-stone-900">{currentProject.sisa}</p>
            </div>
            {currentProject.warningSisa && (
              <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold rounded-xl">
                {currentProject.warningSisa}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid Bawah */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Realisasi per Pos Anggaran */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-[15px] font-bold text-stone-900">Realisasi per Pos Anggaran</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <button 
                onClick={() => setIsDetailAnggaranOpen(true)}
                className="px-3 py-1.5 bg-white border border-stone-200 text-stone-700 text-[12px] font-bold rounded-xl hover:bg-stone-50 transition shadow-xs cursor-pointer"
              >
                Lihat Detail Anggaran
              </button>
              <button 
                onClick={() => setIsAjukanPosOpen(true)}
                className="px-3 py-1.5 bg-[#008f5d] text-white text-[12px] font-bold rounded-xl hover:bg-[#007a4f] transition shadow-xs cursor-pointer"
              >
                + Ajukan Pos
              </button>
              <button 
                onClick={() => setIsAjukanRealisasiOpen(true)}
                className="px-3 py-1.5 bg-[#008f5d] text-white text-[12px] font-bold rounded-xl hover:bg-[#007a4f] transition shadow-xs cursor-pointer"
              >
                + Ajukan Realisasi
              </button>
            </div>
          </div>

          <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden flex">
            <div className="bg-[#008f5d] h-full w-[35%]" />
            <div className="bg-amber-600 h-full w-[45%]" />
            <div className="bg-stone-300 h-full w-[20%]" />
          </div>

          <div className="space-y-4 pt-2">
            {currentProject.posAnggaran.map((pos, i) => (
              <div key={i} className="p-4 bg-stone-50/50 border border-stone-200/60 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="font-bold text-stone-900">{pos.nama}</span>
                  <span className="font-bold text-stone-700">Rp 0 / <span className="text-stone-500">{pos.alokasi}</span></span>
                </div>
                <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                  <div className={`h-full ${pos.color} w-[5%]`} />
                </div>
                <div className="flex justify-between text-[11px] text-stone-500">
                  <span>Terpakai {pos.terpakai}</span>
                  <span>Sisa: <b>{pos.sisa}</b></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tim Proyek & Reimbursement */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4">
            <h3 className="text-[15px] font-bold text-stone-900 border-b border-stone-100 pb-3">Tim Proyek</h3>
            <div className="space-y-3">
              {currentProject.tim.map((t, idx) => (
                <div key={idx} className="p-3 bg-stone-50 border border-stone-200/60 rounded-xl flex items-center justify-between text-[12px]">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 block">{t.role}</span>
                    <span className="font-bold text-stone-800">{t.nama}</span>
                  </div>
                  {t.divisi !== "-" && (
                    <span className="px-2 py-0.5 bg-white border border-stone-200 text-[11px] font-bold text-stone-600 rounded-md">
                      {t.divisi}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <button className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[12px] font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1">
              <Plus size={14} /> Tambah Anggota
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4">
            <h3 className="text-[15px] font-bold text-stone-900 border-b border-stone-100 pb-3">Reimbursement</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                <span className="text-[10px] font-bold text-[#117a5b] block">Sudah Reimburse (6)</span>
                <p className="text-[14px] font-black text-[#117a5b] mt-1">{currentProject.reimburseSudah}</p>
              </div>
              <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                <span className="text-[10px] font-bold text-amber-700 block">Belum Reimburse (0)</span>
                <p className="text-[14px] font-black text-amber-700 mt-1">{currentProject.reimburseBelum}</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL DETAIL ANGGARAN */}
      <DetailAnggaranModal 
        isOpen={isDetailAnggaranOpen}
        onClose={() => setIsDetailAnggaranOpen(false)}
        projectName={currentProject.nama}
      />

      {/* MODAL AJUKAN REALISASI */}
      <AjukanRealisasiModal 
        isOpen={isAjukanRealisasiOpen}
        onClose={() => setIsAjukanRealisasiOpen(false)}
        projectName={currentProject.nama}
      />

      {/* MODAL AJUKAN POS */}
      {isAjukanPosOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-[750px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            
            <div className="px-6 pt-6 pb-4 border-b border-stone-100 flex items-start justify-between relative">
              <div>
                <h2 className="text-lg font-bold text-stone-900 leading-tight">Ajukan Pos</h2>
                <p className="text-[12px] text-stone-500 mt-0.5">{currentProject.nama}</p>
              </div>
              <button 
                onClick={() => setIsAjukanPosOpen(false)} 
                className="absolute top-6 right-6 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 p-1.5 rounded-full transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
              <div className="p-4 bg-stone-50/80 border border-stone-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-[12px] font-bold text-stone-800">
                  <span>Realisasi Anggaran</span>
                  <span className="text-[#008f5d]">35%</span>
                </div>
                <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#008f5d] w-[35%]" />
                </div>
                <div className="flex justify-between text-[11px] text-stone-500 font-medium">
                  <span>Nilai Proyek Rp 6.2 M</span>
                  <span>Realisasi Rp 2.2 M</span>
                  <span>Sisa Rp 4.0 M</span>
                </div>
              </div>

              <p className="text-[12px] text-stone-600 font-medium">
                Anggaran Proyek — klik <b>"+ Tambah"</b> untuk mengajukan Sub / Keterangan baru
              </p>

              <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white">
                <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-[#fdfcf9]">
                  <span className="text-[13px] font-bold text-stone-900">Material Konstruksi</span>
                  <span className="text-[13px] font-bold text-stone-600">Rp 2.4 M</span>
                </div>

                <div className="p-4 space-y-4">
                  <div className="space-y-3">
                    <div 
                      onClick={() => setActiveSubAccordion(!activeSubAccordion)}
                      className="flex justify-between items-center cursor-pointer text-[13px] font-bold text-stone-800"
                    >
                      <div className="flex items-center gap-2">
                        {activeSubAccordion ? <ChevronDown size={14} className="text-stone-500" /> : <ChevronRight size={14} className="text-stone-500" />}
                        <span>Beton & Semen</span>
                      </div>
                      <span className="text-stone-600">Rp 1.2 M</span>
                    </div>

                    {activeSubAccordion && (
                      <div className="pl-6 space-y-2.5 pt-1">
                        <div className="flex justify-between text-[12px] text-stone-600">
                          <span>Semen Portland 500 sak</span>
                          <span className="text-stone-400 font-medium">Rp 400.0 jt</span>
                        </div>
                        <div className="flex justify-between text-[12px] text-stone-600">
                          <span>Beton Ready Mix K-350</span>
                          <span className="text-stone-400 font-medium">Rp 600.0 jt</span>
                        </div>
                        <div className="flex justify-between text-[12px] text-stone-600">
                          <span>Bahan aditif & campuran</span>
                          <span className="text-stone-400 font-medium">Rp 200.0 jt</span>
                        </div>

                        {submittedCount >= 2 && (
                          <div className="flex justify-between items-center text-[12px] text-stone-700 bg-emerald-50/40 p-2 rounded-xl">
                            <span className="font-medium">Keterangan Baru: <b>Batu Bata Tipe A</b></span>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-emerald-100 text-[#007a4f] text-[10px] font-bold rounded">MENUNGGU</span>
                              <span className="font-bold">Rp 20 rb</span>
                            </div>
                          </div>
                        )}

                        {isAddingKet ? (
                          <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-3 mt-2">
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="Batu Bata Tipe A"
                                value={ketName}
                                onChange={(e) => setKetName(e.target.value)}
                                className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-[12px] bg-white outline-none focus:border-[#008f5d]"
                              />
                              <input 
                                type="text" 
                                placeholder="Rp 20.000" 
                                className="w-32 border border-stone-200 rounded-lg px-3 py-1.5 text-[12px] bg-white outline-none focus:border-[#008f5d]"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => { setSubmittedCount(2); setIsAddingKet(false); }}
                                className="px-3 py-1 bg-[#008f5d] text-white text-[11px] font-bold rounded-lg hover:bg-[#007a4f] transition cursor-pointer"
                              >
                                Simpan Draft
                              </button>
                              <button onClick={() => setIsAddingKet(false)} className="text-[11px] text-stone-500 hover:text-stone-700 font-medium">Batal</button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setIsAddingKet(true)}
                            className="text-[11px] font-bold text-[#008f5d] hover:text-[#006b45] flex items-center gap-1 transition pt-1 cursor-pointer"
                          >
                            <Plus size={13} strokeWidth={3} /> Tambah Keterangan
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[13px] font-bold text-stone-800 pt-1 border-t border-stone-100">
                    <div className="flex items-center gap-2">
                      <ChevronRight size={14} className="text-stone-400" />
                      <span>Baja & Besi</span>
                    </div>
                    <span className="text-stone-600">Rp 900.0 jt</span>
                  </div>

                  {submittedCount >= 1 && (
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[12px] font-bold text-stone-800">Sub Baru: <span className="text-[#008f5d]">Batu Bata</span></span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-[#007a4f] text-[10px] font-bold rounded">MENUNGGU</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2.5 bg-white border border-stone-200 rounded-lg text-[11px]">
                          <span className="text-stone-400 block">Total SUB Teralokasi</span>
                          <b className="text-stone-800">Rp 0</b>
                        </div>
                        <div className="p-2.5 bg-white border border-stone-200 rounded-lg text-[11px]">
                          <span className="text-stone-400 block">Sisa SUB Belum Dialokasikan</span>
                          <b className="text-stone-800">Rp 4.590.000.000</b>
                        </div>
                      </div>
                    </div>
                  )}

                  {isAddingSub ? (
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Nama Sub baru" 
                          value={subName}
                          onChange={(e) => setSubName(e.target.value)}
                          className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-[12px] bg-white outline-none focus:border-[#008f5d]"
                        />
                        <input type="text" placeholder="Alokasi" className="w-28 border border-stone-200 rounded-lg px-3 py-1.5 text-[12px] bg-white outline-none" />
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => { setSubmittedCount(1); setIsAddingSub(false); }}
                          className="px-3 py-1 bg-[#008f5d] text-white text-[11px] font-bold rounded-lg hover:bg-[#007a4f] transition cursor-pointer"
                        >
                          Simpan Draft
                        </button>
                        <button onClick={() => setIsAddingSub(false)} className="text-[11px] text-stone-500 font-medium">Batal</button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsAddingSub(true)}
                      className="text-[11px] font-bold text-[#008f5d] hover:text-[#006b45] flex items-center gap-1 transition cursor-pointer pt-1"
                    >
                      <Plus size={13} strokeWidth={3} /> Tambah Sub
                    </button>
                  )}

                </div>
              </div>

              {submittedCount > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-[12px] font-bold text-[#117a5b]">
                  <span>{submittedCount} pos menunggu diajukan</span>
                </div>
              )}

            </div>

            <div className="px-6 py-4 border-t border-stone-100 bg-white flex items-center justify-between">
              <span className="text-[11px] text-stone-400 italic">* setiap pos wajib punya alasan</span>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsAjukanPosOpen(false)} 
                  className="px-5 py-2.5 text-[13px] font-bold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  onClick={() => setIsAjukanPosOpen(false)}
                  className="px-5 py-2.5 text-[13px] font-bold text-white bg-black rounded-xl hover:bg-stone-800 transition cursor-pointer"
                >
                  + Ajukan
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}