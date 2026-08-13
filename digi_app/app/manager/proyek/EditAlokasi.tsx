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

// ─── Shared constants (mirip DetailAnggaran) ────────────────────────────────
const COL_CLASS = "flex items-center gap-3 px-6 py-1.5 hover:bg-stone-50 transition";
const NAME_CLASS = "flex items-center gap-2 flex-1 min-w-0 max-w-[440px]";

// Row dengan support indent (persis seperti DetailAnggaran)
function Row({ children, onClick, indent = 0, className = "" }: any) {
  const childrenArray = React.Children.toArray(children);
  const firstChild = childrenArray[0];
  const restChildren = childrenArray.slice(1);

  const modifiedFirstChild = React.isValidElement(firstChild)
    ? React.cloneElement(firstChild as React.ReactElement<any>, {
      style: {
        ...((firstChild as React.ReactElement<any>).props?.style || {}),
        paddingLeft: indent * 24,
      },
    })
    : firstChild;

  return (
    <div
      onClick={onClick}
      className={`${COL_CLASS} ${onClick ? "cursor-pointer select-none" : ""} ${className}`}
      style={{ paddingLeft: 24 }}
    >
      {modifiedFirstChild}
      {restChildren}
    </div>
  );
}

function ProgressCell({ pct }: { pct: number }) {
  const displayPct = Math.min(Math.max(pct, 0), 100);

  // Warna dinamis: hijau → kuning → merah (seperti DetailAnggaran)
  let barColor = "#008f5d";
  let textColor = "#005836";
  if (pct >= 90) {
    barColor = "#d36c66";
    textColor = "#991b1b";
  } else if (pct >= 75) {
    barColor = "#d8953d";
    textColor = "#92400e";
  }

  return (
    <div className="flex items-center justify-center shrink-0" style={{ width: 320 }}>
      <div className="flex items-center justify-center gap-2.5 w-full px-3 shrink-0">
        <div className="flex-1 bg-stone-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${displayPct}%`, backgroundColor: barColor }}
          />
        </div>
        <span
          className="text-[11px] font-bold tabular-nums w-12 text-left shrink-0"
          style={{ color: textColor }}
        >
          {pct.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

// Cell dengan lebar tetap (mirip DetailAnggaran)
function Cell({
  children,
  bold,
  style,
}: {
  children: React.ReactNode;
  bold?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`text-[12px] text-stone-800 shrink-0 text-center whitespace-nowrap ${bold ? "font-bold" : ""}`}
      style={{ width: 220, ...style }}
    >
      {children}
    </span>
  );
}

// AksiButton dengan warna per variant (persis DetailAnggaran)
type AksiVariant = "main" | "sub";

const VARIANT_STYLES: Record<AksiVariant, { bg: string; border: string; text: string }> = {
  main: { bg: "#fdf7f2", border: "#b38355", text: "#8d5423" },
  sub: { bg: "#f1f7f4", border: "#388863", text: "#1f6245" },
};

function AksiButton({
  children,
  variant = "sub",
  onClick,
}: {
  children: React.ReactNode;
  variant?: AksiVariant;
  onClick?: () => void;
}) {
  const styles = VARIANT_STYLES[variant];
  // MAIN pakai Plus (sama seperti "Ajukan Alokasi" di DetailAnggaran)
  // SUB pakai Settings (sama seperti "Edit Alokasi" di DetailAnggaran)
  const Icon = variant === "main" ? Plus : Settings;
  return (
    <div className="flex justify-center shrink-0" style={{ width: 120 }}>
      <button
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer whitespace-nowrap hover:opacity-85 shadow-sm"
        style={{ backgroundColor: styles.bg, borderColor: styles.border, color: styles.text }}
      >
        <Icon size={12} style={{ color: styles.text }} />
        {children}
      </button>
    </div>
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

  // ── Master data (master_main + master_sub tipe=pemasukan) ──────────────────
  const [masterData, setMasterData] = useState<any[]>([]);
  const [isMasterLoading, setIsMasterLoading] = useState(false);

  const currentTheme = THEME_COLORS[kategoriProyek] || THEME_COLORS.general;

  // Fetch master data saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;
    setIsMasterLoading(true);
    fetch("/api/master?tipe=pemasukan")
      .then((res) => res.json())
      .then((json) => {
        setMasterData(json.data || []);
      })
      .catch((err) => console.error("Gagal fetch master pemasukan:", err))
      .finally(() => setIsMasterLoading(false));
  }, [isOpen]);

  useEffect(() => {
    setExpandedMain({});
    setIsAddingMain(false);
    setAddingSubId(null);
    setNewMainName("");
    setNewMainNominal("");
    setNewSubName("");
    setNewSubNominal("");
  }, [proyekId]);

  // ── Helper: cari nominal alokasi dari dataPemasukan berdasarkan nama ───────
  // dataPemasukan = data alokasi proyek yang sudah tersimpan di DB proyek
  // masterData    = daftar kategori master (master_main / master_sub)
  function cariAlokasiMain(namaMain: string) {
    const found = (dataPemasukan || []).find(
      (m: any) => (m.namaMain || "").toLowerCase() === namaMain.toLowerCase()
    );
    return found || null;
  }

  function cariAlokasiSub(namaMain: string, namaSub: string) {
    const mainItem = cariAlokasiMain(namaMain);
    if (!mainItem) return null;
    return ((mainItem.subAnggaran || []).find(
      (s: any) => (s.namaSub || "").toLowerCase() === namaSub.toLowerCase()
    )) || null;
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

  // masterMain = data dari masterData (nama, id dari master_main)
  // alokasiMain = data dari dataPemasukan (nominalAlokasi, subAnggaran, namaMain)
  const handleSimpanSub = async (masterMain: any, alokasiMain: any) => {
    const nominalSubBaru = Number(newSubNominal.replace(/\./g, "")) || 0;

    if (!newSubName || nominalSubBaru <= 0) {
      alert("Nama Sub dan Nominal harus diisi dengan benar!");
      return;
    }

    if (newSubName.trim().toLowerCase() === masterMain.nama.trim().toLowerCase()) {
      alert("Nama Sub dan Main tidak boleh sama!");
      return;
    }

    // Hitung total sub yang sudah ada & cek duplikasi sub
    const subAnggaranSaatIni = alokasiMain?.subAnggaran || [];
    const isSubDuplicate = subAnggaranSaatIni.some(
      (sub: any) => (sub.namaSub || "").trim().toLowerCase() === newSubName.trim().toLowerCase()
    );
    if (isSubDuplicate) {
      alert(`Sub "${newSubName}" sudah ditambahkan di bawah Main "${masterMain.nama}"!`);
      return;
    }

    const totalSubSebelumnya = subAnggaranSaatIni.reduce(
      (sum: number, sub: any) => sum + (Number(sub.nominalAlokasi) || 0),
      0
    );

    const batasMaksimalMain = Number(alokasiMain?.nominalAlokasi) || 0;
    const sisaKuota = batasMaksimalMain - totalSubSebelumnya;

    // Validasi hanya jika main sudah punya alokasi (ada batas)
    if (batasMaksimalMain > 0 && nominalSubBaru > sisaKuota) {
      alert(
        `GAGAL: Total alokasi sub akan melewati batas MAIN!\n\n` +
        `Batas Patokan MAIN "${masterMain.nama}": Rp ${batasMaksimalMain.toLocaleString("id-ID")}\n` +
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
          namaMain: masterMain.nama,
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

  // Master main yang sudah terpilih / dialokasikan di proyek
  const selectedMasterData = masterData.filter((main: any) => Boolean(cariAlokasiMain(main.nama)));
  // Master main yang belum terpilih untuk dropdown Tambah Main
  const unselectedMasterData = masterData.filter((main: any) => !cariAlokasiMain(main.nama));

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1260px] max-h-[85vh] flex flex-col overflow-hidden text-left" onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-stone-100 flex items-start justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-sans font-bold text-stone-900">Edit Alokasi</h3>
                {kategoriProyek !== "general" && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${currentTheme.bgLight} text-stone-700`}>
                    {kategoriProyek}
                  </span>
                )}
              </div>
              <p className="text-sm font-sans text-stone-500 mt-0.5">{proyekNama}</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-lg transition text-stone-400 hover:text-stone-600 cursor-pointer">
              <X size={18} />
            </button>
          </div>

          {/* Column headers */}
          <div className="flex items-center gap-3 px-6 py-2 bg-stone-50 border-b border-stone-100 shrink-0">
            <span className="flex-1 min-w-0 max-w-[440px] text-[10px] font-bold text-stone-400 uppercase tracking-wider">MAIN · SUB</span>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0 text-center" style={{ width: 320 }}>PROGRESS</span>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0 text-center" style={{ width: 220 }}>ALOKASI</span>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0 text-center" style={{ width: 120 }}>AKSI</span>
          </div>

          {/* Scrollable rows — hanya menampilkan main yang terpilih */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-50 bg-white">
            {isMasterLoading ? (
              <div className="p-12 text-center text-stone-400 text-sm">
                Memuat data master...
              </div>
            ) : selectedMasterData.length === 0 ? (
              <div className="p-12 text-center border border-stone-200 rounded-xl m-6">
                <div className="font-sans font-bold text-sm text-stone-900 mb-1.5">Belum Ada Pemasukan Terpilih</div>
                <div className="font-sans text-xs text-stone-400">Silakan klik "Tambah Main" untuk memilih dan mengalokasikan pemasukan.</div>
              </div>
            ) : (
              selectedMasterData.map((main: any) => {
                const isMainOpen = expandedMain[main.id] ?? true;

                // Cari data alokasi proyek yang sudah ada (untuk nominal & progress)
                const alokasiMain = cariAlokasiMain(main.nama);
                const mainAlokasi = Number(alokasiMain?.nominalAlokasi) || 0;
                const mainTerpakai = Number(alokasiMain?.nominalTerpakai) || 0;
                const hasTermin = alokasiMain
                  ? (Array.isArray(alokasiMain.termin) ? alokasiMain.termin.length > 0 : Boolean(alokasiMain.termin))
                  : false;
                const mainPct = hasTermin && mainAlokasi > 0 ? (mainTerpakai / mainAlokasi) * 100 : 0;
                const totalTeralokasiSub = (alokasiMain?.subAnggaran || []).reduce(
                  (s: number, i: any) => s + (Number(i.nominalAlokasi) || 0), 0
                );

                return (
                  <div key={main.id}>
                    {/* MAIN row — dari master_main */}
                    <Row onClick={() => toggleMain(main.id)}>
                      <div className={NAME_CLASS}>
                        <div className="p-0.5 shrink-0">
                          {isMainOpen ? (
                            <ChevronDown size={13} className="text-stone-500" />
                          ) : (
                            <ChevronRight size={13} className="text-stone-500" />
                          )}
                        </div>
                        <span
                          className="text-[13px] font-bold uppercase shrink-0"
                          style={{ color: "#14130F" }}
                        >
                          MAIN
                        </span>
                        <span className="text-[13px] font-semibold text-stone-800 truncate">
                          {main.nama}
                        </span>
                      </div>

                      <ProgressCell pct={mainPct} />

                      <Cell bold>
                        {mainAlokasi > 0 ? `Rp ${mainAlokasi.toLocaleString("id-ID")}` : <span className="text-stone-400 font-normal">Belum dialokasikan</span>}
                      </Cell>

                      <AksiButton
                        variant="main"
                        onClick={() => alokasiMain && setEditTarget({
                          type: "main",
                          id: alokasiMain.id,
                          nama: alokasiMain.namaMain,
                          currentAlokasi: alokasiMain.nominalAlokasi,
                          totalRAB: totalPemasukan,
                          totalTeralokasi: totalTeralokasiSub
                        })}
                      >
                        Edit Alokasi
                      </AksiButton>
                    </Row>

                    {isMainOpen && (
                      <div className="bg-stone-50/50">
                        {/* SUB: hanya tampilkan yang sudah diinput user (dari dataPemasukan) */}
                        {(alokasiMain?.subAnggaran || []).length === 0 ? (
                          <p className="pl-14 py-2.5 text-[12px] text-stone-400 italic">
                            Belum ada sub pemasukan.
                          </p>
                        ) : (
                          (alokasiMain?.subAnggaran || []).map((sub: any) => {
                            const subAlokasi = Number(sub.nominalAlokasi) || 0;
                            const subTerpakai = Number(sub.nominalTerpakai) || 0;
                            const subHasTermin = Array.isArray(sub.termin)
                              ? sub.termin.length > 0
                              : (hasTermin || Boolean(sub.termin));
                            const subPct = subHasTermin && subAlokasi > 0 ? (subTerpakai / subAlokasi) * 100 : 0;

                            return (
                              <Row key={sub.id} indent={1} className="hover:bg-stone-100/60">
                                <div className={NAME_CLASS}>
                                  <div className="p-0.5 shrink-0">
                                    <ChevronRight size={12} className="text-stone-400" />
                                  </div>
                                  <span
                                    className="text-[9px] font-bold uppercase shrink-0"
                                    style={{ color: "#9A948B" }}
                                  >
                                    SUB
                                  </span>
                                  <span className="text-[12px] font-semibold text-stone-700 truncate">
                                    {sub.namaSub}
                                  </span>
                                </div>

                                <ProgressCell pct={subPct} />

                                <Cell>
                                  {subAlokasi > 0 ? `Rp ${subAlokasi.toLocaleString("id-ID")}` : <span className="text-stone-400">—</span>}
                                </Cell>

                                {/* Edit Alokasi SUB — sama seperti MAIN, selalu aktif */}
                                <AksiButton
                                  variant="sub"
                                  onClick={() => setEditTarget({
                                    type: "sub",
                                    id: sub.id,
                                    mainId: alokasiMain?.id,
                                    nama: sub.namaSub,
                                    parentNama: alokasiMain?.namaMain,
                                    currentAlokasi: sub.nominalAlokasi,
                                    totalRAB: alokasiMain?.nominalAlokasi,
                                    totalTeralokasi: totalTeralokasiSub
                                  })}
                                >
                                  Edit Alokasi
                                </AksiButton>
                              </Row>
                            );
                          })
                        )}

                        {addingSubId === main.id ? (() => {
                          const existingSubNames = (alokasiMain?.subAnggaran || []).map(
                            (s: any) => (s.namaSub || "").trim().toLowerCase()
                          );
                          const availableMasterSubs = (main.MasterSub || []).filter((ms: any) => {
                            const msName = (ms.nama || "").trim().toLowerCase();
                            const mainName = (main.nama || "").trim().toLowerCase();
                            return msName !== mainName && !existingSubNames.includes(msName);
                          });

                          return (
                            <div className="p-4 mx-4 mb-4 bg-white border border-stone-200/70 rounded-xl flex flex-col gap-3 shadow-sm ml-12">
                              <span className="text-[12px] font-extrabold text-stone-700 uppercase">
                                Sub Baru (Untuk: {main.nama})
                              </span>

                              <div className="flex gap-3 items-center">
                                {/* Dropdown master_sub yang sesuai (filter out sub name sama dengan main & sub yang sudah terpilih) */}
                                <div className="flex-1 bg-stone-50 border border-stone-200 rounded-lg flex items-center px-3 py-2">
                                  <select
                                    value={newSubName}
                                    onChange={(e) => setNewSubName(e.target.value)}
                                    className="w-full text-[12px] text-stone-800 outline-none font-medium bg-transparent cursor-pointer"
                                  >
                                    <option value="">
                                      {availableMasterSubs.length === 0
                                        ? "-- Semua Sub Pemasukan Sudah Ditambahkan --"
                                        : "-- Pilih Sub Pemasukan --"}
                                    </option>
                                    {availableMasterSubs.map((ms: any) => (
                                      <option key={ms.id} value={ms.nama}>
                                        {ms.nama}
                                      </option>
                                    ))}
                                  </select>
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
                                  onClick={() => handleSimpanSub(main, alokasiMain)}
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
                          );
                        })() : (
                          <div className="py-2.5" style={{ paddingLeft: 52 }}>
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
                  {/* Dropdown master_main yang belum dipilih */}
                  <div className="flex-1 bg-white border border-stone-200 rounded-lg flex items-center px-4 py-2.5">
                    <select
                      value={newMainName}
                      onChange={(e) => setNewMainName(e.target.value)}
                      className="w-full text-[13px] text-stone-800 outline-none font-medium bg-transparent cursor-pointer"
                    >
                      <option value="">-- Pilih Pemasukan --</option>
                      {unselectedMasterData.map((m: any) => (
                        <option key={m.id} value={m.nama}>
                          {m.nama}
                        </option>
                      ))}
                    </select>
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

          <div className="px-6 py-4 border-t border-stone-100 flex justify-end bg-white shrink-0">
            <button onClick={onClose} className="px-5 py-2 bg-stone-800 hover:bg-stone-900 text-white text-[13px] font-bold rounded-xl transition cursor-pointer">
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