"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Plus, X, Loader2 } from "lucide-react";
import ConfirmDialog from "@/components/confirm-dialog";
import SuccessDialog from "@/components/success-dialog";
import Toast from "@/components/toast";

type AlokasiSub = {
  id: number;
  nama: string;
  isDraft?: boolean;
  isLocalDraft?: boolean;
};

type AlokasiMain = {
  id: number;
  nama: string;
  subPos: AlokasiSub[];
};

let draftIdCounter = Date.now();
const generateDraftId = () => {
  draftIdCounter += 1;
  return draftIdCounter;
};

const DRAFT_STORAGE_KEY = (pId: number) => `digi_keuangan_setting_pos_drafts_${pId}`;

const saveDraftsToStorage = (pId: number, dataList: AlokasiMain[]) => {
  if (typeof window === "undefined") return;
  const draftSubs: { mainId: number; mainNama?: string; id: number; nama: string }[] = [];

  dataList.forEach((main) => {
    main.subPos.forEach((sub) => {
      if (sub.isLocalDraft || sub.isDraft) {
        draftSubs.push({ mainId: main.id, mainNama: main.nama, id: sub.id, nama: sub.nama });
      }
    });
  });

  if (draftSubs.length > 0) {
    localStorage.setItem(DRAFT_STORAGE_KEY(pId), JSON.stringify({ subs: draftSubs }));
  } else {
    localStorage.removeItem(DRAFT_STORAGE_KEY(pId));
  }
};

const getDraftsFromStorage = (pId: number) => {
  if (typeof window === "undefined") return { subs: [] };
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY(pId));
    if (!raw) return { subs: [] };
    const parsed = JSON.parse(raw);
    return { subs: parsed.subs || [] };
  } catch {
    return { subs: [] };
  }
};

export default function AddPosModal({
  proyekId,
  proyekNama,
  posAnggaran,
  onClose,
  onSuccess,
}: {
  proyekId: number;
  proyekNama: string;
  totalRAB?: number;
  realisasi?: number;
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

  const [expandedMain, setExpandedMain] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const mapped: AlokasiMain[] = posAnggaran.map((main) => ({
      id: main.id,
      nama: main.nama || main.namaMain || "",
      subPos: (main.subAnggaran || []).map((sub: any) => ({
        id: sub.id,
        nama: sub.nama || sub.namaSub || "",
      })),
    }));

    const savedDrafts = getDraftsFromStorage(proyekId);
    const autoExpandMains: Record<number, boolean> = {};

    (savedDrafts.subs || []).forEach((dSub: any) => {
      const main = mapped.find(
        (m) => m.id === dSub.mainId || m.nama.toUpperCase().trim() === dSub.mainNama?.toUpperCase().trim()
      );
      if (main) {
        autoExpandMains[main.id] = true;
        if (!main.subPos.some((s) => s.nama.toUpperCase().trim() === dSub.nama.toUpperCase().trim())) {
          main.subPos.push({
            id: dSub.id || generateDraftId(),
            nama: dSub.nama,
            isLocalDraft: true,
          });
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

  const [masterMainList, setMasterMainList] = useState<any[]>([]);
  const [subOptions, setSubOptions] = useState<Record<number, any[]>>({});
  const [loadingSubOptions, setLoadingSubOptions] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchMasterMain = async () => {
      try {
        const res = await fetch("/api/master?tipe=pemasukan");
        if (res.ok) {
          const raw = await res.json();
          const dataList = Array.isArray(raw) ? raw : (raw.data || []);
          setMasterMainList(dataList);
        }
      } catch (err) {
        console.error("Failed to fetch master pendapatan:", err);
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
        const res = await fetch("/api/master?tipe=pemasukan");
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
          const res = await fetch(`/api/master?mainId=${matchingMain.id}&tipe=pemasukan`);
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

  const handleAddSub = (mainId: number) => {
    if (!newSubName) {
      alert("Harap pilih Sub Pos terlebih dahulu!");
      return;
    }

    const draftSubId = generateDraftId();
    const nextData = data.map((mainItem) => {
      if (mainItem.id === mainId) {
        const updatedSub: AlokasiSub = {
          id: draftSubId,
          nama: newSubName,
          isLocalDraft: true,
        };
        return { ...mainItem, subPos: [...mainItem.subPos, updatedSub] };
      }
      return mainItem;
    });

    setData(nextData);
    saveDraftsToStorage(proyekId, nextData);

    setAddingSubMainId(null);
    setNewSubName("");
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
            tipeAnggaran: "pemasukan",
            aksi: "TAMBAH",
            parentId: subParentRef,
            targetId: ketParentRef,
            nama: sub.nama,
            nominalAlokasi: 0,
          });
        }
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
        setError(result.message || "Gagal menyimpan setting pos");
        setShowSubmitConfirm(false);
        return;
      }
      const msg = `Setting ${pendingSubmitItems.length} pos pendapatan baru berhasil disimpan.`;
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

  let localDraftCount = 0;
  data.forEach((main) => {
    main.subPos.forEach((sub) => {
      if (sub.isLocalDraft) localDraftCount++;
    });
  });

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
      <div className="bg-white rounded-[20px] shadow-[0px_24px_64px_0px_rgba(20,18,14,0.28)] w-full max-w-[720px] max-h-[88vh] flex flex-col overflow-hidden text-left" onClick={(e) => e.stopPropagation()}>

        <div className="px-6 pt-5 pb-4 border-b border-[#e6e1d4] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[17px] font-bold text-[#14130f] leading-[25.5px]">Tambah Pos Pendapatan</h2>
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
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[12.5px] font-semibold text-[#14130f]">
              Daftar Pos Proyek — klik &quot;+ Tambah Sub Pos&quot; untuk menambahkan sub baru
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
                      <span className="text-[12.5px] font-bold text-[#14130f]">
                        {masterMain?.kode ? `(${masterMain.kode}) ${main.nama}` : main.nama}
                      </span>
                    </div>

                    <span className="text-[11px] font-medium text-stone-400">
                      {main.subPos.length} Sub Pos
                    </span>
                  </div>

                  {isMainOpen && (
                    <div className="bg-white pb-2">
                      {main.subPos.map((sub) => {
                        const matchingSub = (masterSubs || []).find(
                          (ms: any) => ms.nama.toUpperCase().trim() === sub.nama.toUpperCase().trim()
                        );
                        const subKode = matchingSub?.kode;

                        return (
                          <div key={sub.id} className="bg-white">
                            <div className="pl-10 pr-4 py-2 flex items-center justify-between transition select-none hover:bg-[#fbfaf6]">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] font-bold text-[#9a948b] uppercase tracking-wide shrink-0">SUB</span>
                                {sub.isLocalDraft ? (
                                  <span className="text-[12.5px] font-medium text-[#2c2a24]">
                                    Sub Baru: <span className="text-[#005836] font-semibold">{subKode ? `(${subKode}) ${sub.nama}` : sub.nama}</span>
                                  </span>
                                ) : (
                                  <span className="text-[12.5px] font-medium text-[#2c2a24]">
                                    {subKode ? `(${subKode}) ${sub.nama}` : sub.nama}
                                  </span>
                                )}
                              </div>

                              <div>
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
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {hasAvailableSub && (
                        <div className="pl-10 pr-4 py-1.5">
                          {addingSubMainId === main.id ? (
                            <div className="space-y-3 my-2 bg-stone-50/70 border border-stone-200 rounded-xl p-3.5">
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <span className="text-[12px] font-medium text-[#14130f] shrink-0 min-w-20">Sub Baru:</span>
                                <div className="flex-1 min-w-0">
                                  {loadingSubOptions[main.id] ? (
                                    <div className="text-[11.5px] text-[#9a948b] py-2">Memuat opsi...</div>
                                  ) : (
                                    <select
                                      value={newSubName}
                                      onChange={(e) => setNewSubName(e.target.value)}
                                      className="w-full text-[12px] border border-[#e6e1d4] rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#005836] text-[#14130f] h-[37px]"
                                    >
                                      <option value="">Pilih Sub Pos pendapatan</option>
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
                              </div>

                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleAddSub(main.id)}
                                  disabled={!newSubName || (!!newSubName && main.subPos.some((s) => s.nama === newSubName))}
                                  className="px-3.5 py-1.5 bg-[#005836] hover:bg-[#004027] text-white text-[11px] font-bold rounded-lg transition cursor-pointer shrink-0 disabled:opacity-50"
                                >
                                  Simpan Draft
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddingSubMainId(null);
                                    setNewSubName("");
                                  }}
                                  className="px-3 py-1.5 text-[11px] font-semibold text-stone-500 hover:text-stone-800 transition cursor-pointer shrink-0"
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setAddingSubMainId(main.id);
                                loadSubOptions(main.id, main.nama);
                              }}
                              className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#005836] hover:underline cursor-pointer pt-1"
                            >
                              <Plus size={12} /> Tambah Sub Pos
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
              Simpan Pos
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showSubmitConfirm}
        title="Simpan Setting Pos"
        description={
          <>
            Apakah Anda yakin ingin menambahkan <span className="font-semibold text-stone-900">{pendingSubmitItems.length} pos</span> baru pada proyek <span className="font-semibold text-stone-900">{proyekNama}</span>?
          </>
        }
        confirmLabel="Simpan Pos"
        isLoading={submitting}
        onCancel={() => setShowSubmitConfirm(false)}
        onConfirm={handleConfirmSubmit}
      />

      <Toast
        open={showSubmitSuccess}
        message={`Setting ${pendingSubmitItems.length} pos pendapatan berhasil disimpan.`}
        onClose={() => {
          setShowSubmitSuccess(false);
          onClose();
        }}
      />

      <SuccessDialog
        open={showEmptyWarning}
        variant="warning"
        title="Belum Ada Pos Baru"
        description="Tambahkan minimal satu Sub Pos baru sebelum menyimpan setting pos."
        closeLabel="Mengerti"
        onClose={() => setShowEmptyWarning(false)}
      />
    </div>
  );
}
