"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Settings, X, Plus } from "lucide-react";
import EditAlokasiModal from "./PerubahanAlokasi";

type EditTarget = any;

interface AlokasiPemasukanProps {
  proyekId: string | number;
  proyekNama: string;
  kategoriProyek?: "konstruksi" | "digital" | "event" | "general";
  isOpen?: boolean;
  dataPemasukan?: any[];
  totalPemasukan?: number;
  onClose: () => void;
  onRefresh?: () => void;
}

const THEME_COLORS: Record<string, { primary: string; hover: string; bgLight: string }> = {
  konstruksi: { primary: "bg-amber-600", hover: "hover:bg-amber-700", bgLight: "bg-amber-50" },
  digital: { primary: "bg-indigo-600", hover: "hover:bg-indigo-700", bgLight: "bg-indigo-50" },
  event: { primary: "bg-rose-600", hover: "hover:bg-rose-700", bgLight: "bg-rose-50" },
  general: { primary: "bg-[#00966c]", hover: "hover:bg-[#007f5a]", bgLight: "bg-[#f2f9f6]" },
};

function Row({ children, onClick, className = "" }: any) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center px-6 py-3 border-b border-stone-100 hover:bg-stone-50/80 transition-colors ${onClick ? "cursor-pointer select-none" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

function ProgressCell({ pct }: { pct: number }) {
  const displayPct = Math.min(Math.max(pct, 0), 100);
  const isOver = pct > 100;
  const barColor = isOver ? "bg-[#c95d5d]" : "bg-[#00966c]";
  const textColor = isOver ? "text-[#c95d5d]" : "text-[#00966c]";

  return (
    <div className="w-[300px] flex items-center justify-center shrink-0">
      <div className="w-[240px] flex items-center gap-3.5">
        <div className="flex-1 bg-[#f0efe9] h-3 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${barColor}`} 
            style={{ width: `${Math.min(displayPct, 100)}%` }} 
          />
        </div>
        <span className={`text-[12px] font-extrabold tabular-nums w-14 text-left shrink-0 ${textColor}`}>
          {pct.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function AksiButton({ children, onClick }: any) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-[#00966c]/60 text-[#00966c] bg-[#f2f9f6] hover:bg-[#e0f3eb] transition cursor-pointer whitespace-nowrap"
    >
      <Settings size={13} />
      {children}
    </button>
  );
}

export default function AlokasiPemasukanModal({
  proyekId,
  proyekNama,
  kategoriProyek = "general",
  isOpen = false,
  dataPemasukan = [],
  totalPemasukan = 0,
  onClose,
  onRefresh
}: AlokasiPemasukanProps) {
  const [expandedMain, setExpandedMain] = useState<Record<number, boolean>>({});
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const [addingSubId, setAddingSubId] = useState<number | null>(null);
  const [isAddingMain, setIsAddingMain] = useState(false);
  const [newMainName, setNewMainName] = useState("");
  const [newMainNominal, setNewMainNominal] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newSubNominal, setNewSubNominal] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const currentTheme = THEME_COLORS[kategoriProyek] || THEME_COLORS.general;

  useEffect(() => {
    setExpandedMain({});
    setIsAddingMain(false);
    setAddingSubId(null);
    setNewMainName("");
    setNewMainNominal("");
    setNewSubName("");
    setNewSubNominal("");
  }, [proyekId]);

  async function ambilDataProyek(proyekId: number) {
  try {
    const response = await fetch(`/api/proyek/${proyekId}`);
    
    if (!response.ok) {
      throw new Error("Gagal terhubung ke server");
    }
    const result = await response.json();

    console.log("Nama Proyek:", result.namaProyek);
    
  } catch (error) {
    console.error("Terjadi error:", error instanceof Error ? error.message : String(error));
  }
}

  if (!isOpen) return null;

  const toggleMain = (id: number) => setExpandedMain((p) => ({ ...p, [id]: !p[id] }));

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const formattedValue = rawValue ? Number(rawValue).toLocaleString('id-ID') : "";
    setNewMainNominal(formattedValue);
  };

  const handleSubNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const formattedValue = rawValue ? Number(rawValue).toLocaleString('id-ID') : "";
    setNewSubNominal(formattedValue);
  };

  const handleSimpanMain = async () => {
    const nominalBersi = newMainNominal.replace(/\./g, "");

    if (!newMainName || !nominalBersi) {
      alert("Nama Pemasukan dan Nominal harus diisi!");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/proyek/${proyekId}/alokasi-pemasukan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaMain: newMainName,
          nominal: nominalBersi,
          mainAnggaranId: null,
          alokasiBaru: nominalBersi
        }),
      });

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        alert("Gagal memproses data dari server.");
        setIsSaving(false);
        return;
      }

      if (response.ok) {
        setNewMainName("");
        setNewMainNominal("");
        setIsAddingMain(false);
        if (onRefresh) onRefresh();
      } else {
        alert(result.message || "Gagal menyimpan pemasukan baru");
      }
    } catch (error) {
      alert("Terjadi kesalahan jaringan sistem.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSimpanSub = async (mainItem: any) => {
    const nominalSubBaru = Number(newSubNominal.replace(/\./g, "")) || 0;

    if (!newSubName || nominalSubBaru <= 0) {
      alert("Nama Sub dan Nominal harus diisi dengan benar!");
      return;
    }

    // Hitung total sub yang sudah ada di dalam MAIN ini
    const totalSubSebelumnya = (mainItem.subAnggaran || []).reduce(
      (sum: number, sub: any) => sum + (Number(sub.nominalAlokasi) || 0), 
      0
    );

    const batasMaksimalMain = Number(mainItem.nominalAlokasi) || 0;
    const sisaKuota = batasMaksimalMain - totalSubSebelumnya;

    // Jika sub baru membuat total sub melewati batas MAIN, tolak!
    if (nominalSubBaru > sisaKuota) {
      alert(
        `GAGAL: Total alokasi sub akan melewati batas MAIN!\n\n` +
        `Batas Patokan MAIN "${mainItem.namaMain}": Rp ${batasMaksimalMain.toLocaleString("id-ID")}\n` +
        `Sudah terpakai sub lain: Rp ${totalSubSebelumnya.toLocaleString("id-ID")}\n` +
        `Sisa kuota maksimal sub: Rp ${sisaKuota.toLocaleString("id-ID")}`
      );
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/proyek/${proyekId}/alokasi-pemasukan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaMain: mainItem.namaMain, 
          namaSub: newSubName,     
          nominal: nominalSubBaru
        }),
      });

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        alert("Gagal memproses data dari server.");
        setIsSaving(false);
        return;
      }

      if (response.ok) {
        setNewSubName("");
        setNewSubNominal("");
        setAddingSubId(null); 
        if (onRefresh) onRefresh();
      } else {
        alert(result.message || "Gagal menyimpan alokasi sub");
      }
    } catch (error) {
      alert("Terjadi kesalahan jaringan sistem.");
    } finally {
      setIsSaving(false);
    }
  };

  const hitungTeralokasi = (dataPemasukan || []).reduce((acc: number, main: any) => {
    return acc + (Number(main.nominalAlokasi) || 0);
  }, 0);

  const sisaAlokasi = totalPemasukan - hitungTeralokasi;
  const progressGlobal = totalPemasukan > 0 ? (hitungTeralokasi / totalPemasukan) * 100 : 0;
  // Ambang untuk menandai sisa alokasi berwarna merah (mis. ketika negatif)
  const persentaseTerpakaiMerah = 0;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1100px] max-h-[90vh] flex flex-col overflow-hidden text-left" onClick={(e) => e.stopPropagation()}>

          <div className="px-6 pt-5 pb-4 border-b border-stone-100 flex items-start justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-stone-900">Edit Alokasi</h3>
                {kategoriProyek !== "general" && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${currentTheme.bgLight} text-stone-700`}>
                    {kategoriProyek}
                  </span>
                )}
              </div>
              <p className="text-sm text-stone-500 mt-0.5">{proyekNama} (ID: {proyekId})</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-lg transition text-stone-400 hover:text-stone-600 cursor-pointer">
              <X size={20} />
            </button>
          </div>

          <div className="px-6 py-4 shrink-0 bg-white">
            <div className="border border-[#e2e2e0] rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[13px] font-bold text-stone-800">Alokasi Pemasukan</span>
                <span className="text-[13px] font-extrabold text-stone-900">{progressGlobal.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-[#f0efe9] rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-[#00966c] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progressGlobal, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11.5px] items-center">
                <span className="text-stone-700 font-medium">
                  Total Pemasukan
                  <span className="text-[10px] text-stone-400 font-bold ml-1.5 mr-0.5">Rp</span>
                  <b className="text-stone-900 text-[13px] tracking-tight">{totalPemasukan.toLocaleString("id-ID")}</b>
                </span>
                <span className="text-stone-700 font-medium">
                  Teralokasi
                  <span className="text-[10px] text-stone-400 font-bold ml-1.5 mr-0.5">Rp</span>
                  <b className="text-stone-900 text-[13px] tracking-tight">{hitungTeralokasi.toLocaleString("id-ID")}</b>
                </span>
                <span className="text-stone-700 font-medium">
                  Sisa Alokasi
                  <span className="text-[10px] text-stone-400 font-bold ml-1.5 mr-0.5">Rp</span>
                  <b className={`text-[13px] tracking-tight ${sisaAlokasi < persentaseTerpakaiMerah ? 'text-red-600 font-bold' : 'text-stone-900'}`}>
                    {sisaAlokasi.toLocaleString("id-ID")}
                  </b>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center px-6 py-3 bg-white border-y border-stone-100 shrink-0">
            <span className="flex-1 min-w-0 text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">MAIN · SUB</span>
            <span className="w-[300px] text-[10px] font-extrabold text-stone-400 uppercase tracking-wider text-center">PROGRESS</span>
            <span className="w-[180px] text-[10px] font-extrabold text-stone-400 uppercase tracking-wider text-left">ALOKASI</span>
            <span className="w-[120px] text-[10px] font-extrabold text-stone-400 uppercase tracking-wider text-left pl-1">AKSI</span>
          </div>

          <div className="flex-1 overflow-y-auto bg-white">
            {(dataPemasukan || []).length === 0 ? (
              <div className="p-12 text-center text-stone-400 text-sm italic">
                Belum ada data pemasukan untuk proyek ini.
              </div>
            ) : (
              (dataPemasukan || []).map((main: any) => {
                const isMainOpen = expandedMain[main.id] ?? true;
                const totalTeralokasiSub = (main.subAnggaran || []).reduce((s: number, i: any) => s + (Number(i.nominalAlokasi) || 0), 0);
                const rawMainAlokasi = Number(main.nominalAlokasi) || 0;
                const mainAlokasi = rawMainAlokasi > totalTeralokasiSub ? rawMainAlokasi : rawMainAlokasi; 
                const mainTerpakai = Number(main.nominalTerpakai) || 0;
                const hasTermin = Array.isArray(main.termin) ? main.termin.length > 0 : Boolean(main.termin);
                const mainPct = hasTermin && mainAlokasi > 0 ? (mainTerpakai / mainAlokasi) * 100 : 0;
                
                return (
                  <div key={main.id} className="border-b border-stone-100/50 last:border-0">
                    <Row onClick={() => toggleMain(main.id)}>
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="text-stone-500 shrink-0">
                          {isMainOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </div>
                        <span className="text-[13px] font-bold text-stone-800 shrink-0">MAIN</span>
                        <span className="text-[13px] font-bold text-stone-800 truncate">· {main.namaMain}</span>
                      </div>

                      {/* Progress bar tetap dirender menampilkan 0.0% jika tidak ada termin */}
                      <ProgressCell pct={mainPct} />

                      <div className="w-[180px] text-[13px] font-medium text-stone-600 shrink-0">
                        Rp {mainAlokasi.toLocaleString("id-ID")}
                      </div>

                      <div className="w-[120px] flex justify-start shrink-0">
                        <AksiButton onClick={() => setEditTarget({
                          type: "main", id: main.id, nama: main.namaMain,
                          currentAlokasi: main.nominalAlokasi, totalRAB: totalPemasukan, totalTeralokasi: totalTeralokasiSub
                        })}>
                          Edit Alokasi
                        </AksiButton>
                      </div>
                    </Row>

                    {isMainOpen && (
                      <div className="bg-white">
                        {(main.subAnggaran || []).map((sub: any) => {
                          const subAlokasi = Number(sub.nominalAlokasi) || 0;
                          const subTerpakai = Number(sub.nominalTerpakai) || 0;
                          
                          const subHasTermin = Array.isArray(sub.termin) ? sub.termin.length > 0 : (hasTermin || Boolean(sub.termin));
                          const subPct = subHasTermin && subAlokasi > 0 ? (subTerpakai / subAlokasi) * 100 : 0;

                          return (
                            <Row key={sub.id} className="bg-white">
                              <div className="flex items-center gap-2.5 flex-1 min-w-0" style={{ paddingLeft: 28 }}>
                                <span className="text-[11px] font-bold text-stone-400 shrink-0">SUB</span>
                                <span className="text-[13px] font-medium text-stone-600 truncate">· {sub.namaSub}</span>
                              </div>
                              
                              {/* Progress bar sub tetap dirender menampilkan 0.0% jika tidak ada termin */}
                              <ProgressCell pct={subPct} />

                              <div className="w-[180px] text-[13px] font-medium text-stone-600 shrink-0">
                                Rp {subAlokasi.toLocaleString("id-ID")}
                              </div>
                              <div className="w-[120px] flex justify-start shrink-0">
                                <AksiButton onClick={() => setEditTarget({
                                  type: "sub", id: sub.id, mainId: main.id, nama: sub.namaSub, parentNama: main.namaMain,
                                  currentAlokasi: sub.nominalAlokasi, totalRAB: main.nominalAlokasi, totalTeralokasi: totalTeralokasiSub
                                })}>
                                  Edit Alokasi
                                </AksiButton>
                              </div>
                            </Row>
                          );
                        })}

                        {addingSubId === main.id ? (
                          <div className="p-4 mx-4 mb-4 bg-white border border-stone-200/70 rounded-xl flex flex-col gap-3 shadow-sm ml-12">
                            <span className="text-[12px] font-extrabold text-stone-700 uppercase">
                              Sub Baru (Untuk: {main.namaMain})
                            </span>

                            <div className="flex gap-3 items-center">
                              <div className="flex-1 bg-stone-50 border border-stone-200 rounded-lg flex items-center px-3 py-2">
                                <input
                                  type="text"
                                  placeholder="Nama Sub Pemasukan"
                                  value={newSubName}
                                  onChange={(e) => setNewSubName(e.target.value)}
                                  className="w-full text-[12px] text-stone-800 outline-none placeholder:text-stone-400 font-medium bg-transparent"
                                />
                              </div>
                              <div className="w-1/3 bg-stone-50 border border-stone-200 rounded-lg flex items-center px-3 py-2">
                                <span className="text-[12px] font-bold text-stone-400 mr-2">Rp</span>
                                <input
                                  type="text"
                                  placeholder="0"
                                  value={newSubNominal}
                                  onChange={handleSubNominalChange}
                                  className="w-full text-[12px] text-stone-800 outline-none font-mono font-bold bg-transparent"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-3 mt-1">
                              <button
                                onClick={() => handleSimpanSub(main)}
                                disabled={isSaving}
                                className={`px-4 py-2 text-white text-[11px] font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer ${currentTheme.primary} ${currentTheme.hover}`}
                              >
                                {isSaving ? "Menyimpan..." : "Simpan Sub"}
                              </button>
                              <button
                                onClick={() => {
                                  setAddingSubId(null);
                                  setNewSubName("");
                                  setNewSubNominal("");
                                }}
                                className="text-[11px] font-bold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="py-3" style={{ paddingLeft: 52 }}>
                            <button
                              onClick={() => setAddingSubId(main.id)}
                              className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#00966c] hover:text-[#007f5a] transition cursor-pointer"
                            >
                              <Plus size={14} /> Tambah Sub
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {isAddingMain ? (
              <div className="p-5 m-5 bg-[#f8f7f4] border border-[#e2e2e0] rounded-xl flex flex-col gap-4 shadow-sm">
                <span className="text-[13px] font-extrabold text-stone-900 tracking-wide uppercase">
                  Main Baru
                </span>

                <div className="flex gap-4 items-center">
                  <div className="flex-1 bg-white border border-stone-200 rounded-lg flex items-center px-4 py-2.5">
                    <input
                      type="text"
                      placeholder="Nama Pemasukan (cth: Penjualan Jasa Tambahan)"
                      value={newMainName}
                      onChange={(e) => setNewMainName(e.target.value)}
                      className="w-full text-[13px] text-stone-800 outline-none placeholder:text-stone-400 font-medium bg-transparent"
                    />
                  </div>
                  <div className="w-1/3 bg-white border border-stone-200 rounded-lg flex items-center px-4 py-2.5">
                    <span className="text-[13px] font-bold text-stone-400 mr-2">Rp</span>
                    <input
                      type="text"
                      placeholder="0"
                      value={newMainNominal}
                      onChange={handleNominalChange}
                      className="w-full text-[13px] text-stone-800 outline-none font-mono font-bold bg-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleSimpanMain}
                    disabled={isSaving}
                    className={`px-5 py-2.5 text-white text-[12px] font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer ${currentTheme.primary} ${currentTheme.hover}`}
                  >
                    {isSaving ? "Menyimpan..." : "Simpan Pemasukan"}
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingMain(false);
                      setNewMainName("");
                      setNewMainNominal("");
                    }}
                    className="text-[12px] font-bold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 border-t border-stone-50">
                <button
                  onClick={() => setIsAddingMain(true)}
                  className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#b35900] hover:text-[#8a4400] transition cursor-pointer"
                >
                  <Plus size={16} /> Tambah Main
                </button>
              </div>
            )}
          </div>

          <div className="px-6 py-5 border-t border-stone-100 flex justify-end bg-white shrink-0">
            <button onClick={onClose} className="px-7 py-2.5 bg-[#1c1c1c] hover:bg-black text-white text-[13px] font-bold rounded-xl transition cursor-pointer">
              Tutup
            </button>
          </div>
        </div>
      </div>

      {editTarget && (
        <EditAlokasiModal
          proyekId={typeof proyekId === 'string' ? parseInt(proyekId, 10) : proyekId}
          main={{
            id: editTarget.type === "sub" ? editTarget.mainId : editTarget.id,
            nama: editTarget.nama,
            alokasi: Number(editTarget.currentAlokasi) || 0,
          }}
          subId={editTarget.type === "sub" ? editTarget.id : undefined}
          totalRAB={editTarget.type === "sub" ? Number(editTarget.totalRAB) : totalPemasukan}
          sumLain={hitungTeralokasi - (Number(editTarget.currentAlokasi) || 0)}
          sumSub={editTarget.totalTeralokasi || 0}
          kategoriProyek={kategoriProyek}
          onClose={() => setEditTarget(null)}
          onSuccess={() => {
            setEditTarget(null);
            onRefresh?.();
          }}
        />
      )}
    </>
  );
}