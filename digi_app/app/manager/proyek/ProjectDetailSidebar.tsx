import { useState, useEffect, useRef, useCallback, Dispatch, SetStateAction, UIEvent } from "react";
import { X, Loader2, ClipboardList, Settings, Eye, Plus, Trash2, Check } from "lucide-react";
import { Project, Member } from "./types";
import PencairanTerminModal from "./PencairanTerminModal";
import AlokasiPemasukanForm from "./AlokasiPemasukanForm";
import DetailPemasukanModal from "./DetailPemasukanModal";
import EditTerminForm from "./EditTerminForm";

import {
    getStatusStyles,
    calculateTotalTerpakai,
    calculateBudgetProgress,
    formatStatusLabel
} from "@/lib/proyek-utils";
import CompactNominal from "@/components/compact-nominal";
import GrafikProgressTermin from "@/components/GrafikProgressTermin";

function formatTerminDate(dateRaw?: any): string {
    if (!dateRaw) return "-";
    const d = new Date(dateRaw);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function getMemberInitials(name: string) {
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
    "bg-emerald-100 text-emerald-800 border border-emerald-200/50",
    "bg-sky-100 text-sky-800 border border-sky-200/50",
    "bg-rose-100 text-rose-800 border border-rose-200/50",
    "bg-indigo-100 text-indigo-800 border border-indigo-200/50",
    "bg-amber-100 text-amber-800 border border-amber-200/50",
    "bg-teal-100 text-teal-800 border border-teal-200/50",
    "bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200/50",
    "bg-purple-100 text-purple-800 border border-purple-200/50",
];

function SearchableMemberSelect({
    value,
    onChange,
    members,
    placeholder = "Pilih nama...",
}: {
    value: string;
    onChange: (val: string) => void;
    members: Member[];
    placeholder?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [visibleLimit, setVisibleLimit] = useState(10);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const selectedMember = members.find((m) => String(m.id) === String(value));

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const displayValue = isOpen ? search : (selectedMember ? selectedMember.nama : "");

    const filteredMembers = members
        .filter((m) => {
            const q = search.toLowerCase().trim();
            if (!q) return true;
            return (
                m.nama.toLowerCase().includes(q) ||
                m.email.toLowerCase().includes(q) ||
                (m.role && m.role.toLowerCase().includes(q))
            );
        })
        .sort((a, b) => a.nama.localeCompare(b.nama, undefined, { sensitivity: "base" }));

    const visibleMembers = filteredMembers.slice(0, visibleLimit);
    const hasMoreInDropdown = visibleLimit < filteredMembers.length;

    const handleDropdownScroll = (e: UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollTop + clientHeight >= scrollHeight - 15) {
            if (hasMoreInDropdown) {
                setVisibleLimit((prev) => prev + 10);
            }
        }
    };

    return (
        <div ref={dropdownRef} className="relative w-full">
            <div className="relative">
                <input
                    type="text"
                    value={displayValue}
                    placeholder={placeholder}
                    onFocus={() => {
                        setIsOpen(true);
                        setSearch("");
                        setVisibleLimit(10);
                    }}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setVisibleLimit(10);
                        if (!isOpen) setIsOpen(true);
                    }}
                    className="w-full border border-stone-300 focus:border-stone-600 rounded-xl px-3.5 py-2 text-[12.5px] bg-white text-stone-900 font-semibold focus:outline-none transition shadow-sm"
                />
            </div>

            {isOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-stone-200 rounded-2xl shadow-2xl z-50 overflow-hidden p-1.5 animate-in fade-in zoom-in-95 duration-150">
                    <div
                        onScroll={handleDropdownScroll}
                        className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5 scrollbar-thin"
                    >
                        {filteredMembers.length === 0 ? (
                            <div className="py-4 text-center text-[12px] text-stone-400 font-medium italic">
                                Anggota tidak ditemukan
                            </div>
                        ) : (
                            <>
                                {visibleMembers.map((m, idx) => {
                                    const isSelected = String(m.id) === String(value);
                                    return (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => {
                                                onChange(String(m.id));
                                                setIsOpen(false);
                                                setSearch("");
                                            }}
                                            className={`w-full text-left px-2.5 py-1 rounded-lg flex items-center gap-2.5 text-[12.5px] transition cursor-pointer ${isSelected
                                                ? "bg-emerald-50 text-emerald-950 font-bold"
                                                : "hover:bg-stone-50 text-stone-800 font-medium"
                                                }`}
                                        >
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-extrabold shrink-0 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                                                {getMemberInitials(m.nama)}
                                            </div>
                                            <span className="break-words leading-snug flex-1 py-0.5 text-[12px]">{m.nama}</span>
                                        </button>
                                    );
                                })}

                                {hasMoreInDropdown && (
                                    <div className="py-2 text-center text-[10px] font-bold text-stone-400 animate-pulse bg-stone-50/50 rounded-lg mt-1">
                                        Memuat anggota lainnya...
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

type Props = {
    showProjectDetail: Project | null;
    editMode: boolean;
    isDirectEdit: boolean;
    onClose: () => void;
    loadingDetail: boolean;
    detailedProjectInfo: any;
    activeTab: "ringkasan" | "biaya" | "tim" | "pendapatan";
    setActiveTab: Dispatch<SetStateAction<"ringkasan" | "biaya" | "tim" | "pendapatan">>;
    setShowPendingPmModal: (v: boolean) => void;
    setShowAlokasiPengeluaran: (v: any) => void;
    setShowDetailPengeluaran: (v: boolean) => void;
    teamRows: any[];
    setTeamRows: Dispatch<SetStateAction<any[]>>;
    members: Member[];
    handleAddTeamRow: () => void;
    handleRemoveTeamRow: (id: string) => void;
    handleSaveTeamRows: () => void;
    submitting: boolean;
    formError: string;
    success: string;
    setIsDirectEdit: (v: boolean) => void;
    setEditMode: (v: boolean) => void;
    handleReactivateProject: () => void;
    currentStatus: string | undefined;
    onTerminChanged?: () => void;
};


export default function ProjectDetailSidebar({
    showProjectDetail,
    editMode,
    isDirectEdit,
    onClose,
    loadingDetail,
    detailedProjectInfo,
    activeTab,
    setActiveTab,
    setShowPendingPmModal,
    setShowAlokasiPengeluaran,
    setShowDetailPengeluaran,
    teamRows,
    setTeamRows,
    members,
    handleAddTeamRow,
    handleRemoveTeamRow,
    handleSaveTeamRows,
    submitting,
    formError,
    success,
    setIsDirectEdit,
    setEditMode,
    handleReactivateProject,
    currentStatus,
    onTerminChanged,
}: Props) {
    const [initialTeamRowsStr, setInitialTeamRowsStr] = useState<string>("");

    const [isPencairanOpen, setIsPencairanOpen] = useState(false);
    const [isAlokasiPemasukanFormOpen, setIsAlokasiPemasukanFormOpen] = useState(false);
    const [isDetailPemasukanOpen, setisDetailPemasukanOpen] = useState(false);
    const [isEditTerminOpen, setIsEditTerminOpen] = useState(false);

    const [dataAlokasiModal, setDataAlokasiModal] = useState([]);

    useEffect(() => {
        if (detailedProjectInfo) {
            setInitialTeamRowsStr(JSON.stringify(teamRows));
        }
    }, [detailedProjectInfo]);

    const projectId = showProjectDetail?.id;

    const fetchAlokasiModalData = useCallback(async () => {
        if (projectId) {
            try {
                const timestamp = new Date().getTime();
                const res = await fetch(`/api/proyek/${projectId}/alokasi-pemasukan?t=${timestamp}`, {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    }
                });

                const json = await res.json();

                if (json.alokasiPemasukan) {
                    setDataAlokasiModal(json.alokasiPemasukan);
                }
            } catch (err) {
                console.error("Gagal memuat ulang data alokasi:", err);
            }
        }
    }, [projectId]);

    useEffect(() => {
        if (isDetailPemasukanOpen) {
            fetchAlokasiModalData();
        }
    }, [isDetailPemasukanOpen, fetchAlokasiModalData]);

    const isDirty = JSON.stringify(teamRows) !== initialTeamRowsStr;

    const terminList: any[] = detailedProjectInfo?.terminPembayaran ?? [];

    const activeProjectData = detailedProjectInfo || showProjectDetail;

    const hasAlokasiBiaya = Boolean(
        (activeProjectData?.budget?.posAnggaran && activeProjectData.budget.posAnggaran.some((p: any) => (p.tipe ? p.tipe !== "pemasukan" : true) && Number(p.nominalAlokasi || p.alokasi || p.nominal) > 0)) ||
        (activeProjectData?.budget?.mainAnggaran && activeProjectData.budget.mainAnggaran.some((m: any) => m.tipe !== "pemasukan" && Number(m.nominalAlokasi || m.alokasi || m.nominal) > 0))
    );

    const hasAlokasiPendapatan = Boolean(
        (activeProjectData?.alokasiPemasukan && activeProjectData.alokasiPemasukan.some((m: any) => Number(m.nominalAlokasi || m.alokasi || m.nominal) > 0)) ||
        (activeProjectData?.budget?.alokasiPemasukan && activeProjectData.budget.alokasiPemasukan.some((m: any) => Number(m.nominalAlokasi || m.alokasi || m.nominal) > 0)) ||
        (activeProjectData?.budget?.posAnggaran && activeProjectData.budget.posAnggaran.some((m: any) => m.tipe === "pemasukan" && Number(m.nominalAlokasi || m.alokasi || m.nominal) > 0)) ||
        (activeProjectData?.budget?.mainAnggaran && activeProjectData.budget.mainAnggaran.some((m: any) => m.tipe === "pemasukan" && Number(m.nominalAlokasi || m.alokasi || m.nominal) > 0)) ||
        (dataAlokasiModal && dataAlokasiModal.length > 0 && dataAlokasiModal.some((m: any) => Number(m.nominalAlokasi || m.alokasi || m.nominal) > 0)) ||
        (Number(activeProjectData?.budget?.targetPemasukan || activeProjectData?.targetPemasukan || activeProjectData?.budget?.totalPemasukan || activeProjectData?.totalPemasukan) > 0)
    );

    if (!showProjectDetail || editMode || isDirectEdit) return null;

    const detailTotalRAB = parseFloat(detailedProjectInfo?.budget?.nilaiKontrak) || 0;
    const fallbackTerpakai = parseFloat(detailedProjectInfo?.budget?.totalPengeluaran) || 0;
    const calculatedTotalTerpakai = calculateTotalTerpakai(detailedProjectInfo, fallbackTerpakai);
    const { percentUsed: calculatedPercentUsed } = calculateBudgetProgress(calculatedTotalTerpakai, detailTotalRAB);

    const sudahReimburseNominal = detailedProjectInfo?.sudahReimburseNominal !== undefined
        ? Number(detailedProjectInfo.sudahReimburseNominal)
        : (parseFloat(detailedProjectInfo?.budget?.totalReimbursement) || 0);

    const belumReimburseNominal = detailedProjectInfo?.belumReimburseNominal !== undefined
        ? Number(detailedProjectInfo.belumReimburseNominal)
        : (detailedProjectInfo?.pendingReimbursements
            ? detailedProjectInfo.pendingReimbursements.reduce((sum: number, r: any) => sum + Number(r.nominal || 0), 0)
            : 0);

    const sudahReimburseCount = detailedProjectInfo?.sudahReimburseCount ?? detailedProjectInfo?.reimbursementDisetujuiCount ?? 0;
    const belumReimburseCount = detailedProjectInfo?.belumReimburseCount ?? detailedProjectInfo?.reimbursementBelumDisetujuiCount ?? (detailedProjectInfo?.pendingReimbursements?.length ?? 0);

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 opacity-100" onClick={onClose}>
            <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-2xl bg-white border-l border-stone-200 shadow-2xl flex flex-col h-full" onClick={(e) => e.stopPropagation()}>
                {loadingDetail ? (
                    <div className="flex-1 flex flex-col overflow-hidden animate-pulse">
                        <div className="px-8 pt-8 pb-4 flex-shrink-0 text-left space-y-3">
                            <div className="h-3 w-20 bg-stone-200 rounded-md" />
                            <div className="h-8 w-2/3 bg-stone-200 rounded-lg" />
                            <div className="h-4 w-1/2 bg-stone-100 rounded-md" />
                            <div className="flex gap-2 pt-3">
                                <div className="h-7 bg-stone-200 rounded-full w-24" />
                                <div className="h-7 bg-stone-100 rounded-full w-20" />
                                <div className="h-7 bg-stone-100 rounded-full w-16" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden px-8 space-y-4">
                            <div className="bg-stone-100 rounded-2xl p-5 space-y-3">
                                <div className="h-4 w-1/3 bg-stone-200 rounded-md" />
                                <div className="h-12 bg-stone-200 rounded-xl" />
                                <div className="grid grid-cols-3 gap-3">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="h-3 bg-stone-200 rounded w-full" />
                                            <div className="h-3 bg-stone-100 rounded w-2/3" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-2.5">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="h-3 bg-stone-100 rounded w-1/3" />
                                        <div className="h-5 bg-stone-200 rounded-md w-1/4" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-8 pt-8 pb-4 flex-shrink-0 text-left">
                            <div className="flex items-center justify-between">
                                <span className="text-xs  font-semibold text-stone-400">
                                    {(detailedProjectInfo?.nomorRegister || showProjectDetail.nomorRegister)
                                        ? (detailedProjectInfo?.nomorRegister || showProjectDetail.nomorRegister)
                                        : `PRJ-${String(showProjectDetail.id).padStart(3, "0")}`}
                                </span>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="p-2 bg-black hover:bg-stone-900 text-white rounded-xl transition shadow-sm cursor-pointer flex items-center justify-center"
                                    title="Tutup"
                                >
                                    <X size={15} className="stroke-[2.5]" />
                                </button>
                            </div>
                            <h2 className="font-bold text-2xl text-stone-900 leading-tight mt-1">{detailedProjectInfo?.nama || showProjectDetail.nama}</h2>
                            <p className="text-xs text-stone-500 mt-1">
                                {detailedProjectInfo?.deskripsi || showProjectDetail.deskripsi}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-5">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("ringkasan")}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${activeTab === "ringkasan"
                                        ? "border border-stone-300 bg-white text-stone-900 shadow-xs"
                                        : "text-stone-500 hover:text-stone-900 border border-transparent"
                                        }`}
                                >
                                    Ringkasan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("biaya")}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${activeTab === "biaya"
                                        ? "border border-stone-300 bg-white text-stone-900 shadow-xs"
                                        : "text-stone-500 hover:text-stone-900 border border-transparent"
                                        }`}
                                >
                                    Biaya
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("pendapatan")}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${activeTab === "pendapatan"
                                        ? "border border-stone-300 bg-white text-stone-900 shadow-xs"
                                        : "text-stone-500 hover:text-stone-900 border border-transparent"
                                        }`}
                                >
                                    Pendapatan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("tim")}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${activeTab === "tim"
                                        ? "border border-stone-300 bg-white text-stone-900 shadow-xs"
                                        : "text-stone-500 hover:text-stone-900 border border-transparent"
                                        }`}
                                >
                                    Tim
                                </button>
                            </div>
                            <div className="border-b border-stone-100 mt-4" />
                        </div>

                        <div id="scroll-bridge-container" className="flex-1 flex flex-col overflow-y-auto scroll-smooth min-h-0">
                            {activeTab === "ringkasan" && (
                                <div id="ringkasan-sec" className="px-8 py-5 space-y-6">
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 pt-1 text-left">
                                        <div>
                                            <span className="text-xs text-stone-400 block font-medium">Status</span>
                                            {(() => {
                                                const rawStatus = detailedProjectInfo?.status || showProjectDetail.status;
                                                return (
                                                    <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full border mt-1 ${getStatusStyles(rawStatus)}`}>
                                                        {formatStatusLabel(rawStatus)}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                        <div>
                                            <span className="text-xs text-stone-400 block font-medium">Project Manager</span>
                                            <span className="text-[13px] font-bold text-stone-800 block mt-1.5 truncate">
                                                {detailedProjectInfo?.users?.find((u: any) => u.roleInProyek === 'Project Manager')?.nama || "-"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-stone-400 block font-medium">Tanggal Mulai</span>
                                            <span className="text-[13px] font-bold text-stone-800 block mt-0.5">
                                                {detailedProjectInfo?.tanggalMulai ? new Date(detailedProjectInfo.tanggalMulai).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-stone-400 block font-medium">Tanggal Selesai</span>
                                            <span className="text-[13px] font-bold text-stone-800 block mt-0.5">
                                                {detailedProjectInfo?.tanggalSelesai ? new Date(detailedProjectInfo.tanggalSelesai).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                                            </span>
                                        </div>
                                    </div>

                                    {detailedProjectInfo?.budget ? (
                                        <div className="border border-stone-100 rounded-3xl p-5 bg-white space-y-4 text-left shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                                            <div className="flex justify-between items-center text-[13px] font-extrabold text-stone-900 tracking-wide">
                                                <span>Realisasi Biaya</span>
                                                <span className=" text-sm font-black">{calculatedPercentUsed.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
                                            </div>

                                            {(() => {
                                                let macroBarColor = "bg-[#00966c]";
                                                if (calculatedPercentUsed >= 90) {
                                                    macroBarColor = "bg-[#d65f5f]";
                                                } else if (calculatedPercentUsed >= 80) {
                                                    macroBarColor = "bg-[#d4a373]";
                                                }

                                                return (
                                                    <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ease-out ${macroBarColor}`}
                                                            style={{ width: `${calculatedPercentUsed}%` }}
                                                        />
                                                    </div>
                                                );
                                            })()}

                                            <div className="flex justify-between items-center text-[11px] text-stone-400 font-medium">
                                                <span>Nilai Proyek <b className="text-stone-700  font-bold ml-0.5"><CompactNominal value={detailTotalRAB} compactThreshold={1_000_000_000_000} /></b></span>
                                                <span>Realisasi <b className="text-stone-700  font-bold ml-0.5"><CompactNominal value={calculatedTotalTerpakai} compactThreshold={1_000_000_000_000} /></b></span>
                                                <span>Sisa <b className="text-stone-400  font-bold ml-0.5"><CompactNominal value={Math.max(0, detailTotalRAB - calculatedTotalTerpakai)} compactThreshold={1_000_000_000_000} /></b></span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-amber-50 border border-amber-100 text-amber-800 p-4 rounded-xl text-xs flex items-center justify-between text-left">
                                            <span>Nilai Proyek belum diinisialisasi.</span>
                                            <button type="button" onClick={() => { onClose(); setShowAlokasiPengeluaran(showProjectDetail); }} className="px-3 py-1.5 bg-amber-100 text-amber-900 font-bold rounded-lg text-[11px]">Set Nilai Proyek</button>
                                        </div>
                                    )}

                                    <div className="space-y-2.5 text-left">
                                        <h4 className="text-[13px] font-bold text-stone-800">
                                            Pencairan
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3.5">
                                            <div className="bg-[#e8f5f0] border border-[#caead9] rounded-2xl p-4 flex flex-col justify-between">
                                                <span className="text-[12px] font-bold text-[#186f52] block">
                                                    Sudah Dicairkan ({sudahReimburseCount})
                                                </span>
                                                <span className=" text-xl font-black text-stone-900 mt-2 block tracking-tight">
                                                    <CompactNominal value={sudahReimburseNominal} compactThreshold={1_000_000_000_000} />
                                                </span>
                                            </div>
                                            <div className="bg-[#fef4ea] border border-[#f8dec4] rounded-2xl p-4 flex flex-col justify-between">
                                                <span className="text-[12px] font-bold text-[#995514] block">
                                                    Belum Dicairkan ({belumReimburseCount})
                                                </span>
                                                <span className=" text-xl font-black text-stone-900 mt-2 block tracking-tight">
                                                    <CompactNominal value={belumReimburseNominal} compactThreshold={1_000_000_000_000} />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <GrafikProgressTermin
                                        terminData={detailedProjectInfo?.terminPembayaran}
                                        projectName={detailedProjectInfo?.nama || showProjectDetail?.nama}
                                    />
                                </div>
                            )}

                            {activeTab === "biaya" && (
                                <div id="biaya-sec" className="px-8 py-5 space-y-6 flex-shrink-0">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex gap-2 w-full">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowPendingPmModal(true);
                                                }}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-2 h-[34px] bg-white border border-[#e2e2e0] hover:bg-stone-50 text-stone-700 text-[12px] font-medium rounded-xl shadow-sm transition-all whitespace-nowrap cursor-pointer"
                                            >
                                                <ClipboardList size={14} className="text-stone-500 shrink-0" />
                                                <span>Periksa Pengajuan</span>
                                                <span className="flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold bg-[#005836] text-white rounded-full ml-0.5">
                                                    {detailedProjectInfo?.pendingPmCount || 0}
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setShowAlokasiPengeluaran(showProjectDetail)}
                                                className={`flex-1 flex items-center justify-center gap-1.5 px-2 h-[34px] text-[12px] font-medium rounded-xl shadow-sm transition-all whitespace-nowrap cursor-pointer ${!hasAlokasiBiaya
                                                    ? "bg-[#fdf5ea] hover:bg-[#faebd7] text-[#935a16] border border-[#eabd8e]"
                                                    : "bg-white border border-[#e2e2e0] hover:bg-stone-50 text-stone-700"
                                                    }`}
                                            >
                                                <Settings size={14} className={`shrink-0 ${!hasAlokasiBiaya ? "text-[#935a16]" : "text-stone-500"}`} />
                                                <span>Alokasi Biaya</span>
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowDetailPengeluaran(true)}
                                            className="w-full flex items-center justify-center gap-1.5 px-2 h-[34px] bg-white border border-[#e2e2e0] hover:bg-stone-50 text-stone-700 text-[12px] font-medium rounded-xl shadow-sm transition-all cursor-pointer"
                                        >
                                            <Eye size={14} className="text-stone-500 shrink-0" />
                                            <span>Lihat Detail Biaya</span>
                                        </button>
                                    </div>

                                    <div className="space-y-3 pt-4 text-left border-t border-stone-100">

                                        {detailedProjectInfo?.budget?.posAnggaran ? (
                                            <div className="space-y-6">
                                                {detailedProjectInfo.budget.posAnggaran.map((pos: any, index: number) => {
                                                    const hasSub = pos.subAnggaran && pos.subAnggaran.length > 0;

                                                    const nominalAlokasi = parseFloat(pos.nominalAlokasi) || 0;

                                                    const terpakaiVal = hasSub
                                                        ? pos.subAnggaran.reduce((accSub: number, sub: any) => {
                                                            const hasKet = sub.keterangan && sub.keterangan.length > 0;
                                                            const subRealisasi = hasKet
                                                                ? sub.keterangan.reduce((accKet: number, k: any) => {
                                                                    const reimbs = (k.reimbursements || []).filter((r: any) =>
                                                                        ['APPROVED', 'PAID', 'DISBURSED'].includes(r.status)
                                                                    );
                                                                    const sumReimbs = reimbs.reduce((accR: number, r: any) => accR + (parseFloat(r.nominal) || 0), 0);
                                                                    return accKet + (sumReimbs || parseFloat(k.nominalRealisasi) || 0);
                                                                }, 0)
                                                                : parseFloat(sub.nominalTerpakai) || 0;
                                                            return accSub + subRealisasi;
                                                        }, 0)
                                                        : parseFloat(pos.nominalTerpakai) || 0;

                                                    const sisaVal = Math.max(0, nominalAlokasi - terpakaiVal);
                                                    const percentUsedRaw = nominalAlokasi > 0 ? (terpakaiVal / nominalAlokasi) * 100 : 0;
                                                    const percentUsedFormatted = percentUsedRaw.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

                                                    let barColor = "bg-[#00966c]";
                                                    if (percentUsedRaw >= 90) {
                                                        barColor = "bg-[#d65f5f]";
                                                    } else if (percentUsedRaw >= 80) {
                                                        barColor = "bg-[#d4a373]";
                                                    }

                                                    return (
                                                        <div key={pos.id || index} className="space-y-2 text-left">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h4 className="text-[14px] font-bold text-stone-800 leading-tight">
                                                                        {pos.kode ? `(${pos.kode}) ${pos.namaPos || pos.deskripsi}` : (pos.namaPos || pos.deskripsi)}
                                                                    </h4>
                                                                    <span className="text-[10px]  font-bold text-stone-400">
                                                                        {pos.kode ? `KODE: ${pos.kode} · POS-${201 + index}` : `POS-${201 + index}`}
                                                                    </span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="text-[14px] font-black text-stone-900 ">
                                                                        <CompactNominal value={terpakaiVal} compactThreshold={1_000_000_000_000} />
                                                                    </span>
                                                                    <span className="text-[10px] text-stone-400 block font-medium mt-0.5">
                                                                        dari <CompactNominal value={nominalAlokasi} compactThreshold={1_000_000_000_000} />
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="w-full h-2 bg-stone-100/80 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
                                                                    style={{ width: `${Math.min(percentUsedRaw, 100)}%` }}
                                                                />
                                                            </div>

                                                            <div className="flex justify-between items-center text-[11px] text-stone-400 font-medium pt-0.5">
                                                                <span className="font-semibold" style={{ color: percentUsedRaw >= 90 ? '#d65f5f' : percentUsedRaw >= 80 ? '#d4a373' : '#00966c' }}>
                                                                    {percentUsedFormatted}% terpakai
                                                                </span>
                                                                <span>
                                                                    Sisa <b className="text-stone-700  font-bold"><CompactNominal value={sisaVal} compactThreshold={1_000_000_000_000} /></b>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-xs font-medium text-stone-450 bg-stone-50 rounded-2xl border border-stone-100">
                                                Nilai Proyek belum diinisialisasi untuk proyek ini.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === "tim" && (
                                <div id="tim-sec" className="min-h-full w-full px-8 pb-48 pt-4 text-left flex-shrink-0 space-y-3">
                                    <div className="grid grid-cols-12 gap-2.5 px-1">
                                        <div className="col-span-5 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                                            ROLE
                                        </div>
                                        <div className="col-span-6 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                                            ANGGOTA
                                        </div>
                                        <div className="col-span-1" />
                                    </div>

                                    <div className="space-y-3">
                                        {teamRows.map((row, idx) => (
                                            <div key={row.id} className="grid grid-cols-12 gap-2.5 items-center">
                                                <div className="col-span-5">
                                                    <input
                                                        type="text"
                                                        placeholder={row.isLocked ? "Role Karyawan" : "Ketik role karyawan..."}
                                                        required
                                                        disabled={row.isLocked}
                                                        value={row.role}
                                                        onChange={(e) => {
                                                            const updated = [...teamRows];
                                                            updated[idx].role = e.target.value;
                                                            setTeamRows(updated);
                                                        }}
                                                        className={`w-full border border-stone-200 rounded-xl px-3 py-2 text-[12px] bg-white focus:outline-none focus:ring-1 focus:ring-[#2d6a4f] ${row.isLocked ? "bg-[#fcfbf9] text-stone-800 cursor-not-allowed" : ""}`}
                                                    />
                                                </div>
                                                <div className="col-span-6">
                                                    <SearchableMemberSelect
                                                        value={row.userId}
                                                        onChange={(selectedUserId) => {
                                                            const updated = [...teamRows];
                                                            updated[idx].userId = selectedUserId;
                                                            setTeamRows(updated);
                                                        }}
                                                        members={members.filter((member) => {
                                                            if (row.id === "row-pm") return true;
                                                            const pmRow = teamRows.find((r) => r.id === "row-pm");
                                                            const selectedPmUserId = pmRow ? pmRow.userId : "";
                                                            return String(member.id) !== String(selectedPmUserId);
                                                        })}
                                                        placeholder="Cari nama..."
                                                    />
                                                </div>
                                                <div className="col-span-1 flex justify-center">
                                                    {!row.isLocked && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveTeamRow(row.id)}
                                                            className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                                            title="Hapus Anggota"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-4 flex flex-col gap-3 border-t border-stone-100 mt-4">
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={handleAddTeamRow}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 text-[12px] font-bold rounded-xl shadow-sm transition cursor-pointer"
                                            >
                                                <Plus size={13} />
                                                Tambah Anggota
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleSaveTeamRows}
                                                disabled={submitting || !isDirty}
                                                className={`inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold rounded-xl shadow-sm transition cursor-pointer text-white ${submitting || !isDirty
                                                    ? "bg-stone-300 cursor-not-allowed text-stone-500"
                                                    : "bg-[#008f5d] hover:bg-[#00754c]"
                                                    }`}
                                            >
                                                {submitting ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : (
                                                    <Check size={12} />
                                                )}
                                                Simpan Penugasan Tim
                                            </button>
                                        </div>
                                        {formError && (
                                            <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-[11px] font-medium flex items-center gap-2">
                                                <X size={13} />
                                                <span>{formError}</span>
                                            </div>
                                        )}
                                        {success && (
                                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3.5 py-2.5 rounded-xl text-[11px] font-medium flex items-center gap-2">
                                                <Check size={13} />
                                                <span>{success}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === "pendapatan" && (
                                <>
                                    <div id="pemasukan-sec" className="px-8 py-5 space-y-6 flex-shrink-0">

                                        <div className="flex flex-col gap-3">
                                            <div className="flex gap-2 w-full">
                                                <button
                                                    onClick={() => setIsPencairanOpen(true)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 px-2 h-[34px] bg-[#00966c] border border-transparent hover:bg-[#007f5a] text-white text-[12px] font-medium rounded-xl shadow-sm transition-all whitespace-nowrap cursor-pointer"
                                                >
                                                    <Plus size={14} className="shrink-0" /> Pembayaran Termin
                                                </button>

                                                <button
                                                    onClick={() => setIsEditTerminOpen(true)}
                                                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 h-[34px] text-[12px] font-medium rounded-xl shadow-sm transition-all whitespace-nowrap cursor-pointer ${terminList.length === 0
                                                            ? "bg-[#fdf5ea] hover:bg-[#faebd7] text-[#935a16] border border-[#eabd8e]"
                                                            : "bg-white border border-[#e2e2e0] hover:bg-stone-50 text-stone-700"
                                                        }`}
                                                >
                                                    <Settings size={14} className={`shrink-0 ${terminList.length === 0 ? "text-[#935a16]" : "text-stone-500"}`} />
                                                    {terminList.length === 0 ? "Set Termin" : "Edit Termin"}
                                                </button>

                                                <button
                                                    onClick={() => setIsAlokasiPemasukanFormOpen(true)}
                                                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 h-[34px] text-[12px] font-medium rounded-xl shadow-sm transition-all whitespace-nowrap cursor-pointer ${!hasAlokasiPendapatan
                                                        ? "bg-[#fdf5ea] hover:bg-[#faebd7] text-[#935a16] border border-[#eabd8e]"
                                                        : "bg-white border border-[#e2e2e0] hover:bg-stone-50 text-stone-700"
                                                        }`}
                                                >
                                                    <Settings size={14} className={`shrink-0 ${!hasAlokasiPendapatan ? "text-[#935a16]" : "text-stone-500"}`} />
                                                    <span>Alokasi Pendapatan</span>
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => setisDetailPemasukanOpen(true)}
                                                className="w-full flex items-center justify-center gap-1.5 px-2 h-[34px] bg-white border border-[#e2e2e0] hover:bg-stone-50 text-stone-700 text-[12px] font-medium rounded-xl shadow-sm transition-all cursor-pointer"
                                            >
                                                <Eye size={14} className="text-stone-500 shrink-0" /> Lihat Detail Pendapatan
                                            </button>
                                        </div>

                                        <div className="space-y-3 pt-4 text-left border-t border-stone-100">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="text-[14px] font-extrabold text-stone-900">Pembayaran Termin</h3>
                                                <span className="text-[12px] text-stone-400 font-medium">{terminList.length} termin</span>
                                            </div>

                                            {terminList.length === 0 ? (
                                                <div className="text-center py-6 text-xs font-medium text-stone-400 bg-stone-50 rounded-2xl border border-stone-100">
                                                    Belum ada termin yang didaftarkan
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {terminList.map((termin: any) => {
                                                        const isDiterima = termin.status === 'DITERIMA';

                                                        return (
                                                            <div
                                                                key={termin.id}
                                                                className={`flex justify-between items-center px-4 py-3.5 rounded-xl gap-3 transition-colors ${isDiterima
                                                                    ? "bg-[#eaf5ee] border border-[#c3e6cd]"
                                                                    : "bg-[#f8f7f4]"
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                                                                    <span className="text-[13px] font-bold text-stone-800 truncate">
                                                                        {termin.namaTermin === "Termin 0" ? "DP" : termin.namaTermin}
                                                                    </span>
                                                                    {parseFloat(termin.persentaseProgress) > 0 && (
                                                                        <span className="text-[12px] text-stone-400 font-medium shrink-0">
                                                                            ({parseFloat(termin.persentaseProgress)}%)
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {termin.tanggalPencairan ? (
                                                                    <div className="text-[12px] text-stone-500 font-medium text-center shrink-0">
                                                                        {formatTerminDate(termin.tanggalPencairan)}
                                                                    </div>
                                                                ) : isDiterima ? (
                                                                    <div className="text-[12px] text-stone-500 font-medium text-center shrink-0">
                                                                        {formatTerminDate(termin.updatedAt)}
                                                                    </div>
                                                                ) : null}

                                                                <div className="flex items-center gap-4 shrink-0 justify-end">
                                                                    <span className="text-[12px]  font-medium text-stone-500">
                                                                        Rp &nbsp;{parseFloat(termin.nominal).toLocaleString('id-ID')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <PencairanTerminModal
                                        isOpen={isPencairanOpen}
                                        onClose={() => setIsPencairanOpen(false)}
                                        proyekId={showProjectDetail?.id ?? 0}
                                        proyekNama={detailedProjectInfo?.nama ?? showProjectDetail?.nama ?? ''}
                                        termin={terminList}
                                        onSuccess={() => { onTerminChanged?.(); }}
                                    />
                                    <DetailPemasukanModal
                                        isOpen={isDetailPemasukanOpen}
                                        onClose={() => setisDetailPemasukanOpen(false)}
                                        proyekId={showProjectDetail?.id ?? 0}
                                        proyekNama={detailedProjectInfo?.nama ?? showProjectDetail?.nama ?? ''}
                                        proyekStatus={detailedProjectInfo?.status ?? showProjectDetail?.status ?? 'AKTIF'}
                                        totalPemasukan={detailedProjectInfo?.budget?.totalPemasukan ?? 0}
                                        dataPemasukan={dataAlokasiModal}
                                        onRefresh={() => {
                                            fetchAlokasiModalData();
                                            if (onTerminChanged) onTerminChanged();
                                        }}
                                    />
                                    <EditTerminForm
                                        isOpen={isEditTerminOpen}
                                        onClose={() => setIsEditTerminOpen(false)}
                                        proyekId={showProjectDetail?.id ?? 0}
                                        proyekNama={detailedProjectInfo?.nama ?? showProjectDetail?.nama ?? ''}
                                        NilaiKontrak={detailedProjectInfo?.budget?.nilaiKontrak || showProjectDetail?.budget?.nilaiKontrak || detailTotalRAB || 0}
                                        terminList={terminList}
                                        onSuccess={() => {
                                            if (onTerminChanged) onTerminChanged();
                                        }}
                                    />
                                    <AlokasiPemasukanForm
                                        isOpen={isAlokasiPemasukanFormOpen}
                                        onClose={() => setIsAlokasiPemasukanFormOpen(false)}
                                        proyekId={showProjectDetail?.id ?? 0}
                                        proyekNama={detailedProjectInfo?.nama ?? showProjectDetail?.nama ?? ''}
                                        nilaiKontrak={detailedProjectInfo?.budget?.nilaiKontrak || 0}
                                        detailedProjectInfo={detailedProjectInfo}
                                        onSuccess={() => {
                                            fetchAlokasiModalData();
                                            if (onTerminChanged) onTerminChanged();
                                        }}
                                    />
                                </>
                            )}
                        </div>

                        <div className="px-8 py-5 border-t border-stone-100 bg-white flex gap-3 flex-shrink-0">
                            <button type="button"
                                onClick={() => { setIsDirectEdit(false); setEditMode(true); }}
                                className="flex-1 py-2.5 border border-stone-200 hover:bg-stone-50 rounded-xl text-[13px] font-semibold text-stone-700 transition flex items-center justify-center gap-1.5">
                                <Settings size={15} className="stroke-[1.8]" />
                                Edit Proyek
                            </button>
                            {(currentStatus?.toUpperCase() === "CANCELED" || currentStatus?.toUpperCase() === "DONE") && (
                                <button
                                    onClick={handleReactivateProject}
                                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                                >
                                    Aktifkan Kembali
                                </button>
                            )}
                            <button type="button"
                                onClick={() => { onClose(); setActiveTab("ringkasan"); }}
                                className="flex-1 py-2.5 bg-black hover:bg-stone-900 text-white text-[13px] font-bold rounded-xl transition flex items-center justify-center">
                                Tutup
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}