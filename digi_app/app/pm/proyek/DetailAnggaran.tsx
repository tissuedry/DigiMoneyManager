"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, Settings, X } from "lucide-react";
import { DETAIL_ANGGARAN, STATUS_BADGE, formatShort } from "./page";

export default function DetailAnggaranModal({
  proyekNama,
  onClose,
}: {
  proyekNama: string;
  onClose: () => void;
}) {
  const [expandedMain, setExpandedMain] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: true });
  const [expandedSub, setExpandedSub] = useState<Record<number, boolean>>({ 11: true, 12: false });
  const [expandedKet, setExpandedKet] = useState<Record<number, boolean>>({ 111: true, 112: false });

  const toggleMain = (id: number) => setExpandedMain((p) => ({ ...p, [id]: !p[id] }));
  const toggleSub = (id: number) => setExpandedSub((p) => ({ ...p, [id]: !p[id] }));
  const toggleKet = (id: number) => setExpandedKet((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-stone-100 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-[17px] font-bold text-stone-900">Detail Anggaran</h2>
            <p className="text-[12px] text-stone-400 mt-0.5">{proyekNama}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-lg transition text-stone-400 hover:text-stone-600 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Table Header */}
        <div className="px-6 py-2.5 bg-stone-50 border-b border-stone-100 grid grid-cols-[2fr_160px_110px_110px_100px] gap-3 items-center shrink-0">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">MAIN · SUB · KETERANGAN</span>
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">PROGRESS</span>
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">ALOKASI</span>
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">REALISASI</span>
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">AKSI</span>
        </div>

        {/* Scrollable rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-50">
          {DETAIL_ANGGARAN.map((main) => {
            const mainPct = main.alokasi > 0 ? Math.min((main.realisasi / main.alokasi) * 100, 100) : 0;
            const isMainOpen = expandedMain[main.id] ?? true;
            return (
              <div key={main.id}>
                {/* MAIN row */}
                <div className="grid grid-cols-[2fr_160px_110px_110px_100px] gap-3 items-center px-6 py-3 hover:bg-stone-50 transition">
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleMain(main.id)} className="p-0.5 hover:bg-stone-200 rounded transition cursor-pointer shrink-0">
                      {isMainOpen ? <ChevronDown size={13} className="text-stone-500" /> : <ChevronRight size={13} className="text-stone-500" />}
                    </button>
                    <span className="text-[13px] font-bold uppercase shrink-0" style={{ color: '#14130F' }}>MAIN</span>
                    <span className="text-[13px] font-semibold text-stone-800">{main.nama}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-stone-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#008f5d] rounded-full" style={{ width: `${mainPct}%` }} />
                    </div>
                    <span className="text-[11px] font-bold text-stone-600 shrink-0">{mainPct.toFixed(1)}%</span>
                  </div>
                  <span className="text-[12px] font-bold text-stone-800">{formatShort(main.alokasi)}</span>
                  <span className="text-[12px] font-bold text-stone-800">{formatShort(main.realisasi)}</span>
                  <div className="flex justify-end">
                    <button className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition cursor-pointer whitespace-nowrap hover:opacity-80" style={{ color: '#005D8D', backgroundColor: '#F0F7FB' }}>
                      <Settings size={11} />
                      Edit Alokasi
                    </button>
                  </div>
                </div>

                {/* SUB rows */}
                {isMainOpen && (
                  <div className="bg-stone-50/50">
                    {main.subPos.length === 0 ? (
                      <p className="pl-14 py-2.5 text-[12px] text-stone-400 italic">Belum ada main atau sub-pos.</p>
                    ) : (
                      main.subPos.map((sub) => {
                        const subPct = sub.alokasi > 0 ? Math.min((sub.realisasi / sub.alokasi) * 100, 100) : 0;
                        const isSubOpen = expandedSub[sub.id] ?? false;
                        return (
                          <div key={sub.id}>
                            {/* SUB row */}
                            <div className="grid grid-cols-[2fr_160px_110px_110px_100px] gap-3 items-center pl-10 pr-6 py-2.5 hover:bg-stone-100/60 transition">
                              <div className="flex items-center gap-2">
                                <button onClick={() => toggleSub(sub.id)} className="p-0.5 hover:bg-stone-200 rounded transition cursor-pointer shrink-0">
                                  {isSubOpen ? <ChevronDown size={12} className="text-stone-400" /> : <ChevronRight size={12} className="text-stone-400" />}
                                </button>
                                <span className="text-[9px] font-bold uppercase shrink-0" style={{ color: '#9A948B' }}>SUB</span>
                                <span className="text-[12px] font-semibold text-stone-700">{sub.nama}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-stone-200 h-1.5 rounded-full overflow-hidden">
                                  <div className="h-full bg-[#008f5d] rounded-full" style={{ width: `${subPct}%` }} />
                                </div>
                                <span className="text-[11px] font-bold text-stone-600 shrink-0">{subPct.toFixed(1)}%</span>
                              </div>
                              <span className="text-[12px] text-stone-800">{formatShort(sub.alokasi)}</span>
                              <span className="text-[12px] text-stone-800">{formatShort(sub.realisasi)}</span>
                              <div className="flex justify-end">
                                <button className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition cursor-pointer whitespace-nowrap hover:opacity-80" style={{ color: '#005D8D', backgroundColor: '#F0F7FB' }}>
                                  <Settings size={11} />
                                  Edit Alokasi
                                </button>
                              </div>
                            </div>

                            {/* KET rows */}
                            {isSubOpen && sub.keterangan.map((ket) => {
                              const isKetOpen = expandedKet[ket.id] ?? false;
                              return (
                                <div key={ket.id}>
                                  {/* KET row */}
                                  <div className="grid grid-cols-[2fr_160px_110px_110px_100px] gap-3 items-center pl-16 pr-6 py-2 hover:bg-stone-100/60 transition">
                                    <div className="flex items-center gap-2">
                                      <button onClick={() => toggleKet(ket.id)} className="p-0.5 hover:bg-stone-200 rounded transition cursor-pointer shrink-0">
                                        {isKetOpen ? <ChevronDown size={12} className="text-stone-400" /> : <ChevronRight size={12} className="text-stone-400" />}
                                      </button>
                                      <span className="text-[9px] font-bold uppercase shrink-0" style={{ color: '#9A948B' }}>KET</span>
                                      <span className="text-[12px] text-stone-600">{ket.nama}</span>
                                    </div>
                                    <div />
                                    <span className="text-[12px] text-stone-500">{formatShort(ket.alokasi)}</span>
                                    <span className="text-[12px] text-stone-500">{formatShort(ket.realisasi)}</span>
                                    <div className="flex justify-end">
                                      <button className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition cursor-pointer whitespace-nowrap hover:opacity-80" style={{ color: '#005D8D', backgroundColor: '#F0F7FB' }}>
                                        <Settings size={11} />
                                        Edit Alokasi
                                      </button>
                                    </div>
                                  </div>

                                  {/* Reimb rows */}
                                  {isKetOpen && (
                                    <div className="bg-white">
                                      {ket.reimbs.length === 0 ? (
                                        <p className="pl-24 py-2 text-[11px] text-stone-400 italic">Belum ada realisasi.</p>
                                      ) : (
                                        ket.reimbs.map((rb) => (
                                          <div key={rb.id} className="grid grid-cols-[2fr_160px_110px_110px_100px] gap-3 items-center pl-20 pr-6 py-2 hover:bg-stone-50 transition">
                                            <div className="flex items-center gap-2">
                                              <span className="text-[9px] font-bold uppercase shrink-0" style={{ color: '#005D8D' }}>REIMB</span>
                                              <span className="text-[11px] text-stone-700 font-medium">{rb.nama}</span>
                                              <span className="text-[10px] text-stone-400">{rb.tanggal}</span>
                                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[rb.status] ?? "bg-stone-100 text-stone-500"}`}>{rb.status}</span>
                                            </div>
                                            <div />
                                            <div />
                                            <span className="text-[12px] text-stone-500">{formatShort(rb.nominal)}</span>
                                            <div className="flex justify-end">
                                              <button className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition cursor-pointer whitespace-nowrap hover:opacity-80" style={{ color: '#005836', backgroundColor: '#EEF6F2' }}>
                                                <Settings size={11} />
                                                Edit Realisasi
                                              </button>
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 flex justify-end shrink-0">
          <button onClick={onClose} className="px-5 py-2 bg-stone-800 hover:bg-stone-900 text-white text-[13px] font-bold rounded-xl transition cursor-pointer">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
