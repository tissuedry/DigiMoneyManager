"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Plus, X, Loader2 } from "lucide-react";
import { formatShort } from "./page";

type AjukanKet = {
  id: number;
  nama: string;
  alokasi: number;
  isDraft?: boolean;
};

type AjukanSub = {
  id: number;
  nama: string;
  alokasi: number;
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
  proyekId,
  proyekNama,
  totalRAB,
  realisasi,
  posAnggaran,
  onClose,
}: {
  proyekId: number;
  proyekNama: string;
  totalRAB: number;
  realisasi: number;
  posAnggaran: any[];
  onClose: () => void;
}) {
  // Build initial data from API
  const [data, setData] = useState<AjukanMain[]>(() => []);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const mapped: AjukanMain[] = posAnggaran.map((main) => ({
      id: main.id,
      nama: main.nama,
      alokasi: main.alokasi,
      subPos: (main.subAnggaran || []).map((sub: any) => ({
        id: sub.id,
        nama: sub.nama,
        alokasi: sub.alokasi,
        keterangan: (sub.keterangan || []).map((ket: any) => ({
          id: ket.id,
          nama: ket.nama,
          alokasi: ket.alokasi,
        })),
      })),
    }));
    setData(mapped);
    setLoading(false);
  }, [posAnggaran]);

  const [expandedMain, setExpandedMain] = useState<Record<number, boolean>>({});
  const [expandedSub, setExpandedSub] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (data.length > 0 && Object.keys(expandedMain).length === 0) {
      data.forEach((m) => setExpandedMain((p) => ({ ...p, [m.id]: true })));
    }
  }, [data, expandedMain]);

  // Adding Sub state
  const [addingSubMainId, setAddingSubMainId] = useState<number | null>(null);
  const [newSubName, setNewSubName] = useState("");
  const [newSubAlokasi, setNewSubAlokasi] = useState("");

  // Adding Keterangan state
  const [addingKetSubId, setAddingKetSubId] = useState<number | null>(null);
  const [newKetName, setNewKetName] = useState("");
  const [newKetAlokasi, setNewKetAlokasi] = useState("");

  // Master data states for dropdowns
  const [masterMainList, setMasterMainList] = useState<any[]>([]);
  const [subOptions, setSubOptions] = useState<Record<number, any[]>>({}); // mainId -> MasterSub[]
  const [loadingSubOptions, setLoadingSubOptions] = useState<Record<number, boolean>>({});
  const [ketOptions, setKetOptions] = useState<Record<number, any[]>>({}); // subId -> MasterKeterangan[]
  const [loadingKetOptions, setLoadingKetOptions] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchMasterMain = async () => {
      try {
        const res = await fetch("/api/master");
        if (res.ok) {
          const data = await res.json();
          setMasterMainList(data);
        }
      } catch (err) {
        console.error("Failed to fetch master main:", err);
      }
    };
    fetchMasterMain();
  }, []);

  const loadSubOptions = async (mainId: number, mainNama: string) => {
    if (subOptions[mainId]) return;
    setLoadingSubOptions((prev) => ({ ...prev, [mainId]: true }));
    try {
      let mainList = masterMainList;
      if (mainList.length === 0) {
        const res = await fetch("/api/master");
        if (res.ok) {
          mainList = await res.json();
          setMasterMainList(mainList);
        }
      }
      const matchingMain = mainList.find(
        (m) => m.nama.toUpperCase().trim() === mainNama.toUpperCase().trim()
      );
      if (matchingMain) {
        const res = await fetch(`/api/master?mainId=${matchingMain.id}`);
        if (res.ok) {
          const subs = await res.json();
          setSubOptions((prev) => ({ ...prev, [mainId]: subs }));
          setNewSubName("");
        }
      }
    } catch (err) {
      console.error("Failed to load sub options:", err);
    } finally {
      setLoadingSubOptions((prev) => ({ ...prev, [mainId]: false }));
    }
  };

  const loadKetOptions = async (subId: number, subNama: string) => {
    if (ketOptions[subId]) return;
    setLoadingKetOptions((prev) => ({ ...prev, [subId]: true }));
    try {
      const parentMain = data.find((m) => m.subPos.some((s) => s.id === subId));
      if (!parentMain) return;

      let mainList = masterMainList;
      if (mainList.length === 0) {
        const res = await fetch("/api/master");
        if (res.ok) {
          mainList = await res.json();
          setMasterMainList(mainList);
        }
      }

      const matchingMain = mainList.find(
        (m) => m.nama.toUpperCase().trim() === parentMain.nama.toUpperCase().trim()
      );
      if (!matchingMain) return;

      let subs = subOptions[parentMain.id];
      if (!subs) {
        const res = await fetch(`/api/master?mainId=${matchingMain.id}`);
        if (res.ok) {
          subs = await res.json();
          setSubOptions((prev) => ({ ...prev, [parentMain.id]: subs }));
        }
      }

      if (subs) {
        const matchingSub = subs.find(
          (s) => s.nama.toUpperCase().trim() === subNama.toUpperCase().trim()
        );
        if (matchingSub) {
          const res = await fetch(`/api/master?subId=${matchingSub.id}`);
          if (res.ok) {
            const kets = await res.json();
            setKetOptions((prev) => ({ ...prev, [subId]: kets }));
            setNewKetName("");
          }
        }
      }
    } catch (err) {
      console.error("Failed to load ket options:", err);
    } finally {
      setLoadingKetOptions((prev) => ({ ...prev, [subId]: false }));
    }
  };

  const toggleMain = (id: number) => setExpandedMain((p) => ({ ...p, [id]: !p[id] }));
  const toggleSub = (id: number) => setExpandedSub((p) => ({ ...p, [id]: !p[id] }));

  const handleAddSub = (mainId: number) => {
    if (!newSubName || !newSubAlokasi) {
      alert("Harap isi semua kolom untuk mengajukan Sub baru!");
      return;
    }
    const alokasiVal = parseRupiahInput(newSubAlokasi);

    const main = data.find((m) => m.id === mainId);
    if (!main) return;
    const currentTotal = main.subPos.reduce((sum, s) => sum + s.alokasi, 0);
    if (currentTotal + alokasiVal > main.alokasi) {
      alert("Total alokasi Sub Pos melebihi batas alokasi Main Pos parent!");
      return;
    }

    setData((prev) =>
      prev.map((main) => {
        if (main.id === mainId) {
          const updatedSub = {
            id: Date.now(),
            nama: newSubName,
            alokasi: alokasiVal,
            status: "MENUNGGU" as const,
            keterangan: [],
          };
          setExpandedSub((prevSub) => ({ ...prevSub, [updatedSub.id]: true }));
          return { ...main, subPos: [...main.subPos, updatedSub] };
        }
        return main;
      })
    );

    setAddingSubMainId(null);
    setNewSubName("");
    setNewSubAlokasi("");
  };

  const handleAddKet = (subId: number) => {
    if (!newKetName || !newKetAlokasi) {
      alert("Harap isi semua kolom untuk mengajukan Keterangan baru!");
      return;
    }
    const alokasiVal = parseRupiahInput(newKetAlokasi);

    let parentSub: AjukanSub | undefined;
    for (const m of data) {
      const found = m.subPos.find((s) => s.id === subId);
      if (found) {
        parentSub = found;
        break;
      }
    }
    if (!parentSub) return;
    const currentTotal = parentSub.keterangan.reduce((sum, k) => sum + k.alokasi, 0);
    if (currentTotal + alokasiVal > parentSub.alokasi) {
      alert("Total alokasi Keterangan melebihi batas alokasi Sub Pos parent!");
      return;
    }

    setData((prev) =>
      prev.map((main) => ({
        ...main,
        subPos: main.subPos.map((sub) => {
          if (sub.id === subId) {
            return {
              ...sub,
              keterangan: [
                ...sub.keterangan,
                { id: Date.now(), nama: newKetName, alokasi: alokasiVal, isDraft: true },
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
  };

  const handleSubmit = async () => {
    const items: any[] = [];

    // ponytail: draft id Sub baru (Date.now(), 13-digit) gak muat di kolom targetId (Int32).
    // Remap setiap draft Sub id ke index negatif (-1, -2, ...) — muat Int32, gak nabrak
    // real autoincrement id (selalu positif). Backend pakai targetId ini sebagai key
    // subIdMap lalu resolve parentId KET yang nested di Sub baru → real DB id.
    const draftIdMap = new Map<number, number>();
    let draftIdx = 0;
    const draftRef = (draftSubId: number) => {
      if (!draftIdMap.has(draftSubId)) {
        draftIdx += 1;
        draftIdMap.set(draftSubId, -draftIdx);
      }
      return draftIdMap.get(draftSubId)!;
    };

    data.forEach((main) => {
      main.subPos.forEach((sub) => {
        const isDraftSub = sub.status === "MENUNGGU";
        // parent ref untuk KET: Sub lama → id asli; Sub baru → index negatif remap.
        const ketParentRef = isDraftSub ? draftRef(sub.id) : sub.id;

        if (isDraftSub) {
          items.push({
            tipe: "SUB_ANGGARAN",
            aksi: "TAMBAH",
            parentId: main.id,
            targetId: ketParentRef,
            nama: sub.nama,
            nominalAlokasi: sub.alokasi,
          });
        }
        sub.keterangan.forEach((ket) => {
          if (ket.isDraft) {
            items.push({
              tipe: "KETERANGAN",
              aksi: "TAMBAH",
              parentId: ketParentRef,
              nama: ket.nama,
              nominalAlokasi: ket.alokasi,
            });
          }
        });
      });
    });

    if (items.length === 0) {
      alert("Belum ada pos yang diajukan.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/proyek/${proyekId}/pengajuan-anggaran`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul: `Pengajuan pos anggaran untuk ${proyekNama}`,
          deskripsi: `Pengajuan ${items.length} item baru`,
          items,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.message || "Gagal mengajukan pos");
        return;
      }
      onClose();
    } catch {
      setError("Terjadi kesalahan koneksi");
    } finally {
      setSubmitting(false);
    }
  };

  const parseRupiahInput = (val: string): number => {
    if (!val) return 0;
    if (val.includes("T")) {
      const num = parseFloat(val.replace(/[^0-9.]/g, "")) || 0;
      return num * 1_000_000_000_000;
    }
    return parseFloat(val.replace(/[^0-9]/g, "")) || 0;
  };

  const formatInputRupiah = (val: string) => {
    const raw = parseRupiahInput(val);
    if (!raw) return "";
    const n = Math.min(raw, 100_000_000_000_000);
    if (n >= 100_000_000_000_000) {
      return "100 T";
    }
    return "Rp " + n.toLocaleString("id-ID");
  };

  let pendingCount = 0;
  data.forEach((main) => {
    main.subPos.forEach((sub) => {
      if (sub.status === "MENUNGGU") pendingCount++;
      sub.keterangan.forEach((ket) => { if (ket.isDraft) pendingCount++; });
    });
  });

  const progressPct = totalRAB > 0 ? Math.min((realisasi / totalRAB) * 100, 100) : 0;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <Loader2 size={24} className="animate-spin text-stone-400 mx-auto" />
          <p className="text-stone-400 text-sm mt-3">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

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

        {/* Error banner */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-[12px] font-medium text-red-700">{error}</div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Realisasi Anggaran Box */}
          <div className="bg-stone-50 border border-stone-150 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-stone-750">
              <span>Realisasi Anggaran</span>
              <span>{progressPct.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
              <div className="h-full bg-[#008f5d] rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="flex justify-between items-center text-[11px] text-stone-950 px-0.5">
              <span>Nilai Proyek <span className="text-stone-850 font-bold">{formatShort(totalRAB)}</span></span>
              <span>Realisasi <span className="text-stone-850 font-bold">{formatShort(realisasi)}</span></span>
              <span>Sisa <span className="text-stone-850 font-bold">{formatShort(totalRAB - realisasi)}</span></span>
            </div>
          </div>

          <p className="text-[12px] font-bold text-stone-500">
            Anggaran Proyek — klik &quot;+ Tambah&quot; untuk mengajukan Sub / Keterangan baru
          </p>

          <div className="border border-stone-250/70 rounded-2xl divide-y divide-stone-100 overflow-hidden bg-white">
            {data.map((main) => {
              const isMainOpen = expandedMain[main.id] ?? true;
              return (
                <div key={main.id} className="p-4 space-y-3">
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

                  {isMainOpen && (
                    <div className="pl-6 space-y-3">
                      {main.subPos.map((sub) => {
                        const isSubOpen = expandedSub[sub.id] ?? false;
                        const isNewSub = sub.status === "MENUNGGU";
                        return (
                          <div key={sub.id} className="border-l border-stone-200/60 pl-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button onClick={() => toggleSub(sub.id)} className="p-0.5 hover:bg-stone-100 rounded transition cursor-pointer shrink-0 text-stone-500">
                                  {isSubOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                </button>
                                <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#9A948B' }}>SUB</span>
                                <span className="text-[12px] font-semibold text-stone-800">
                                  {isNewSub ? `Sub Baru: ${sub.nama}` : sub.nama}
                                </span>
                                {sub.status && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">{sub.status}</span>
                                )}
                              </div>
                              <span className="text-[12px] font-bold text-stone-800">{formatShort(sub.alokasi)}</span>
                            </div>

                            {isSubOpen && (
                              <div className="pl-6 space-y-2">
                                {sub.keterangan.map((ket) => (
                                  <div key={ket.id} className="flex items-center justify-between text-xs text-stone-650">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#9A948B' }}>KET</span>
                                      <span className="font-medium text-stone-700">{ket.nama}</span>
                                      {ket.isDraft && (
                                        <span className="text-[8px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider rounded">Draft</span>
                                      )}
                                    </div>
                                    <span className="text-stone-500 font-semibold">{formatShort(ket.alokasi)}</span>
                                  </div>
                                ))}

                                {/* Add Keterangan inline */}
                                <div className="pt-1">
                                  {addingKetSubId === sub.id ? (
                                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3 mt-1 mr-2 shadow-inner">
                                      {/* Budget summary for this Sub */}
                                      {(() => {
                                        const totalKet = sub.keterangan.reduce((s, k) => s + k.alokasi, 0);
                                        const inputVal = parseRupiahInput(newKetAlokasi);
                                        const liveTotalKet = totalKet + inputVal;
                                        const sisaKet = sub.alokasi - liveTotalKet;
                                        const isOverKet = sisaKet < 0;
                                        return (
                                          <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white border border-stone-200 rounded-lg px-3 py-2.5">
                                              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wide mb-0.5">Total SUB · {sub.nama} Teralokasi</p>
                                              <p className="text-[12px] font-bold text-stone-800">{formatShort(liveTotalKet)}</p>
                                            </div>
                                            {isOverKet ? (
                                              <div className="rounded-lg px-3 py-2.5 border" style={{ backgroundColor: '#FDF3F2', borderColor: '#E8B6B8' }}>
                                                <p className="text-[9px] font-bold uppercase tracking-wide mb-0.5" style={{ color: '#902F33' }}>Kelebihan Alokasi (Overbudget)</p>
                                                <p className="text-[12px] font-bold" style={{ color: '#902F33' }}>{formatShort(sisaKet)}</p>
                                              </div>
                                            ) : (
                                              <div className="bg-white border border-stone-200 rounded-lg px-3 py-2.5">
                                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wide mb-0.5">Sisa SUB · {sub.nama} Belum Dialokasikan</p>
                                                <p className="text-[12px] font-bold text-stone-600">{formatShort(sisaKet)}</p>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Keterangan Baru:</label>
                                          {loadingKetOptions[sub.id] ? (
                                            <div className="flex items-center gap-2 text-xs text-stone-500 py-2">
                                              <Loader2 size={12} className="animate-spin" />
                                              Memuat pilihan...
                                            </div>
                                          ) : (
                                            <select
                                              value={newKetName}
                                              onChange={(e) => setNewKetName(e.target.value)}
                                              className="w-full text-xs border border-stone-250 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-stone-850"
                                              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                            >
                                              {(ketOptions[sub.id] || []).length > 0 ? (
                                                <>
                                                  <option value="">Pilih Keterangan</option>
                                                  {(ketOptions[sub.id] || []).map((opt: any) => (
                                                    <option key={opt.id} value={opt.nama}>
                                                      {opt.nama}
                                                    </option>
                                                  ))}
                                                </>
                                              ) : (
                                                <option value="">Tidak ada pilihan keterangan</option>
                                              )}
                                            </select>
                                          )}
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Nominal:</label>
                                          <input type="text" value={newKetAlokasi} onChange={(e) => setNewKetAlokasi(formatInputRupiah(e.target.value))} placeholder="Rp 0" className="w-full text-xs border border-stone-255 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-stone-800" />
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-3 pt-1">
                                        <button onClick={() => handleAddKet(sub.id)} disabled={loadingKetOptions[sub.id] || (ketOptions[sub.id] || []).length === 0} className="px-3.5 py-1.5 bg-[#008f5d] hover:bg-[#00754c] text-white text-[11px] font-bold rounded-lg transition cursor-pointer disabled:opacity-50">Simpan Draft</button>
                                        <button onClick={() => { setAddingKetSubId(null); setNewKetName(""); setNewKetAlokasi(""); }} className="text-[11px] font-bold text-stone-400 hover:text-stone-600 transition cursor-pointer">Batal</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button onClick={() => { setAddingKetSubId(sub.id); loadKetOptions(sub.id, sub.nama); }} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#005D8D] hover:underline cursor-pointer">
                                      <Plus size={11} /> Tambah Keterangan
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Add Sub inline */}
                      <div className="pt-1">
                        {addingSubMainId === main.id ? (
                          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3 mt-1 mr-2 shadow-inner">
                            {/* Budget summary for this Main */}
                            {(() => {
                              const totalSub = main.subPos.reduce((s, sub) => s + sub.alokasi, 0);
                              const inputVal = parseRupiahInput(newSubAlokasi);
                              const liveTotalSub = totalSub + inputVal;
                              const sisaSub = main.alokasi - liveTotalSub;
                              const isOverSub = sisaSub < 0;
                              return (
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-white border border-stone-200 rounded-lg px-3 py-2.5">
                                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wide mb-0.5">Total MAIN · {main.nama} Teralokasi</p>
                                    <p className="text-[12px] font-bold text-stone-800">{formatShort(liveTotalSub)}</p>
                                  </div>
                                  {isOverSub ? (
                                    <div className="rounded-lg px-3 py-2.5 border" style={{ backgroundColor: '#FDF3F2', borderColor: '#E8B6B8' }}>
                                      <p className="text-[9px] font-bold uppercase tracking-wide mb-0.5" style={{ color: '#902F33' }}>Kelebihan Alokasi (Overbudget)</p>
                                      <p className="text-[12px] font-bold" style={{ color: '#902F33' }}>{formatShort(sisaSub)}</p>
                                    </div>
                                  ) : (
                                    <div className="bg-white border border-stone-200 rounded-lg px-3 py-2.5">
                                      <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wide mb-0.5">Sisa MAIN · {main.nama} Belum Dialokasikan</p>
                                      <p className="text-[12px] font-bold text-stone-600">{formatShort(sisaSub)}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Sub Pos Baru:</label>
                                {loadingSubOptions[main.id] ? (
                                  <div className="flex items-center gap-2 text-xs text-stone-500 py-2">
                                    <Loader2 size={12} className="animate-spin" />
                                    Memuat pilihan...
                                  </div>
                                ) : (
                                  <select
                                    value={newSubName}
                                    onChange={(e) => setNewSubName(e.target.value)}
                                    className="w-full text-xs border border-stone-250 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-stone-850"
                                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                  >
                                    {(subOptions[main.id] || []).length > 0 ? (
                                      <>
                                        <option value="">Pilih Sub Pos</option>
                                        {(subOptions[main.id] || []).map((opt: any) => (
                                          <option key={opt.id} value={opt.nama}>
                                            {opt.nama}
                                          </option>
                                        ))}
                                      </>
                                    ) : (
                                      <option value="">Tidak ada pilihan sub pos</option>
                                    )}
                                  </select>
                                )}
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Alokasi Anggaran:</label>
                                <input type="text" value={newSubAlokasi} onChange={(e) => setNewSubAlokasi(formatInputRupiah(e.target.value))} placeholder="Rp 0" className="w-full text-xs border border-stone-250 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-stone-800" />
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 pt-1">
                              <button onClick={() => handleAddSub(main.id)} disabled={loadingSubOptions[main.id] || (subOptions[main.id] || []).length === 0} className="px-3.5 py-1.5 bg-[#008f5d] hover:bg-[#00754c] text-white text-[11px] font-bold rounded-lg transition cursor-pointer shrink-0 disabled:opacity-50">Simpan Draft</button>
                              <button onClick={() => { setAddingSubMainId(null); setNewSubName(""); setNewSubAlokasi(""); }} className="text-[11px] font-bold text-stone-400 hover:text-stone-600 transition cursor-pointer shrink-0">Batal</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => { setAddingSubMainId(main.id); loadSubOptions(main.id, main.nama); }} className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer">
                            <Plus size={11} /> Tambah Sub
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {pendingCount > 0 && (
            <div className="bg-[#e6f4ea] text-emerald-800 border border-emerald-200 rounded-xl px-4 py-3 text-xs font-semibold shrink-0">{pendingCount} pos menunggu diajukan</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-end shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={onClose} disabled={submitting} className="px-5 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-[13px] font-bold rounded-xl transition cursor-pointer">
              Batal
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="px-5 py-2 bg-stone-900 hover:bg-stone-950 text-white text-[13px] font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Ajukan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
