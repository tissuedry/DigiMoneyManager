"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, Settings, X, Plus } from "lucide-react";
import EditAlokasiModal from "./EditAlokasi";

type EditTarget = any;

const EditAlokasiModalAny = EditAlokasiModal as React.ComponentType<any>;

const COL_CLASS = "flex items-center gap-3 px-6 py-1.5 hover:bg-stone-50 transition";
const NAME_CLASS = "flex items-center gap-2 flex-1 min-w-0 max-w-[440px]";

function Row({ children, indent = 0, onClick, className = "" }: any) {
  return (
    <div 
      onClick={onClick} 
      className={`${COL_CLASS} ${onClick ? "cursor-pointer select-none" : ""} ${className}`}
      style={{ paddingLeft: 24 }}
    >
      {children}
    </div>
  );
}

function ProgressCell({ pct }: { pct: number }) {
  const displayPct = Math.min(Math.max(pct, 0), 100);
  return (
    <div className="flex items-center justify-center shrink-0" style={{ width: 200 }}>
      <div className="flex items-center justify-center gap-2.5 w-full px-3 shrink-0">
        <div className="flex-1 bg-stone-100 h-2.5 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-[#008f5d] transition-all duration-300" style={{ width: `${displayPct}%` }} />
        </div>
        <span className="text-[11px] font-bold tabular-nums w-12 text-left text-[#005836]">
          {pct.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function Cell({ children, bold, style }: { children: React.ReactNode; bold?: boolean; style?: React.CSSProperties }) {
  return (
    <span 
      className={`text-[12px] text-stone-800 shrink-0 text-center whitespace-nowrap ${bold ? "font-bold" : ""}`} 
      style={{ width: 210, ...style }}
    >
      {children}
    </span>
  );
}

function AksiButton({ children, onClick, variant = "main" }: any) {
  const isMain = variant === "main";
  return (
    <div className="flex justify-center shrink-0" style={{ width: 120 }}>
      <button
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        className={`inline-flex items-center justify-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer whitespace-nowrap shadow-2xs ${
          isMain 
            ? "bg-[#fdf7f2] border-[#b38355] text-[#8d5423] hover:opacity-85" 
            : "bg-[#f1f7f4] border-[#388863] text-[#1f6245] hover:opacity-85"
        }`}
      >
        <Settings size={12} />
        {children}
      </button>
    </div>
  );
}

export default function AlokasiPemasukanModal({ 
  proyekId, 
  proyekNama, 
  isOpen = false,
  dataPemasukan = [], 
  totalPemasukan = 0,
  teralokasi = 0,
  onClose, 
  onRefresh 
}: any) {
  const [expandedMain, setExpandedMain] = useState<Record<number, boolean>>({});
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  if (!isOpen) return null;

  const editAlokasiModalProps: any = {
    editTarget,
    proyekId,
    onClose: () => setEditTarget(null),
    onSuccess: () => { setEditTarget(null); onRefresh?.(); },
  };


  const toggleMain = (id: number) => setExpandedMain((p) => ({ ...p, [id]: !p[id] }));

  const sisaAlokasi = totalPemasukan - teralokasi;
  const progressGlobal = totalPemasukan > 0 ? (teralokasi / totalPemasukan) * 100 : 0;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1100px] max-h-[85vh] flex flex-col overflow-hidden text-left" onClick={(e) => e.stopPropagation()}>
          
          <div className="px-6 pt-5 pb-4 border-b border-stone-100 flex items-start justify-between shrink-0">
            <div>
              <h3 className="text-lg font-bold text-stone-900">Edit Alokasi</h3>
              <p className="text-sm text-stone-500 mt-0.5">{proyekNama}</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-lg transition text-stone-400 hover:text-stone-600 cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <div className="px-6 py-4 bg-stone-50/50 border-b border-stone-100 shrink-0">
            <div className="flex justify-between text-[11px] font-bold mb-2">
              <span className="text-stone-600 uppercase tracking-wider">Alokasi Pemasukan</span>
              <span className="text-stone-900">{progressGlobal.toFixed(0)}%</span>
            </div>
            <div className="w-full h-2.5 bg-stone-200/70 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-[#008f5d] rounded-full transition-all duration-300" style={{ width: `${Math.min(progressGlobal, 100)}%` }} />
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-stone-500">Total Pemasukan <b className="text-stone-800 ml-1">Rp {totalPemasukan.toLocaleString("id-ID")}</b></span>
              <span className="text-stone-500">Teralokasi <b className="text-stone-800 ml-1">Rp {teralokasi.toLocaleString("id-ID")}</b></span>
              <span className="text-stone-500">Sisa Alokasi <b className="text-stone-800 ml-1">Rp {sisaAlokasi.toLocaleString("id-ID")}</b></span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-6 py-2 bg-stone-50 border-b border-stone-100 shrink-0">
            <span className="flex-1 min-w-0 max-w-[400px] text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              MAIN · SUB
            </span>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0 text-center" style={{ width: 200 }}>
              PROGRESS
            </span>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0 text-right" style={{ width: 210 }}>
              ALOKASI
            </span>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0 text-center" style={{ width: 120 }}>
              AKSI
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-stone-50">
            {(dataPemasukan || []).length === 0 ? (
              <div className="p-12 text-center text-stone-400 text-xs italic">
                Belum ada data pemasukan.
              </div>
            ) : (
              (dataPemasukan || []).map((main: any) => {
                const isMainOpen = expandedMain[main.id] ?? true;
                const mainPct = main.alokasi > 0 ? ((main.realisasi || 0) / main.alokasi) * 100 : 0;

                return (
                  <div key={main.id}>
                    {/* MAIN Row */}
                    <Row onClick={() => toggleMain(main.id)}>
                      <div className={NAME_CLASS}>
                        <div className="p-0.5 shrink-0 text-stone-500">
                          {isMainOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </div>
                        <span className="text-[13px] font-bold uppercase text-stone-900 shrink-0">MAIN</span>
                        <span className="text-[13px] font-semibold text-stone-800 truncate">· {main.nama}</span>
                      </div>
                      <ProgressCell pct={mainPct} />
                      <Cell bold>Rp {(main.alokasi || 0).toLocaleString("id-ID")}</Cell>
                      <AksiButton 
                        variant="main"
                        onClick={() => setEditTarget({ type: "main", id: main.id, nama: main.nama, currentAlokasi: main.alokasi, totalRAB: totalPemasukan, totalTeralokasi: (main.subPos || []).reduce((s: number, i: any) => s + (i.alokasi || 0), 0) })}
                      >
                        Edit Alokasi
                      </AksiButton>
                    </Row>

                    {isMainOpen && (
                      <div className="bg-stone-50/50">
                        {(main.subPos || []).map((sub: any) => {
                          const subPct = sub.alokasi > 0 ? ((sub.realisasi || 0) / sub.alokasi) * 100 : 0;
                          return (
                            <Row key={sub.id} indent={1} className="hover:bg-stone-100/60">
                              <div className={NAME_CLASS}>
                                <div className="w-[17px] shrink-0" />
                                <span className="text-[9px] font-bold uppercase text-stone-400 shrink-0">SUB</span>
                                <span className="text-[12px] font-medium text-stone-700 truncate">· {sub.nama}</span>
                              </div>
                              <ProgressCell pct={subPct} />
                              <Cell>Rp {(sub.alokasi || 0).toLocaleString("id-ID")}</Cell>
                              <AksiButton 
                                variant="sub"
                                onClick={() => setEditTarget({ type: "sub", id: sub.id, nama: sub.nama, parentNama: main.nama, currentAlokasi: sub.alokasi, totalRAB: main.alokasi, totalTeralokasi: (main.subPos || []).reduce((s: number, i: any) => s + (i.alokasi || 0), 0) })}
                              >
                                Edit Alokasi
                              </AksiButton>
                            </Row>
                          );
                        })}

                        <div className="pl-14 py-2">
                          <button className="flex items-center gap-1 text-[11px] font-bold text-[#008f5d] hover:opacity-75 transition cursor-pointer">
                            <Plus size={12} /> Tambah Sub
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            <div className="p-4">
              <button className="flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:opacity-75 transition cursor-pointer">
                <Plus size={12} /> Tambah Main
              </button>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-stone-100 flex justify-end bg-stone-50/50 shrink-0">
            <button onClick={onClose} className="px-6 py-2.5 bg-stone-900 hover:bg-black text-white text-[13px] font-bold rounded-xl transition cursor-pointer">
              Tutup
            </button>
          </div>
        </div>
      </div>
      {editTarget && (
        <EditAlokasiModal
          editTarget={editTarget}
          proyekId={proyekId}
          onClose={() => setEditTarget(null)}
          onSuccess={() => { setEditTarget(null); onRefresh?.(); }}
        />
      )}
    </>
  );
}