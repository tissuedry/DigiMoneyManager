"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Plus, X, Loader2 } from "lucide-react";

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
  isDraft?: boolean;
  keterangan: AjukanKet[];
};

type AjukanMain = {
  id: number;
  nama: string;
  alokasi: number;
  subPos: AjukanSub[];
};

const DRAFT_STORAGE_KEY = (pId: number) => `digi_ajukan_drafts_${pId}`;

const saveDraftsToStorage = (pId: number, dataList: AjukanMain[]) => {
  if (typeof window === "undefined") return;
  const draftSubs: { mainId: number; id: number; nama: string; alokasi: number }[] = [];
  const draftKets: { subId: number; mainId: number; id: number; nama: string; alokasi: number }[] = [];

  dataList.forEach((main) => {
    main.subPos.forEach((sub) => {
      if (sub.isDraft || sub.status === "MENUNGGU") {
        draftSubs.push({ mainId: main.id, id: sub.id, nama: sub.nama, alokasi: sub.alokasi });
      }
      sub.keterangan.forEach((ket) => {
        if (ket.isDraft) {
          draftKets.push({ subId: sub.id, mainId: main.id, id: ket.id, nama: ket.nama, alokasi: ket.alokasi });
        }
      });
    });
  });

  if (draftSubs.length > 0 || draftKets.length > 0) {
    localStorage.setItem(DRAFT_STORAGE_KEY(pId), JSON.stringify({ subs: draftSubs, kets: draftKets }));
  } else {
    localStorage.removeItem(DRAFT_STORAGE_KEY(pId));
  }
};

const getDraftsFromStorage = (pId: number) => {
  if (typeof window === "undefined") return { subs: [], kets: [] };
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY(pId));
    if (!raw) return { subs: [], kets: [] };
    return JSON.parse(raw);
  } catch {
    return { subs: [], kets: [] };
  }
};

const formatShort = (v: number): string => {
  const abs = Math.abs(v);
  if (abs >= 100_000_000_000_000) {
    const triliun = Math.floor(abs / 1_000_000_000_000);
    return v < 0 ? `-${triliun} T` : `${triliun} T`;
  }
  if (v < 0) {
    return `-Rp ${abs.toLocaleString("id-ID")}`;
  }
  return `Rp ${v.toLocaleString("id-ID")}`;
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
  const [pendingItems, setPendingItems] = useState<any[]>([]);

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

    // Restore unsubmitted local drafts from localStorage
    const savedDrafts = getDraftsFromStorage(proyekId);
    const autoExpandMains: Record<number, boolean> = {};
    const autoExpandSubs: Record<number, boolean> = {};

    (savedDrafts.subs || []).forEach((dSub: any) => {
      const main = mapped.find((m) => m.id === dSub.mainId);
      if (main) {
        autoExpandMains[main.id] = true;
        if (!main.subPos.some((s) => s.nama.toUpperCase().trim() === dSub.nama.toUpperCase().trim())) {
          main.subPos.push({
            id: dSub.id || Date.now(),
            nama: dSub.nama,
            alokasi: dSub.alokasi,
            status: "MENUNGGU",
            isDraft: true,
            keterangan: [],
          });
        }
      }
    });

    (savedDrafts.kets || []).forEach((dKet: any) => {
      for (const main of mapped) {
        const sub = main.subPos.find(
          (s) => s.id === dKet.subId || s.nama.toUpperCase().trim() === dKet.subNama?.toUpperCase().trim()
        );
        if (sub) {
          autoExpandMains[main.id] = true;
          autoExpandSubs[sub.id] = true;
          if (!sub.keterangan.some((k) => k.nama.toUpperCase().trim() === dKet.nama.toUpperCase().trim())) {
            sub.keterangan.push({
              id: dKet.id || Date.now(),
              nama: dKet.nama,
              alokasi: dKet.alokasi,
              isDraft: true,
            });
          }
          break;
        }
      }
    });

    setData(mapped);
    setExpandedMain((prev) => ({ ...prev, ...autoExpandMains }));
    setExpandedSub((prev) => ({ ...prev, ...autoExpandSubs }));
    setLoading(false);
  }, [posAnggaran, proyekId]);

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

  // Fetch pending pengajuan items untuk merge ke tree & cek duplikasi
  useEffect(() => {
    const fetchPendingItems = async () => {
      try {
        const res = await fetch(`/api/proyek/${proyekId}/pengajuan-anggaran?status=PENDING`);
        if (res.ok) {
          const result = await res.json();
          const allItems = (result.pengajuan || []).flatMap((p: any) =>
            (p.items || []).map((item: any) => ({ ...item, pengajuanId: p.id, judul: p.judul }))
          );
          setPendingItems(allItems);

          // Merge pending items from server into data tree
          setData((prevData) => {
            if (prevData.length === 0) return prevData;
            let changed = false;
            const autoExpandMains: Record<number, boolean> = {};
            const autoExpandSubs: Record<number, boolean> = {};

            const updated = prevData.map((main) => {
              let subList = [...main.subPos];

              // 1. Pending SUB_ANGGARAN
              allItems
                .filter((item: any) => item.tipe === "SUB_ANGGARAN" && item.parentId === main.id)
                .forEach((item: any) => {
                  autoExpandMains[main.id] = true;
                  if (!subList.some((s) => s.nama.toUpperCase().trim() === item.nama?.toUpperCase().trim())) {
                    subList.push({
                      id: item.targetId || Date.now(),
                      nama: item.nama,
                      alokasi: Number(item.nominalAlokasi) || 0,
                      status: "MENUNGGU",
                      isDraft: true,
                      keterangan: [],
                    });
                    changed = true;
                  }
                });

              // 2. Pending KETERANGAN
              const finalSubList = subList.map((sub) => {
                let ketList = [...sub.keterangan];
                allItems
                  .filter(
                    (item: any) =>
                      item.tipe === "KETERANGAN" &&
                      (item.parentId === sub.id ||
                        allItems.some(
                          (pSub: any) =>
                            pSub.tipe === "SUB_ANGGARAN" &&
                            pSub.parentId === main.id &&
                            pSub.nama?.toUpperCase().trim() === sub.nama.toUpperCase().trim() &&
                            pSub.targetId === item.parentId
                        ))
                  )
                  .forEach((item: any) => {
                    autoExpandMains[main.id] = true;
                    autoExpandSubs[sub.id] = true;
                    if (!ketList.some((k) => k.nama.toUpperCase().trim() === item.nama?.toUpperCase().trim())) {
                      ketList.push({
                        id: item.id || Date.now(),
                        nama: item.nama,
                        alokasi: Number(item.nominalAlokasi) || 0,
                        isDraft: true,
                      });
                      changed = true;
                    }
                  });
                return { ...sub, keterangan: ketList };
              });

              return { ...main, subPos: finalSubList };
            });

            if (changed) {
              setExpandedMain((prev) => ({ ...prev, ...autoExpandMains }));
              setExpandedSub((prev) => ({ ...prev, ...autoExpandSubs }));
              return updated;
            }
            return prevData;
          });
        }
      } catch (err) {
        console.error("Failed to fetch pending items:", err);
      }
    };
    fetchPendingItems();
  }, [proyekId]);

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

    const nextData = data.map((main) => {
      if (main.id === mainId) {
        const updatedSub = {
          id: Date.now(),
          nama: newSubName,
          alokasi: alokasiVal,
          status: "MENUNGGU" as const,
          isDraft: true,
          keterangan: [],
        };
        setExpandedSub((prevSub) => ({ ...prevSub, [updatedSub.id]: true }));
        return { ...main, subPos: [...main.subPos, updatedSub] };
      }
      return main;
    });

    setData(nextData);
    saveDraftsToStorage(proyekId, nextData);

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

    const nextData = data.map((main) => ({
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
    }));

    setData(nextData);
    saveDraftsToStorage(proyekId, nextData);

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
      localStorage.removeItem(DRAFT_STORAGE_KEY(proyekId));
      onClose();
    } catch {
      setError("Terjadi kesalahan koneksi");
    } finally {
      setSubmitting(false);
    }
  };

  const isSubInPending = (mainId: number, subName: string) =>
    pendingItems.some((item) =>
      item.tipe === "SUB_ANGGARAN" &&
      item.parentId === mainId &&
      item.nama?.toUpperCase().trim() === subName.toUpperCase().trim()
    );

  const isKetInPending = (sub: AjukanSub, mainId: number, ketName: string) => {
    const name = ketName.toUpperCase().trim();
    // Direct: ket under existing sub by parentId
    if (pendingItems.some((item) =>
      item.tipe === "KETERANGAN" &&
      item.parentId === sub.id &&
      item.nama?.toUpperCase().trim() === name
    )) return true;
    // Draft sub: cari SUB_ANGGARAN pending dgn nama+main yg sama,
    // lalu cocokkan parentId = targetId sub draft
    const pendingSub = pendingItems.find((item) =>
      item.tipe === "SUB_ANGGARAN" &&
      item.parentId === mainId &&
      item.nama?.toUpperCase().trim() === sub.nama.toUpperCase().trim()
    );
    if (pendingSub) {
      return pendingItems.some((item) =>
        item.tipe === "KETERANGAN" &&
        item.pengajuanId === pendingSub.pengajuanId &&
        item.parentId === pendingSub.targetId &&
        item.nama?.toUpperCase().trim() === name
      );
    }
    return false;
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
        <div className="bg-white rounded-2xl p-8 shadow-2xl border border-[#e6e1d4]" onClick={(e) => e.stopPropagation()}>
          <Loader2 size={24} className="animate-spin text-[#9a948b] mx-auto" />
          <p className="text-[#9a948b] text-xs mt-3">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[20px] shadow-[0px_24px_64px_0px_rgba(20,18,14,0.28)] w-full max-w-[820px] max-h-[88vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[#e6e1d4] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[17px] font-bold text-[#14130f] leading-[25.5px]">Ajukan Pos</h2>
            <p className="text-[12.5px] text-[#6a6660] leading-[18.75px] mt-0.5">{proyekNama}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[#f3f0e9] rounded-xl transition text-[#14130f] hover:text-black cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-6 mt-4 bg-[#fdf3f2] border border-[#f3d1ce] rounded-xl px-4 py-2.5 text-[12px] font-medium text-[#902f33]">{error}</div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Realisasi Anggaran Card */}
          <div className="bg-white border border-[#e6e1d4] rounded-[16px] p-4 space-y-2.5 shadow-[0px_0px_0px_1px_rgba(20,18,14,0.04),0px_1px_2px_0px_rgba(20,18,14,0.05)]">
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-semibold text-[#14130f]">Realisasi Anggaran</span>
              <span className="font-bold text-[#14130f] font-mono">{progressPct.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-[#f3f0e9] h-2 rounded-full overflow-hidden">
              <div className="h-full bg-[#009162] rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="flex justify-between items-center text-[12px] pt-1">
              <div className="flex items-baseline gap-1">
                <span className="font-medium text-[#000000]">Nilai Proyek</span>
                <span className="text-[10.2px] font-medium text-[#9a948b] font-mono">Rp</span>
                <span title={`Rp ${Math.round(totalRAB || 0).toLocaleString("id-ID")}`} className="font-medium text-[#14130f] font-mono cursor-pointer">{formatShort(totalRAB).replace(/^Rp\s?/, '')}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-medium text-[#000000]">Realisasi</span>
                <span className="text-[10.2px] font-medium text-[#9a948b] font-mono">Rp</span>
                <span title={`Rp ${Math.round(realisasi || 0).toLocaleString("id-ID")}`} className="font-medium text-[#14130f] font-mono cursor-pointer">{formatShort(realisasi).replace(/^Rp\s?/, '')}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-normal text-[#9a948b]">Sisa</span>
                <span className="text-[10.2px] font-bold text-[#9a948b] font-mono">Rp</span>
                <span title={`Rp ${Math.round((totalRAB - realisasi) || 0).toLocaleString("id-ID")}`} className="font-bold text-[#14130f] font-mono cursor-pointer">{formatShort(totalRAB - realisasi).replace(/^Rp\s?/, '')}</span>
              </div>
            </div>
          </div>

          <p className="text-[12.5px] font-semibold text-[#14130f] px-0.5">
            Anggaran Proyek — klik &quot;+ Tambah&quot; untuk mengajukan Sub / Keterangan baru
          </p>

          <div className="border border-[#e6e1d4] rounded-[10px] divide-y divide-[#e6e1d4] overflow-hidden bg-white">
            {data.map((main) => {
              const isMainOpen = expandedMain[main.id] ?? true;
              return (
                <div key={main.id} className="divide-y divide-[#e6e1d4]">
                  {/* Main Pos Header */}
                  <div className="bg-white px-3 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleMain(main.id)} className="p-0.5 hover:bg-[#f3f0e9] rounded transition cursor-pointer shrink-0 text-[#14130f]">
                        {isMainOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      <span className="text-[12.5px] font-bold text-[#14130f]">{main.nama}</span>
                    </div>
                    <span className="text-[11px] font-normal text-[#9a948b] font-mono">{formatShort(main.alokasi)}</span>
                  </div>

                  {isMainOpen && (
                    <div className="bg-white divide-y divide-[#e6e1d4]/60">
                      {main.subPos.map((sub) => {
                        const isSubOpen = expandedSub[sub.id] ?? false;
                        const isNewSub = sub.status === "MENUNGGU";
                        return (
                          <div key={sub.id} className="bg-white">
                            {/* Sub Pos Header */}
                            <div className="px-3 py-2 pl-6 flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button onClick={() => toggleSub(sub.id)} className="p-0.5 hover:bg-[#f3f0e9] rounded transition cursor-pointer shrink-0 text-[#6a6660]">
                                  {isSubOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                </button>
                                <span className="text-[12px] font-semibold text-[#2c2a24]">
                                  {isNewSub ? `Sub Baru: ${sub.nama}` : sub.nama}
                                </span>
                                {(sub.status === "MENUNGGU" || sub.isDraft) && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#e0f1ec] text-[#005836] border border-[#b2dccd] uppercase tracking-wider">
                                    DRAFT
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-normal text-[#9a948b] font-mono">{formatShort(sub.alokasi)}</span>
                            </div>

                            {/* Keterangan List */}
                            {isSubOpen && (
                              <div className="pl-[34px] pr-3 py-1 space-y-1 bg-white">
                                {sub.keterangan.map((ket) => (
                                  <div key={ket.id} className="flex items-center justify-between py-1 text-[11.5px] text-[#6a6660]">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-normal text-[#6a6660]">{ket.nama}</span>
                                      {ket.isDraft && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#e0f1ec] text-[#005836] border border-[#b2dccd] uppercase tracking-wider rounded">DRAFT</span>
                                      )}
                                    </div>
                                    <span className="text-[#9a948b] font-mono text-[10.5px]">{formatShort(ket.alokasi)}</span>
                                  </div>
                                ))}

                                {/* Add Keterangan inline */}
                                <div className="py-1">
                                  {addingKetSubId === sub.id ? (
                                    <div className="bg-[#fbfaf6] border border-[#e6e1d4] rounded-xl p-3.5 space-y-3 my-1.5 mr-1 shadow-inner">
                                      {/* Budget summary for this Sub */}
                                      {(() => {
                                        const totalKet = sub.keterangan.reduce((s, k) => s + k.alokasi, 0);
                                        const inputVal = parseRupiahInput(newKetAlokasi);
                                        const liveTotalKet = totalKet + inputVal;
                                        const sisaKet = sub.alokasi - liveTotalKet;
                                        const isOverKet = sisaKet < 0;
                                        return (
                                          <div className="grid grid-cols-2 gap-2.5">
                                            <div className="bg-white border border-[#e6e1d4] rounded-xl px-3 py-2">
                                              <p className="text-[12.5px] font-semibold text-[#14130f] mb-0.5">Total SUB · {sub.nama} Teralokasi</p>
                                              <p className="text-[13.5px] font-normal text-[#000000] font-mono">{formatShort(liveTotalKet)}</p>
                                            </div>
                                            {isOverKet ? (
                                              <div className="bg-[#fdf3f2] border border-[#f3d1ce] rounded-xl px-3 py-2">
                                                <p className="text-[12.5px] font-semibold text-[#902f33] mb-0.5">Kelebihan Alokasi (Overbudget)</p>
                                                <p className="text-[13.5px] font-normal text-[#902f33] font-mono">{formatShort(sisaKet)}</p>
                                              </div>
                                            ) : (
                                              <div className="bg-white border border-[#e6e1d4] rounded-xl px-3 py-2">
                                                <p className="text-[12.5px] font-semibold text-[#14130f] mb-0.5">Sisa SUB · {sub.nama} Belum Dialokasikan</p>
                                                <p className="text-[13.5px] font-normal text-[#000000] font-mono">{formatShort(sisaKet)}</p>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}
                                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                        <div className="flex-1">
                                          <label className="block text-[10px] font-semibold text-[#6a6660] uppercase mb-1">Keterangan Baru:</label>
                                          {loadingKetOptions[sub.id] ? (
                                            <div className="flex items-center gap-2 text-xs text-[#9a948b] py-1.5">
                                              <Loader2 size={12} className="animate-spin" />
                                              Memuat pilihan...
                                            </div>
                                          ) : (
                                            <select
                                              value={newKetName}
                                              onChange={(e) => setNewKetName(e.target.value)}
                                              className="w-full text-[11.5px] border border-[#e6e1d4] rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#009162] text-[#14130f] h-[37px]"
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
                                        <div className="w-full sm:w-[150px]">
                                          <label className="block text-[10px] font-semibold text-[#6a6660] uppercase mb-1">Nominal:</label>
                                          <input
                                            type="text"
                                            value={newKetAlokasi}
                                            onChange={(e) => setNewKetAlokasi(formatInputRupiah(e.target.value))}
                                            placeholder="Rp 0"
                                            className="w-full text-[11.5px] border border-[#e6e1d4] rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#009162] font-mono text-[#14130f] h-[37px]"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-3 pt-1">
                                        <button
                                          onClick={() => handleAddKet(sub.id)}
                                          disabled={loadingKetOptions[sub.id] || (ketOptions[sub.id] || []).length === 0 || (!!newKetName && (sub.keterangan.some(k => k.nama === newKetName) || isKetInPending(sub, main.id, newKetName)))}
                                          className="px-3.5 py-1.5 bg-[#009162] hover:bg-[#00754c] text-white text-[11px] font-bold rounded-[7px] transition cursor-pointer disabled:opacity-50"
                                        >
                                          Simpan Draft
                                        </button>
                                        <button
                                          onClick={() => { setAddingKetSubId(null); setNewKetName(""); setNewKetAlokasi(""); }}
                                          className="text-[11px] font-semibold text-[#9a948b] hover:text-[#14130f] transition cursor-pointer"
                                        >
                                          Batal
                                        </button>
                                        {newKetName && sub.keterangan.some(k => k.nama === newKetName) && (
                                          <span className="text-[11px] font-semibold text-[#902f33] bg-[#fdf3f2] border border-[#f3d1ce] px-2.5 py-1 rounded-lg ml-auto">⚠ Keterangan sudah pernah ditambahkan atau diajukan</span>
                                        )}
                                        {newKetName && !sub.keterangan.some(k => k.nama === newKetName) && isKetInPending(sub, main.id, newKetName) && (
                                          <span className="text-[11px] font-semibold text-[#902f33] bg-[#fdf3f2] border border-[#f3d1ce] px-2.5 py-1 rounded-lg ml-auto">⚠ Keterangan sudah diajukan dan menunggu persetujuan Direktur</span>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => { setAddingKetSubId(sub.id); loadKetOptions(sub.id, sub.nama); }}
                                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#005d8d] hover:underline cursor-pointer py-1"
                                    >
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
                      <div className="px-3 py-1.5 pl-6 bg-white">
                        {addingSubMainId === main.id ? (
                          <div className="bg-[#fbfaf6] border border-[#e6e1d4] rounded-xl p-3.5 space-y-3 my-1.5 mr-1 shadow-inner">
                            {/* Budget summary for this Main */}
                            {(() => {
                              const totalSub = main.subPos.reduce((s, sub) => s + sub.alokasi, 0);
                              const inputVal = parseRupiahInput(newSubAlokasi);
                              const liveTotalSub = totalSub + inputVal;
                              const sisaSub = main.alokasi - liveTotalSub;
                              const isOverSub = sisaSub < 0;
                              return (
                                <div className="grid grid-cols-2 gap-2.5">
                                  <div className="bg-white border border-[#e6e1d4] rounded-xl px-3 py-2">
                                    <p className="text-[12.5px] font-semibold text-[#14130f] mb-0.5">Total MAIN · {main.nama} Teralokasi</p>
                                    <p className="text-[13.5px] font-normal text-[#000000] font-mono">{formatShort(liveTotalSub)}</p>
                                  </div>
                                  {isOverSub ? (
                                    <div className="bg-[#fdf3f2] border border-[#f3d1ce] rounded-xl px-3 py-2">
                                      <p className="text-[12.5px] font-semibold text-[#902f33] mb-0.5">Kelebihan Alokasi (Overbudget)</p>
                                      <p className="text-[13.5px] font-normal text-[#902f33] font-mono">{formatShort(sisaSub)}</p>
                                    </div>
                                  ) : (
                                    <div className="bg-white border border-[#e6e1d4] rounded-xl px-3 py-2">
                                      <p className="text-[12.5px] font-semibold text-[#14130f] mb-0.5">Sisa MAIN · {main.nama} Belum Dialokasikan</p>
                                      <p className="text-[13.5px] font-normal text-[#000000] font-mono">{formatShort(sisaSub)}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <div className="flex-1">
                                <label className="block text-[10px] font-semibold text-[#6a6660] uppercase mb-1">Sub Pos Baru:</label>
                                {loadingSubOptions[main.id] ? (
                                  <div className="flex items-center gap-2 text-xs text-[#9a948b] py-1.5">
                                    <Loader2 size={12} className="animate-spin" />
                                    Memuat pilihan...
                                  </div>
                                ) : (
                                  <select
                                    value={newSubName}
                                    onChange={(e) => setNewSubName(e.target.value)}
                                    className="w-full text-[11.5px] border border-[#e6e1d4] rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#009162] text-[#14130f] h-[37px]"
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
                              <div className="w-full sm:w-[150px]">
                                <label className="block text-[10px] font-semibold text-[#6a6660] uppercase mb-1">Alokasi Anggaran:</label>
                                <input
                                  type="text"
                                  value={newSubAlokasi}
                                  onChange={(e) => setNewSubAlokasi(formatInputRupiah(e.target.value))}
                                  placeholder="Rp 0"
                                  className="w-full text-[11.5px] border border-[#e6e1d4] rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#009162] font-mono text-[#14130f] h-[37px]"
                                />
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 pt-1">
                              <button
                                onClick={() => handleAddSub(main.id)}
                                disabled={loadingSubOptions[main.id] || (subOptions[main.id] || []).length === 0 || (!!newSubName && (main.subPos.some(s => s.nama === newSubName) || isSubInPending(main.id, newSubName)))}
                                className="px-3.5 py-1.5 bg-[#009162] hover:bg-[#00754c] text-white text-[11px] font-bold rounded-[7px] transition cursor-pointer shrink-0 disabled:opacity-50"
                              >
                                Simpan Draft
                              </button>
                              <button
                                onClick={() => { setAddingSubMainId(null); setNewSubName(""); setNewSubAlokasi(""); }}
                                className="text-[11px] font-semibold text-[#9a948b] hover:text-[#14130f] transition cursor-pointer shrink-0"
                              >
                                Batal
                              </button>
                              {newSubName && main.subPos.some(s => s.nama === newSubName) && (
                                <span className="text-[11px] font-semibold text-[#902f33] bg-[#fdf3f2] border border-[#f3d1ce] px-2.5 py-1 rounded-lg ml-auto">⚠ Sub Pos sudah pernah ditambahkan atau diajukan</span>
                              )}
                              {newSubName && !main.subPos.some(s => s.nama === newSubName) && isSubInPending(main.id, newSubName) && (
                                <span className="text-[11px] font-semibold text-[#902f33] bg-[#fdf3f2] border border-[#f3d1ce] px-2.5 py-1 rounded-lg ml-auto">⚠ Sub Pos sudah diajukan dan menunggu persetujuan Direktur</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setAddingSubMainId(main.id); loadSubOptions(main.id, main.nama); }}
                            className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#005836] hover:underline cursor-pointer py-1"
                          >
                            <Plus size={12} /> Tambah Sub
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#e6e1d4] flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <p className="text-[11px] font-normal text-[#9a948b]">
              <span className="text-[#902f33] font-bold">*</span> setiap pos wajib punya alasan
            </p>
            {pendingCount > 0 && (
              <span className="text-[11px] font-semibold text-[#005836] bg-[#e0f1ec] px-2.5 py-0.5 rounded-full border border-[#b2dccd]">
                {pendingCount} pos draft
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-white hover:bg-[#f3f0e9] border border-[#e6e1d4] text-[#14130f] text-[13px] font-semibold rounded-[12px] transition cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-[#14130f] hover:bg-black text-[#fbfaf6] text-[13px] font-semibold rounded-[12px] transition cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Ajukan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
