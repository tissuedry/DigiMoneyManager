"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Plus, X, Loader2 } from "lucide-react";
import ConfirmDialog from "@/components/confirm-dialog";
import SuccessDialog from "@/components/success-dialog";
import Toast from "@/components/toast";
import CompactNominal from "@/components/compact-nominal";

type AlokasiKet = {
  id: number;
  nama: string;
  alokasi: number;
  isDraft?: boolean;
  isLocalDraft?: boolean;
};

type AlokasiSub = {
  id: number;
  nama: string;
  alokasi: number;
  isDraft?: boolean;
  isLocalDraft?: boolean;
  keterangan: AlokasiKet[];
};

type AlokasiMain = {
  id: number;
  nama: string;
  tipe?: string;
  alokasi: number;
  subPos: AlokasiSub[];
};

let draftIdCounter = Date.now();
const generateDraftId = () => {
  draftIdCounter += 1;
  return draftIdCounter;
};

const DRAFT_STORAGE_KEY = (pId: number) => `digi_alokasi_drafts_${pId}`;

const saveDraftsToStorage = (pId: number, dataList: AlokasiMain[]) => {
  if (typeof window === "undefined") return;
  const draftSubs: { mainId: number; mainNama?: string; id: number; nama: string; alokasi: number }[] = [];
  const draftKets: { subId: number; mainId: number; subNama?: string; id: number; nama: string; alokasi: number }[] = [];

  dataList.forEach((main) => {
    main.subPos.forEach((sub) => {
      if (sub.isLocalDraft || sub.isDraft) {
        draftSubs.push({ mainId: main.id, mainNama: main.nama, id: sub.id, nama: sub.nama, alokasi: sub.alokasi });
      }
      sub.keterangan.forEach((ket) => {
        if (ket.isLocalDraft || ket.isDraft) {
          draftKets.push({ subId: sub.id, mainId: main.id, subNama: sub.nama, id: ket.id, nama: ket.nama, alokasi: ket.alokasi });
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
    const parsed = JSON.parse(raw);
    return { subs: parsed.subs || [], kets: parsed.kets || [] };
  } catch {
    return { subs: [], kets: [] };
  }
};

function DraftBudgetSummary({ totalLabel, existingTotal, inputTotal, parentAlokasi, sisaLabel }: {
  totalLabel: string;
  existingTotal: number;
  inputTotal: number;
  parentAlokasi: number;
  sisaLabel: string;
}) {
  const liveTotal = existingTotal + inputTotal;
  const sisa = parentAlokasi - liveTotal;
  const isOver = sisa < 0;
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white border border-[#e6e1d4] rounded-xl px-3.5 py-2.5">
        <p className="text-[12px] font-semibold text-[#14130f] mb-0.5">{totalLabel}</p>
        <p className="text-[13.5px] font-normal text-[#000000] "><CompactNominal value={liveTotal} /></p>
      </div>
      {isOver ? (
        <div className="bg-[#fdf3f2] border border-[#f3d1ce] rounded-xl px-3.5 py-2.5">
          <p className="text-[12px] font-semibold text-[#902f33] mb-0.5">Kelebihan Alokasi (Overbudget)</p>
          <p className="text-[13.5px] font-normal text-[#902f33] "><CompactNominal value={sisa} /></p>
        </div>
      ) : (
        <div className="bg-white border border-[#e6e1d4] rounded-xl px-3.5 py-2.5">
          <p className="text-[12px] font-semibold text-[#14130f] mb-0.5">{sisaLabel}</p>
          <p className="text-[13.5px] font-normal text-[#000000] "><CompactNominal value={sisa} /></p>
        </div>
      )}
    </div>
  );
}

export default function AlokasiPosModal({
  proyekId,
  proyekNama,
  totalRAB,
  realisasi,
  posAnggaran,
  onClose,
  onSuccess,
}: {
  proyekId: number;
  proyekNama: string;
  totalRAB: number;
  realisasi: number;
  posAnggaran: any[];
  onClose: () => void;
  onSuccess?: (message?: string) => void;
}) {
  const [data, setData] = useState<AlokasiMain[]>(() => []);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);
  const [pendingSubmitItems, setPendingSubmitItems] = useState<any[]>([]);
  const [showEmptyWarning, setShowEmptyWarning] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [expandedMain, setExpandedMain] = useState<Record<number, boolean>>({});
  const [expandedSub, setExpandedSub] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const filteredMains = (posAnggaran || []).filter(
      (main: any) => !main.tipe || main.tipe.toLowerCase() === "pengeluaran"
    );

    const mapped: AlokasiMain[] = filteredMains.map((main) => ({
      id: main.id,
      nama: main.nama || main.namaMain || "",
      tipe: main.tipe || "pengeluaran",
      alokasi: Number(main.alokasi || main.nominalAlokasi || 0),
      subPos: (main.subAnggaran || [])
        .filter((sub: any) => !sub.tipe || sub.tipe.toLowerCase() === "pengeluaran")
        .map((sub: any) => ({
          id: sub.id,
          nama: sub.nama || sub.namaSub || "",
          alokasi: Number(sub.alokasi || sub.nominalAlokasi || 0),
          keterangan: (sub.keterangan || []).map((ket: any) => ({
            id: ket.id,
            nama: ket.nama || ket.keterangan || "",
            alokasi: Number(ket.alokasi || ket.nominalAlokasi || 0),
          })),
        })),
    }));

    const savedDrafts = getDraftsFromStorage(proyekId);
    const autoExpandMains: Record<number, boolean> = {};

    (savedDrafts.subs || []).forEach((dSub: any) => {
      const main = mapped.find((m) => m.id === dSub.mainId || m.nama.toUpperCase().trim() === dSub.mainNama?.toUpperCase().trim());
      if (main) {
        autoExpandMains[main.id] = true;
        if (!main.subPos.some((s) => s.nama.toUpperCase().trim() === dSub.nama.toUpperCase().trim())) {
          main.subPos.push({
            id: dSub.id || generateDraftId(),
            nama: dSub.nama,
            alokasi: dSub.alokasi,
            isLocalDraft: true,
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
          if (!sub.keterangan.some((k) => k.nama.toUpperCase().trim() === dKet.nama.toUpperCase().trim())) {
            sub.keterangan.push({
              id: dKet.id || generateDraftId(),
              nama: dKet.nama,
              alokasi: dKet.alokasi,
              isLocalDraft: true,
            });
          }
          break;
        }
      }
    });

    setData(mapped);
    setExpandedMain((prev) => ({ ...prev, ...autoExpandMains }));
    setLoading(false);
  }, [posAnggaran, proyekId]);

  useEffect(() => {
    if (data.length > 0 && Object.keys(expandedMain).length === 0) {
      data.forEach((m) => setExpandedMain((p) => ({ ...p, [m.id]: true })));
    }
  }, [data, expandedMain]);

  const [addingSubMainId, setAddingSubMainId] = useState<number | null>(null);
  const [newSubName, setNewSubName] = useState("");
  const [newSubAlokasi, setNewSubAlokasi] = useState("");

  const [addingKetSubId, setAddingKetSubId] = useState<number | null>(null);
  const [newKetName, setNewKetName] = useState("");
  const [newKetAlokasi, setNewKetAlokasi] = useState("");

  const [masterMainList, setMasterMainList] = useState<any[]>([]);
  const [subOptions, setSubOptions] = useState<Record<number, any[]>>({});
  const [loadingSubOptions, setLoadingSubOptions] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchMasterMain = async () => {
      try {
        const res = await fetch("/api/master?tipe=pengeluaran");
        if (res.ok) {
          const raw = await res.json();
          const data = Array.isArray(raw) ? raw : (raw.data || []);
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
      let mainList = Array.isArray(masterMainList) ? masterMainList : [];
      if (mainList.length === 0) {
        const res = await fetch("/api/master?tipe=pengeluaran");
        if (res.ok) {
          const raw = await res.json();
          mainList = Array.isArray(raw) ? raw : (raw.data || []);
          setMasterMainList(mainList);
        }
      }
      const matchingMain = mainList.find(
        (m: any) => m.nama.toUpperCase().trim() === mainNama.toUpperCase().trim()
      );
      if (matchingMain) {
        if (matchingMain.MasterSub) {
          setSubOptions((prev) => ({ ...prev, [mainId]: matchingMain.MasterSub }));
          setNewSubName("");
        } else {
          const res = await fetch(`/api/master?mainId=${matchingMain.id}`);
          if (res.ok) {
            const subs = await res.json();
            setSubOptions((prev) => ({ ...prev, [mainId]: Array.isArray(subs) ? subs : (subs.data || []) }));
            setNewSubName("");
          }
        }
      }
    } catch (err) {
      console.error("Failed to load sub options:", err);
    } finally {
      setLoadingSubOptions((prev) => ({ ...prev, [mainId]: false }));
    }
  };

  const toggleMain = (id: number) => setExpandedMain((p) => ({ ...p, [id]: !p[id] }));
  const toggleSub = (id: number) => setExpandedSub((p) => ({ ...p, [id]: !p[id] }));

  const handleRemoveSubDraft = (mainId: number, subId: number) => {
    const nextData = data.map((main) => {
      if (main.id === mainId) {
        return {
          ...main,
          subPos: main.subPos.filter((s) => s.id !== subId),
        };
      }
      return main;
    });
    setData(nextData);
    saveDraftsToStorage(proyekId, nextData);
  };

  const handleRemoveKetDraft = (subId: number, ketId: number) => {
    const nextData = data.map((main) => ({
      ...main,
      subPos: main.subPos.map((sub) => {
        if (sub.id === subId) {
          return {
            ...sub,
            keterangan: sub.keterangan.filter((k) => k.id !== ketId),
          };
        }
        return sub;
      }),
    }));
    setData(nextData);
    saveDraftsToStorage(proyekId, nextData);
  };

  const handleAddSub = (mainId: number) => {
    if (!newSubName || !newSubAlokasi) {
      setValidationError("Harap isi semua kolom untuk menambah Sub baru!");
      return;
    }
    const alokasiVal = parseRupiahInput(newSubAlokasi);

    const main = data.find((m) => m.id === mainId);
    if (!main) return;
    const currentTotal = main.subPos.reduce((sum, s) => sum + s.alokasi, 0);
    if (currentTotal + alokasiVal > main.alokasi) {
      setValidationError("Total alokasi Sub Pos melebihi batas alokasi Main Pos parent!");
      return;
    }

    const draftSubId = generateDraftId();
    const updatedSub: AlokasiSub = {
      id: draftSubId,
      nama: newSubName,
      alokasi: alokasiVal,
      isLocalDraft: true,
      keterangan: [],
    };
    const nextData = data.map((m) => {
      if (m.id === mainId) {
        return { ...m, subPos: [...m.subPos, updatedSub] };
      }
      return m;
    });

    setData(nextData);
    saveDraftsToStorage(proyekId, nextData);
    setExpandedSub((prevSub) => ({ ...prevSub, [draftSubId]: true }));

    setAddingSubMainId(null);
    setNewSubName("");
    setNewSubAlokasi("");
  };

  const handleAddKet = (subId: number) => {
    if (!newKetName || !newKetAlokasi) {
      setValidationError("Harap isi semua kolom untuk menambah Keterangan baru!");
      return;
    }
    const alokasiVal = parseRupiahInput(newKetAlokasi);

    let parentSub: AlokasiSub | undefined;
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
      setValidationError("Total alokasi Keterangan melebihi batas alokasi Sub Pos parent!");
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
              {
                id: generateDraftId(),
                nama: newKetName,
                alokasi: alokasiVal,
                isLocalDraft: true,
              },
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

  const handleSubmit = () => {
    const items: any[] = [];
    const draftIdMap = new Map<number, number>();
    let draftIdx = 0;

    const draftRef = (draftId: number) => {
      if (!draftIdMap.has(draftId)) {
        draftIdx += 1;
        draftIdMap.set(draftId, -draftIdx);
      }
      return draftIdMap.get(draftId)!;
    };

    data.forEach((main) => {
      main.subPos.forEach((sub) => {
        const subParentRef = main.id;
        const ketParentRef = sub.isLocalDraft ? draftRef(sub.id) : sub.id;

        if (sub.isLocalDraft) {
          items.push({
            tipe: "SUB_ANGGARAN",
            aksi: "TAMBAH",
            parentId: subParentRef,
            targetId: ketParentRef,
            nama: sub.nama,
            nominalAlokasi: sub.alokasi,
          });
        }
        sub.keterangan.forEach((ket) => {
          if (ket.isLocalDraft) {
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
      setShowEmptyWarning(true);
      return;
    }

    setPendingSubmitItems(items);
    setShowSubmitConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/proyek/${proyekId}/alokasi-pos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: pendingSubmitItems }),
      });
      const result = await res.json().catch(() => ({ message: "" }));
      if (!res.ok) {
        setError(result.message || "Gagal menyimpan alokasi pos");
        setShowSubmitConfirm(false);
        return;
      }
      const msg = `Alokasi ${pendingSubmitItems.length} pos anggaran berhasil disimpan.`;
      localStorage.removeItem(DRAFT_STORAGE_KEY(proyekId));
      setShowSubmitConfirm(false);
      if (onSuccess) onSuccess(msg);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan koneksi");
      setShowSubmitConfirm(false);
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

  let localDraftCount = 0;
  data.forEach((main) => {
    main.subPos.forEach((sub) => {
      if (sub.isLocalDraft) localDraftCount++;
      sub.keterangan.forEach((ket) => {
        if (ket.isLocalDraft) localDraftCount++;
      });
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

        <div className="px-6 pt-5 pb-4 border-b border-[#e6e1d4] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[17px] font-bold text-[#14130f] leading-[25.5px]">Alokasi Pos</h2>
            <p className="text-[12.5px] text-[#6a6660] leading-[18.75px] mt-0.5">{proyekNama}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[#f3f0e9] rounded-xl transition text-[#14130f] hover:text-black cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-[#fdf3f2] border border-[#f3d1ce] rounded-xl px-4 py-2.5 text-[12px] font-medium text-[#902f33]">{error}</div>
        )}

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          <div className="bg-white border border-[#e6e1d4] rounded-[16px] p-4 space-y-2.5 shadow-[0px_0px_0px_1px_rgba(20,18,14,0.04),0px_1px_2px_0px_rgba(20,18,14,0.05)]">
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-semibold text-[#14130f]">Realisasi Anggaran</span>
              <span className="font-bold text-[#14130f] ">{progressPct.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-[#f3f0e9] h-2 rounded-full overflow-hidden">
              <div className="h-full bg-[#009162] rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="flex justify-between items-center text-[12px] pt-1">
              <div className="flex items-baseline gap-1">
                <span className="font-medium text-[#000000]">Nilai Proyek</span>
                <CompactNominal value={totalRAB} compactThreshold={1_000_000_000_000} className="font-medium text-[#14130f] " />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-medium text-[#000000]">Realisasi</span>
                <CompactNominal value={realisasi} compactThreshold={1_000_000_000_000} className="font-medium text-[#14130f] " />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-normal text-[#9a948b]">Sisa</span>
                <CompactNominal value={totalRAB - realisasi} compactThreshold={1_000_000_000_000} className="font-bold text-[#14130f] " />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-0.5">
            <p className="text-[12.5px] font-semibold text-[#14130f]">
              Anggaran Proyek — klik &quot;+ Tambah&quot; untuk menambah Sub / Keterangan baru
            </p>
          </div>

          <div className="border border-[#e6e1d4] rounded-[12px] divide-y divide-[#e6e1d4] overflow-hidden bg-white">
            {data.map((main) => {
              const isMainOpen = expandedMain[main.id] ?? true;
              const masterMain = Array.isArray(masterMainList)
                ? masterMainList.find(
                  (m: any) => m.nama.toUpperCase().trim() === main.nama.toUpperCase().trim()
                )
                : undefined;
              const masterSubs = subOptions[main.id] || masterMain?.MasterSub;
              const hasAvailableSub = masterSubs
                ? masterSubs.some((ms: any) => !main.subPos.some((s) => s.nama.toUpperCase().trim() === ms.nama.toUpperCase().trim()))
                : true;

              return (
                <div key={main.id} className="bg-white">
                  <div
                    onClick={() => toggleMain(main.id)}
                    className="bg-white px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-[#fbfaf6] transition select-none"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="p-0.5 rounded transition shrink-0 text-[#14130f]">
                        {isMainOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </div>
                      <span className="text-[11px] font-bold text-[#9a948b] uppercase tracking-wide shrink-0">MAIN</span>
                      <span className="text-[12.5px] font-bold text-[#14130f]">{main.nama}</span>
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                      <span className="text-[11.5px] font-normal text-[#9a948b]  text-right min-w-[90px]"><CompactNominal value={main.alokasi} /></span>
                    </div>
                  </div>

                  {isMainOpen && (
                    <div className="bg-white pb-1.5">
                      {main.subPos.map((sub) => {
                        const isSubOpen = expandedSub[sub.id] ?? false;

                        return (
                          <div key={sub.id} className="bg-white">
                            <div
                              onClick={() => toggleSub(sub.id)}
                              className="pl-10 pr-4 py-1.5 flex items-center justify-between transition select-none cursor-pointer hover:bg-[#fbfaf6]"
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="p-0.5 rounded transition shrink-0 text-[#6a6660]">
                                  {isSubOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                </div>
                                <span className="text-[11px] font-bold text-[#9a948b] uppercase tracking-wide shrink-0">SUB</span>
                                {sub.isLocalDraft ? (
                                  <span className="text-[12.5px] font-medium text-[#2c2a24]">
                                    Sub Baru: <span className="text-[#005836] font-semibold">{sub.nama}</span>
                                  </span>
                                ) : (
                                  <span className="text-[12.5px] font-medium text-[#2c2a24]">{sub.nama}</span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 ml-auto">
                                {sub.isLocalDraft && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveSubDraft(main.id, sub.id);
                                    }}
                                    className="group/btn text-[9px] font-bold px-2 py-0.5 rounded bg-[#e0f1ec] text-[#005836] border border-[#b2dccd] hover:bg-[#fdf3f2] hover:text-[#902f33] hover:border-[#f3d1ce] tracking-wider cursor-pointer transition-all duration-150"
                                    title="Klik untuk membatalkan draft"
                                  >
                                    <span className="group-hover/btn:hidden">DRAFT</span>
                                    <span className="hidden group-hover/btn:inline">Batal</span>
                                  </button>
                                )}

                                <span className="text-[11.5px] font-normal text-[#9a948b]  text-right min-w-[90px]"><CompactNominal value={sub.alokasi} /></span>
                              </div>
                            </div>

                            {isSubOpen && (
                              <div className="bg-white">
                                {sub.keterangan.length > 0 && (
                                  <div className="pl-16 pr-4 py-1 space-y-1 bg-white">
                                    {sub.keterangan.map((ket, idxKet) => (
                                      <div key={ket.id} className="flex items-center justify-between py-1 text-[12px] text-[#6a6660]">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="w-3.5 text-center text-[10.5px] font-bold text-[#9a948b] shrink-0  select-none">
                                            {idxKet + 1}
                                          </span>
                                          <span className="text-[11px] font-bold text-[#9a948b] uppercase tracking-wide shrink-0">KET</span>
                                          {ket.isLocalDraft ? (
                                            <span className="text-[12.5px] font-normal text-[#6a6660]">
                                              Ket Baru: <span className="text-[#005d8d] font-semibold">{ket.nama}</span>
                                            </span>
                                          ) : (
                                            <span className="text-[12.5px] font-normal text-[#6a6660]">{ket.nama}</span>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-3 ml-auto">
                                          {ket.isLocalDraft && (
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveKetDraft(sub.id, ket.id)}
                                              className="group/btn text-[9px] font-bold px-2 py-0.5 rounded bg-[#e0f2fe] text-[#005d8d] border border-[#bae6fd] hover:bg-[#fdf3f2] hover:text-[#902f33] hover:border-[#f3d1ce] tracking-wider cursor-pointer transition-all duration-150"
                                              title="Klik untuk membatalkan draft"
                                            >
                                              <span className="group-hover/btn:hidden">DRAFT</span>
                                              <span className="hidden group-hover/btn:inline">Batal</span>
                                            </button>
                                          )}

                                           <span className="text-[#9a948b]  text-[11px] text-right min-w-[90px]"><CompactNominal value={ket.alokasi} /></span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div className="pl-16 pr-4 py-1">
                                  {addingKetSubId === sub.id ? (
                                    <div className="space-y-3 my-2 bg-white">
                                      <DraftBudgetSummary
                                        totalLabel={`Total SUB · ${sub.nama} Teralokasi`}
                                        existingTotal={sub.keterangan.reduce((s, k) => s + k.alokasi, 0)}
                                        inputTotal={parseRupiahInput(newKetAlokasi)}
                                        parentAlokasi={sub.alokasi}
                                        sisaLabel="Sisa Sub Belum Dialokasikan"
                                      />

                                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                        <span className="text-[12px] font-medium text-[#14130f] shrink-0 min-w-24">Keterangan Baru:</span>
                                        <div className="flex-1 min-w-0">
                                          <input
                                            type="text"
                                            value={newKetName}
                                            onChange={(e) => setNewKetName(e.target.value)}
                                            placeholder="Ketik Nama Keterangan..."
                                            className="w-full text-[11.5px] border border-[#e6e1d4] rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#005d8d] text-[#14130f] h-[37px]"
                                          />
                                        </div>
                                        <div className="w-full sm:w-60 shrink-0">
                                          <input
                                            type="text"
                                            value={newKetAlokasi}
                                            onChange={(e) => setNewKetAlokasi(formatInputRupiah(e.target.value))}
                                            placeholder="Alokasi"
                                            className="w-full text-[11.5px] border border-[#e6e1d4] rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#005d8d]  text-[#14130f] h-[37px]"
                                          />
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-3 pt-1">
                                        <button
                                          onClick={() => handleAddKet(sub.id)}
                                          disabled={!newKetName.trim() || sub.keterangan.some((k) => k.nama.toUpperCase().trim() === newKetName.toUpperCase().trim())}
                                          className="px-3.5 py-1.5 bg-[#005d8d] hover:bg-[#00476e] text-white text-[11px] font-bold rounded-[7px] transition cursor-pointer shrink-0 disabled:opacity-50"
                                        >
                                          Simpan Draft
                                        </button>
                                        <button
                                          onClick={() => {
                                            setAddingKetSubId(null);
                                            setNewKetName("");
                                            setNewKetAlokasi("");
                                          }}
                                          className="text-[11px] font-semibold text-[#9a948b] hover:text-[#14130f] transition cursor-pointer shrink-0"
                                        >
                                          Batal
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setAddingKetSubId(sub.id);
                                        setNewKetName("");
                                        setNewKetAlokasi("");
                                      }}
                                      className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#005d8d] hover:underline cursor-pointer"
                                    >
                                      <Plus size={12} /> Tambah Keterangan
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {hasAvailableSub && (
                        <div className="pl-10 pr-4 py-1">
                          {addingSubMainId === main.id ? (
                            <div className="space-y-3 my-2 bg-white">
                              <DraftBudgetSummary
                                totalLabel={`Total MAIN · ${main.nama} Teralokasi`}
                                existingTotal={main.subPos.reduce((s, sub) => s + sub.alokasi, 0)}
                                inputTotal={parseRupiahInput(newSubAlokasi)}
                                parentAlokasi={main.alokasi}
                                sisaLabel="Sisa Main Belum Dialokasikan"
                              />

                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <span className="text-[12px] font-medium text-[#14130f] shrink-0 min-w-24">Sub Baru:</span>
                                <div className="flex-1 min-w-0">
                                  {loadingSubOptions[main.id] ? (
                                    <div className="text-[11.5px] text-[#9a948b] py-2">Memuat opsi...</div>
                                  ) : (
                                    <select
                                      value={newSubName}
                                      onChange={(e) => setNewSubName(e.target.value)}
                                      className="w-full text-[11.5px] border border-[#e6e1d4] rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#005836] text-[#14130f] h-[37px]"
                                    >
                                      <option value="">Pilih Sub</option>
                                      {(subOptions[main.id] || masterMain?.MasterSub || [])
                                        .filter((ms: any) => !main.subPos.some((s) => s.nama.toUpperCase().trim() === ms.nama.toUpperCase().trim()))
                                        .map((ms: any) => (
                                          <option key={ms.id} value={ms.nama}>
                                            {ms.kode ? `(${ms.kode}) ${ms.nama}` : ms.nama}
                                          </option>
                                        ))}
                                    </select>
                                  )}
                                </div>
                                <div className="w-full sm:w-60 shrink-0">
                                  <input
                                    type="text"
                                    value={newSubAlokasi}
                                    onChange={(e) => setNewSubAlokasi(formatInputRupiah(e.target.value))}
                                    placeholder="Alokasi"
                                    className="w-full text-[11.5px] border border-[#e6e1d4] rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#005836]  text-[#14130f] h-[37px]"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-3 pt-1">
                                <button
                                  onClick={() => handleAddSub(main.id)}
                                  disabled={!newSubName || (!!newSubName && main.subPos.some((s) => s.nama === newSubName))}
                                  className="px-3.5 py-1.5 bg-[#005836] hover:bg-[#004027] text-white text-[11px] font-bold rounded-[7px] transition cursor-pointer shrink-0 disabled:opacity-50"
                                >
                                  Simpan Draft
                                </button>
                                <button
                                  onClick={() => {
                                    setAddingSubMainId(null);
                                    setNewSubName("");
                                    setNewSubAlokasi("");
                                  }}
                                  className="text-[11px] font-semibold text-[#9a948b] hover:text-[#14130f] transition cursor-pointer shrink-0"
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setAddingSubMainId(main.id);
                                loadSubOptions(main.id, main.nama);
                              }}
                              className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#005836] hover:underline cursor-pointer"
                            >
                              <Plus size={12} /> Tambah Sub
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-[#e6e1d4] flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            {localDraftCount > 0 && (
              <span className="text-[11px] font-semibold text-[#005836] bg-[#e0f1ec] px-2.5 py-0.5 rounded-full border border-[#b2dccd]">
                {localDraftCount} pos draft
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
              Simpan Alokasi
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showSubmitConfirm}
        title="Simpan Alokasi Pos"
        description={
          <>
            Apakah Anda yakin ingin mengalokasikan <span className="font-semibold text-stone-900">{pendingSubmitItems.length} pos</span> baru untuk proyek <span className="font-semibold text-stone-900">{proyekNama}</span>? Alokasi ini akan langsung disimpan.
          </>
        }
        confirmLabel="Simpan Alokasi"
        isLoading={submitting}
        onCancel={() => setShowSubmitConfirm(false)}
        onConfirm={handleConfirmSubmit}
      />

      <Toast
        open={showSubmitSuccess}
        message={`Alokasi ${pendingSubmitItems.length} pos anggaran berhasil disimpan.`}
        onClose={() => {
          setShowSubmitSuccess(false);
          onClose();
        }}
      />

      <Toast
        open={!!validationError}
        variant="error"
        message={validationError || ""}
        onClose={() => setValidationError(null)}
      />

      <SuccessDialog
        open={showEmptyWarning}
        variant="warning"
        title="Belum Ada Pos Baru"
        description="Tambahkan minimal satu Sub Pos atau Keterangan baru sebelum menyimpan alokasi."
        closeLabel="Mengerti"
        onClose={() => setShowEmptyWarning(false)}
      />
    </div>
  );
}
