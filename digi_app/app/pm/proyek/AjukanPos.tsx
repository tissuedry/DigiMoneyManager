"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { formatShort } from "./page";

type AjukanKet = {
  id: number;
  nama: string;
  alokasi: number;
  reason?: string;
  isDraft?: boolean;
};

type AjukanSub = {
  id: number;
  nama: string;
  alokasi: number;
  reason?: string;
  status?: "MENUNGGU";
  keterangan: AjukanKet[];
};

type AjukanMain = {
  id: number;
  nama: string;
  alokasi: number;
  subPos: AjukanSub[];
};

export default function AjukanPosModal({
  proyekNama,
  proyekTotalRAB,
  proyekRealisasi,
  onClose,
}: {
  proyekNama: string;
  proyekTotalRAB: number;
  proyekRealisasi: number;
  onClose: () => void;
}) {
  const [data, setData] = useState<AjukanMain[]>(() => [
    {
      id: 1,
      nama: "Material Konstruksi",
      alokasi: 2_400_000_000,
      subPos: [
        {
          id: 11,
          nama: "Beton & Semen",
          alokasi: 1_200_000_000,
          keterangan: [
            { id: 111, nama: "Semen Portland 500 sak", alokasi: 460_000_000 },
            { id: 112, nama: "Beton Ready Mix K-350", alokasi: 600_000_000 },
            { id: 113, nama: "Bahan aditif & campuran", alokasi: 200_000_000 },
          ],
        },
        {
          id: 12,
          nama: "Baja & Besi",
          alokasi: 720_000_000,
          keterangan: [],
        },
        {
          id: 13,
          nama: "Material Lainnya",
          alokasi: 300_000_000,
          keterangan: [],
        },
      ],
    },
    {
      id: 2,
      nama: "Tenaga Kerja Lapangan",
      alokasi: 1_200_000_000,
      subPos: [
        {
          id: 21,
          nama: "Upah Tim Lapangan",
          alokasi: 800_000_000,
          keterangan: [],
        },
        {
          id: 22,
          nama: "Tunjangan",
          alokasi: 400_000_000,
          keterangan: [],
        },
      ],
    },
  ]);

  const [expandedMain, setExpandedMain] = useState<Record<number, boolean>>({ 1: true, 2: true });
  const [expandedSub, setExpandedSub] = useState<Record<number, boolean>>({ 11: true, 12: false });

  // Adding Sub state
  const [addingSubMainId, setAddingSubMainId] = useState<number | null>(null);
  const [newSubName, setNewSubName] = useState("");
  const [newSubAlokasi, setNewSubAlokasi] = useState("");
  const [newSubReason, setNewSubReason] = useState("");

  // Adding Keterangan state
  const [addingKetSubId, setAddingKetSubId] = useState<number | null>(null);
  const [newKetName, setNewKetName] = useState("");
  const [newKetAlokasi, setNewKetAlokasi] = useState("");
  const [newKetReason, setNewKetReason] = useState("");

  const toggleMain = (id: number) => setExpandedMain((p) => ({ ...p, [id]: !p[id] }));
  const toggleSub = (id: number) => setExpandedSub((p) => ({ ...p, [id]: !p[id] }));

  const handleAddSub = (mainId: number) => {
    if (!newSubName || !newSubAlokasi || !newSubReason) {
      alert("Harap isi semua kolom untuk mengajukan Sub baru!");
      return;
    }
    const alokasiVal = parseFloat(newSubAlokasi.replace(/[^0-9]/g, "")) || 0;

    setData((prev) =>
      prev.map((main) => {
        if (main.id === mainId) {
          const updatedSub = {
            id: Date.now(),
            nama: newSubName,
            alokasi: alokasiVal,
            reason: newSubReason,
            status: "MENUNGGU" as const,
            keterangan: [],
          };
          setExpandedSub((prevSub) => ({ ...prevSub, [updatedSub.id]: true }));
          return {
            ...main,
            subPos: [...main.subPos, updatedSub],
          };
        }
        return main;
      })
    );

    setAddingSubMainId(null);
    setNewSubName("");
    setNewSubAlokasi("");
    setNewSubReason("");
  };

  const handleAddKet = (subId: number) => {
    if (!newKetName || !newKetAlokasi || !newKetReason) {
      alert("Harap isi semua kolom untuk mengajukan Keterangan baru!");
      return;
    }
    const alokasiVal = parseFloat(newKetAlokasi.replace(/[^0-9]/g, "")) || 0;

    setData((prev) =>
      prev.map((main) => ({
        ...main,
        subPos: main.subPos.map((sub) => {
          if (sub.id === subId) {
            return {
              ...sub,
              keterangan: [
                ...sub.keterangan,
                {
                  id: Date.now(),
                  nama: newKetName,
                  alokasi: alokasiVal,
                  reason: newKetReason,
                  isDraft: true,
                },
              ],
            };
          }
          return sub;
        }),
      }))
    );

    setAddingKetSubId(null);
    setNewKetName("");
    setNewKetAlokasi("");
    setNewKetReason("");
  };

  const formatInputRupiah = (val: string) => {
    const num = val.replace(/[^0-9]/g, "");
    if (!num) return "";
    return "Rp " + parseInt(num, 10).toLocaleString("id-ID");
  };

  let pendingCount = 0;
  data.forEach((main) => {
    main.subPos.forEach((sub) => {
      if (sub.status === "MENUNGGU") {
        pendingCount++;
      }
      sub.keterangan.forEach((ket) => {
        if (ket.isDraft) {
          pendingCount++;
        }
      });
    });
  });

  const progressPct = proyekTotalRAB > 0 ? Math.min((proyekRealisasi / proyekTotalRAB) * 100, 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-stone-100 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-[17px] font-bold text-stone-900">Ajukan Pos</h2>
            <p className="text-[12px] text-stone-400 mt-0.5">{proyekNama}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-lg transition text-stone-400 hover:text-stone-600 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Realisasi Anggaran Box */}
          <div className="bg-stone-50 border border-stone-150 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-stone-750">
              <span>Realisasi Anggaran</span>
              <span>{progressPct.toFixed(0)}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#008f5d] rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Project info */}
            <div className="flex justify-between items-center text-[11px] text-stone-500 font-semibold px-0.5">
              <span>Nilai Proyek <span className="text-stone-850 font-bold">{formatShort(proyekTotalRAB)}</span></span>
              <span>Realisasi <span className="text-stone-850 font-bold">{formatShort(proyekRealisasi)}</span></span>
              <span>Sisa <span className="text-stone-850 font-bold">{formatShort(proyekTotalRAB - proyekRealisasi)}</span></span>
            </div>
          </div>

          <p className="text-[12px] font-bold text-stone-500">
            Anggaran Proyek — klik "+ Tambah" untuk mengajukan Sub / Keterangan baru
          </p>

          {/* List items */}
          <div className="border border-stone-250/70 rounded-2xl divide-y divide-stone-100 overflow-hidden bg-white">
            {data.map((main) => {
              const isMainOpen = expandedMain[main.id] ?? true;
              return (
                <div key={main.id} className="p-4 space-y-3">
                  
                  {/* MAIN row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleMain(main.id)} className="p-0.5 hover:bg-stone-100 rounded transition cursor-pointer shrink-0 text-stone-500">
                        {isMainOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      <span className="text-[13px] font-bold uppercase tracking-wide" style={{ color: '#14130F' }}>MAIN</span>
                      <span className="text-[13px] font-semibold text-stone-850">{main.nama}</span>
                    </div>
                    <span className="text-[13px] font-bold text-stone-900">{formatShort(main.alokasi)}</span>
                  </div>

                  {/* SUBS */}
                  {isMainOpen && (
                    <div className="pl-6 space-y-3">
                      {main.subPos.map((sub) => {
                        const isSubOpen = expandedSub[sub.id] ?? false;
                        const isNewSub = sub.status === "MENUNGGU";
                        return (
                          <div key={sub.id} className="border-l border-stone-200/60 pl-3 space-y-2">
                            
                            {/* SUB row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button onClick={() => toggleSub(sub.id)} className="p-0.5 hover:bg-stone-100 rounded transition cursor-pointer shrink-0 text-stone-500">
                                  {isSubOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                </button>
                                <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#9A948B' }}>SUB</span>
                                <span className="text-[12px] font-semibold text-stone-800">
                                  {isNewSub ? `Sub Baru: ${sub.nama}` : sub.nama}
                                </span>
                                {sub.reason && (
                                  <span className="text-[11px] text-stone-400 italic">"{sub.reason}"</span>
                                )}
                                {sub.status && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
                                    {sub.status}
                                  </span>
                                )}
                              </div>
                              <span className="text-[12px] font-bold text-stone-800">{formatShort(sub.alokasi)}</span>
                            </div>

                            {/* KETS and "+ Tambah Keterangan" */}
                            {isSubOpen && (
                              <div className="pl-6 space-y-2">
                                {sub.keterangan.map((ket) => (
                                  <div key={ket.id} className="flex items-center justify-between text-xs text-stone-650">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#9A948B' }}>KET</span>
                                      <span className="font-medium text-stone-700">{ket.nama}</span>
                                      {ket.reason && (
                                        <span className="text-[11px] text-stone-400 italic">"{ket.reason}"</span>
                                      )}
                                      {ket.isDraft && (
                                        <span className="text-[8px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider rounded">
                                          Draft
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-stone-500 font-semibold">{formatShort(ket.alokasi)}</span>
                                  </div>
                                ))}

                                {/* Add Keterangan Inline Form */}
                                <div className="pt-1">
                                  {addingKetSubId === sub.id ? (
                                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3 mt-1 mr-2 shadow-inner">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Keterangan Baru:</label>
                                          <input
                                            type="text"
                                            value={newKetName}
                                            onChange={(e) => setNewKetName(e.target.value)}
                                            placeholder="Contoh: Batu Bata Tipe A"
                                            className="w-full text-xs border border-stone-250 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-stone-850"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Nominal:</label>
                                          <input
                                            type="text"
                                            value={newKetAlokasi}
                                            onChange={(e) => setNewKetAlokasi(formatInputRupiah(e.target.value))}
                                            placeholder="Rp 0"
                                            className="w-full text-xs border border-stone-255 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-stone-800"
                                          />
                                        </div>
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Alasan:</label>
                                        <input
                                          type="text"
                                          value={newKetReason}
                                          onChange={(e) => setNewKetReason(e.target.value)}
                                          placeholder="Contoh: buat disimpan"
                                          className="w-full text-xs border border-stone-250 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-stone-850"
                                        />
                                      </div>
                                      
                                      <div className="flex flex-wrap items-center gap-3 pt-1">
                                        <button
                                          onClick={() => handleAddKet(sub.id)}
                                          className="px-3.5 py-1.5 bg-[#008f5d] hover:bg-[#00754c] text-white text-[11px] font-bold rounded-lg transition cursor-pointer"
                                        >
                                          Simpan Draft
                                        </button>
                                        <button
                                          onClick={() => {
                                            setAddingKetSubId(null);
                                            setNewKetName("");
                                            setNewKetAlokasi("");
                                            setNewKetReason("");
                                          }}
                                          className="text-[11px] font-bold text-stone-400 hover:text-stone-600 transition cursor-pointer"
                                        >
                                          Batal
                                        </button>
                                        
                                        {/* Selisih warning */}
                                        <span className="bg-[#FAF0E3] text-[#9A6235] px-3 py-1.5 rounded-lg text-[10px] font-semibold">
                                          Selisih: +Rp {(() => {
                                            const valInput = parseFloat(newKetAlokasi.replace(/[^0-9]/g, "")) || 0;
                                            const totalExistingKet = sub.keterangan.reduce((sum, k) => sum + k.alokasi, 0);
                                            const diff = sub.alokasi - totalExistingKet - valInput;
                                            return diff.toLocaleString("id-ID");
                                          })()} (sisa Sub - {sub.nama.replace("Sub Baru: ", "")} belum dialokasikan)
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setAddingKetSubId(sub.id)}
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#005D8D] hover:underline cursor-pointer"
                                    >
                                      <Plus size={11} />
                                      Tambah Keterangan
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Add Sub Inline Form / Button */}
                      <div className="pt-1">
                        {addingSubMainId === main.id ? (
                          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3 mt-1 mr-2 shadow-inner">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Sub Pos Baru:</label>
                                <input
                                  type="text"
                                  value={newSubName}
                                  onChange={(e) => setNewSubName(e.target.value)}
                                  placeholder="Contoh: Batu Bata"
                                  className="w-full text-xs border border-stone-250 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-stone-850"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Alokasi Anggaran:</label>
                                <input
                                  type="text"
                                  value={newSubAlokasi}
                                  onChange={(e) => setNewSubAlokasi(formatInputRupiah(e.target.value))}
                                  placeholder="Rp 0"
                                  className="w-full text-xs border border-stone-250 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-stone-800"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Alasan Pengajuan:</label>
                              <input
                                type="text"
                                value={newSubReason}
                                onChange={(e) => setNewSubReason(e.target.value)}
                                placeholder="Contoh: buat dilempar"
                                className="w-full text-xs border border-stone-250 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-stone-850"
                              />
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 pt-1">
                              <button
                                onClick={() => handleAddSub(main.id)}
                                className="px-3.5 py-1.5 bg-[#008f5d] hover:bg-[#00754c] text-white text-[11px] font-bold rounded-lg transition cursor-pointer shrink-0"
                              >
                                Simpan Draft
                              </button>
                              <button
                                onClick={() => {
                                  setAddingSubMainId(null);
                                  setNewSubName("");
                                  setNewSubAlokasi("");
                                  setNewSubReason("");
                                }}
                                className="text-[11px] font-bold text-stone-400 hover:text-stone-600 transition cursor-pointer shrink-0"
                              >
                                Batal
                              </button>
                              
                              {/* Selisih warning */}
                              <span className="bg-[#FAF0E3] text-[#9A6235] px-3 py-1.5 rounded-lg text-[10px] font-semibold">
                                Selisih: +Rp {(() => {
                                  const valInput = parseFloat(newSubAlokasi.replace(/[^0-9]/g, "")) || 0;
                                  const totalExistingSub = main.subPos.reduce((sum, s) => sum + s.alokasi, 0);
                                  const diff = main.alokasi - totalExistingSub - valInput;
                                  return diff.toLocaleString("id-ID");
                                })()} (sisa Main - {main.nama} belum dialokasikan)
                              </span>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingSubMainId(main.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                          >
                            <Plus size={11} />
                            Tambah Sub
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Banner */}
          {pendingCount > 0 && (
            <div className="bg-[#e6f4ea] text-emerald-800 border border-emerald-200 rounded-xl px-4 py-3 text-xs font-semibold shrink-0">
              {pendingCount} pos menunggu diajukan
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-rose-500 font-semibold">* setiap pos wajib punya alasan</span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-5 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-[13px] font-bold rounded-xl transition cursor-pointer">
              Batal
            </button>
            <button
              onClick={() => {
                alert(`Pengajuan ${pendingCount} pos berhasil dikirim!`);
                onClose();
              }}
              className="px-5 py-2 bg-stone-900 hover:bg-stone-950 text-white text-[13px] font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              Ajukan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
