import React, { useState, useEffect, useRef } from "react";
import { X, Loader2, Receipt, ClipboardList, Settings, Eye, Plus, Trash2, Check, Search, ChevronDown, History, ArrowUp, TrendingUp } from "lucide-react";
import { Project, Member } from "./types";
import PencairanTerminModal from "./PencairanTerminModal";
import AddPenambaganTermin from "./AddPenambaganTermin";
import AlokasiPemasukanModal from "./EditAlokasi";
// IMPORT 2 MODAL BARU DI SINI
import RiwayatPemasukanModal from "./RiwayatPemasukanModal";
import EditTerminModal from "./EditTerminModal";

import {
    formatRupiah,
    getStatusStyles,
    formatRibuan,
    calculateTotalTerpakai,
    calculateBudgetProgress,
    formatStatusLabel
} from "./utils";
import CompactNominal from "@/components/compact-nominal";
import GrafikProgressTermin from "@/components/GrafikProgressTermin";

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

    const handleDropdownScroll = (e: React.UIEvent<HTMLDivElement>) => {
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
    activeTab: "ringkasan" | "anggaran" | "tim" | "pemasukan";
    setActiveTab: React.Dispatch<React.SetStateAction<"ringkasan" | "anggaran" | "tim" | "pemasukan">>;
    timeFilter: "4M" | "12M" | "YTD";
    setTimeFilter: React.Dispatch<React.SetStateAction<"4M" | "12M" | "YTD">>;
    activeCashFlow: any[];
    inflowNominal: number;
    outflowNominal: number;
    netCashNominal: number;
    sudahReimburseNominal: number;
    belumReimburseNominal: number;
    sudahReimburseCount?: number;
    belumReimburseCount?: number;
    detailTotalRAB: number;
    detailTotalTerpakai: number;
    detailPercentUsed: number;
    detailBarWidth: number;
    setSelectedPendingIds: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
    setShowPendingPmModal: (v: boolean) => void;
    fetchPendingPengajuan: (id: number) => void;
    setRabTotal: (v: string) => void;
    setPosAnggaranList: (v: any) => void;
    setShowInitBudget: (v: any) => void;
    setShowDetailBudgetModal: (v: boolean) => void;
    teamRows: any[];
    setTeamRows: React.Dispatch<React.SetStateAction<any[]>>;
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
    timeFilter,
    setTimeFilter,
    activeCashFlow,
    inflowNominal,
    outflowNominal,
    netCashNominal,
    sudahReimburseNominal,
    belumReimburseNominal,
    sudahReimburseCount,
    belumReimburseCount,
    detailTotalRAB,
    detailTotalTerpakai,
    detailPercentUsed,
    detailBarWidth,
    setSelectedPendingIds,
    setShowPendingPmModal,
    fetchPendingPengajuan,
    setRabTotal,
    setPosAnggaranList,
    setShowInitBudget,
    setShowDetailBudgetModal,
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

    // Modal states untuk tab pemasukan
    const [isPencairanOpen, setIsPencairanOpen] = useState(false);
    const [isAddTerminOpen, setIsAddTerminOpen] = useState(false);
    const [isAlokasiOpen, setIsAlokasiOpen] = useState(false);
    const [isRiwayatOpen, setIsRiwayatOpen] = useState(false);
    const [isEditTerminOpen, setIsEditTerminOpen] = useState(false);

    const [dataAlokasiModal, setDataAlokasiModal] = useState([]);

    // Reset data alokasi modal setiap kali proyek yang dibuka berubah
    useEffect(() => {
        setDataAlokasiModal([]);
    }, [showProjectDetail?.id]);

    useEffect(() => {
        if (detailedProjectInfo) {
            setInitialTeamRowsStr(JSON.stringify(teamRows));
        }
    }, [detailedProjectInfo]);

    useEffect(() => {
        if (isAlokasiOpen && showProjectDetail?.id) {
            fetch(`/api/proyek/${showProjectDetail.id}/alokasi-pemasukan`)
                .then(res => res.json())
                .then(json => {
                    console.log("Response dari API API Pemasukan:", json); // <-- CEK DI CONSOLE BROWSER
                    if (json.alokasiPemasukan) {
                        setDataAlokasiModal(json.alokasiPemasukan);
                    }
                })
                .catch(err => console.error("Gagal fetch alokasi pemasukan:", err));
        }
    }, [isAlokasiOpen, showProjectDetail?.id]);

    const isDirty = JSON.stringify(teamRows) !== initialTeamRowsStr;

    // Derived data untuk pemasukan
    const terminList: any[] = detailedProjectInfo?.terminPembayaran ?? [];
    const totalPemasukan = parseFloat(detailedProjectInfo?.budget?.totalPemasukan) || 0;
    const pemasukanBelumDialokasikan = parseFloat(detailedProjectInfo?.budget?.pemasukanBelumDialokasikan) || 0;
    const alokasiPemasukan: any[] = detailedProjectInfo?.budget?.alokasiPemasukan ?? [];
    const terminBelumDiterima = terminList.filter((t: any) => t.status === 'BELUM_DITERIMA');

    // Calculate percentages and nominals for allocation
    const nominalPenjualanJasa = alokasiPemasukan.find((a: any) => a.jenisPemasukan)?.nominal ?? 0;
    const nominalPenjualanBarang = alokasiPemasukan.find((a: any) => a.jenisPemasukan)?.nominal ?? 0;
    const sisaBelumDialokasikan = Math.max(0, totalPemasukan - nominalPenjualanJasa - nominalPenjualanBarang);
    const pJasa = totalPemasukan > 0 ? (nominalPenjualanJasa / totalPemasukan) * 100 : 0;
    const pBarang = totalPemasukan > 0 ? (nominalPenjualanBarang / totalPemasukan) * 100 : 0;

    const fetchAlokasiModalData = async () => {
        if (showProjectDetail?.id) {
            try {
                // Tambahkan ?t=timestamp agar browser tidak berani memakai cache lama
                const timestamp = new Date().getTime();
                const res = await fetch(`/api/proyek/${showProjectDetail.id}/alokasi-pemasukan?t=${timestamp}`, {
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
    };


    if (!showProjectDetail || editMode || isDirectEdit) return null;

    const calculatedTotalTerpakai = calculateTotalTerpakai(detailedProjectInfo, detailTotalTerpakai);
    const { percentUsed: calculatedPercentUsed, barWidth: calculatedBarWidth } = calculateBudgetProgress(calculatedTotalTerpakai, detailTotalRAB);

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 opacity-100">
            <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white border-l border-stone-200 shadow-2xl flex flex-col h-full">
                <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded">PRJ-{String(showProjectDetail.id).padStart(3, "0")}</span>
                        <h3 className="font-bold text-[15px] text-stone-900">Detail Proyek</h3>
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition">
                        <X size={16} />
                    </button>
                </div>

                {loadingDetail ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-stone-400">
                        <Loader2 size={24} className="animate-spin" />
                        <span className="text-sm">Memuat detail proyek...</span>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-6 pb-3 flex-shrink-0 text-left">
                            <span className="text-[11px] font-mono text-stone-400">PRJ-{String(showProjectDetail.id).padStart(3, "0")}</span>
                            <h2 className="font-bold text-xl text-stone-900 leading-tight mt-0.5">{detailedProjectInfo?.nama || showProjectDetail.nama}</h2>
                            <p className="text-xs text-stone-500 mt-1">
                                {detailedProjectInfo?.deskripsi || showProjectDetail.deskripsi}
                            </p>
                            <div className="flex gap-4 border-b border-stone-100 mt-5 text-[13px] font-medium text-stone-400">
                                <button type="button" onClick={() => setActiveTab("ringkasan")} className={`pb-2 transition ${activeTab === "ringkasan" ? "border-b-2 border-stone-900 text-stone-900 font-semibold" : "hover:text-stone-700"}`}>Ringkasan</button>
                                <button type="button" onClick={() => setActiveTab("anggaran")} className={`pb-2 transition ${activeTab === "anggaran" ? "border-b-2 border-stone-900 text-stone-900 font-semibold" : "hover:text-stone-700"}`}>Anggaran</button>
                                <button type="button" onClick={() => setActiveTab("tim")} className={`pb-2 transition ${activeTab === "tim" ? "border-b-2 border-stone-900 text-stone-900 font-semibold" : "hover:text-stone-700"}`}>Tim</button>
                                <button type="button" onClick={() => setActiveTab("pemasukan")} className={`pb-2 whitespace-nowrap transition ${activeTab === "pemasukan" ? "border-b-2 border-stone-900 text-stone-900 font-semibold" : "hover:text-stone-700"}`}>Pemasukan</button>
                            </div>
                        </div>

                        <div id="scroll-bridge-container" className="flex-1 flex flex-col overflow-y-auto scroll-smooth min-h-0">
                            {activeTab === "ringkasan" && (
                                <div id="ringkasan-sec" className="px-6 py-4 space-y-5">
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 pt-2 text-left">
                                        <div>
                                            <span className="text-[11px] text-stone-400 block font-medium">Status</span>
                                            {(() => {
                                                const rawStatus = detailedProjectInfo?.status || showProjectDetail.status;
                                                return (
                                                    <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg border mt-1 ${getStatusStyles(rawStatus)}`}>
                                                        {formatStatusLabel(rawStatus)}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-stone-400 block font-medium">Project Manager</span>
                                            <span className="text-[13px] font-bold text-stone-800 block mt-1 truncate">
                                                {detailedProjectInfo?.users?.find((u: any) => u.roleInProyek === 'Project Manager')?.nama || "-"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-stone-400 block font-medium">Tanggal Mulai</span>
                                            <span className="text-[13px] font-bold text-stone-800 block mt-0.5">
                                                {detailedProjectInfo?.tanggalMulai ? new Date(detailedProjectInfo.tanggalMulai).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-stone-400 block font-medium">Tanggal Selesai</span>
                                            <span className="text-[13px] font-bold text-stone-800 block mt-0.5">
                                                {detailedProjectInfo?.tanggalSelesai ? new Date(detailedProjectInfo.tanggalSelesai).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress Anggaran */}
                                    {detailedProjectInfo?.budget ? (
                                        <div className="border border-stone-100 rounded-3xl p-5 bg-white space-y-4 text-left shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                                            <div className="flex justify-between items-center text-[13px] font-extrabold text-stone-900 tracking-wide">
                                                <span>Realisasi Anggaran</span>
                                                <span className="font-mono text-sm font-black">{calculatedPercentUsed}%</span>
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
                                                <span>Nilai Proyek <b className="text-stone-700 font-mono font-bold ml-0.5"><CompactNominal value={detailTotalRAB} compactThreshold={1_000_000} /></b></span>
                                                <span>Realisasi <b className="text-stone-700 font-mono font-bold ml-0.5"><CompactNominal value={calculatedTotalTerpakai} compactThreshold={1_000_000} /></b></span>
                                                <span>Sisa <b className="text-stone-400 font-mono font-bold ml-0.5"><CompactNominal value={Math.max(0, detailTotalRAB - calculatedTotalTerpakai)} compactThreshold={1_000_000} /></b></span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-amber-50 border border-amber-100 text-amber-800 p-4 rounded-xl text-xs flex items-center justify-between text-left">
                                            <span>Nilai Proyek belum diinisialisasi.</span>
                                            <button type="button" onClick={() => { onClose(); setShowInitBudget(showProjectDetail); }} className="px-3 py-1.5 bg-amber-100 text-amber-900 font-bold rounded-lg text-[11px]">Set Nilai Proyek</button>
                                        </div>
                                    )}

                                    {/* Reimbursement */}
                                    <div className="space-y-2 text-left">
                                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Receipt size={14} className="text-stone-400" /> Reimbursement
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 flex flex-col justify-between">
                                                <span className="text-[11px] font-bold text-emerald-700 block">
                                                    Sudah Reimburse ({sudahReimburseCount ?? detailedProjectInfo?.sudahReimburseCount ?? detailedProjectInfo?.reimbursementDisetujuiCount ?? 0})
                                                </span>
                                                <span className="font-mono text-lg font-black text-stone-900 mt-2 block">
                                                    <CompactNominal value={sudahReimburseNominal} compactThreshold={100_000_000} />
                                                </span>
                                            </div>
                                            <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 flex flex-col justify-between">
                                                <span className="text-[11px] font-bold text-amber-700 block">
                                                    Belum Reimburse ({belumReimburseCount ?? detailedProjectInfo?.belumReimburseCount ?? detailedProjectInfo?.reimbursementBelumDisetujuiCount ?? (detailedProjectInfo?.pendingReimbursements?.length ?? 0)})
                                                </span>
                                                <span className="font-mono text-lg font-black text-stone-900 mt-2 block">
                                                    <CompactNominal value={belumReimburseNominal} compactThreshold={100_000_000} />
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Grafik Progress Termin */}
                                    <GrafikProgressTermin
                                        terminData={detailedProjectInfo?.terminPembayaran}
                                        projectName={detailedProjectInfo?.nama || showProjectDetail?.nama}
                                    />
                                </div>
                            )}

                            {activeTab === "anggaran" && (
                                <div id="anggaran-sec" className="px-6 py-4 space-y-5 flex-shrink-0">
                                    <div className="pb-2">
                                        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                                            Rincian Pos Anggaran
                                        </h3>
                                    </div>

                                    <div className="flex flex-col gap-2 pb-2">
                                        <div className="flex gap-2 w-full">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedPendingIds({});
                                                    setShowPendingPmModal(true);
                                                    if (detailedProjectInfo?.id) {
                                                        fetchPendingPengajuan(detailedProjectInfo.id);
                                                    }
                                                }}
                                                className="flex-1 flex items-center justify-between px-3.5 py-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-900 text-[11px] font-semibold rounded-xl shadow-sm hover:shadow transition duration-200 cursor-pointer gap-2"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <ClipboardList size={13.5} className="text-stone-500" />
                                                    <span>Periksa Pengajuan</span>
                                                </div>
                                                <span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-[9px] font-bold bg-[#005836] text-white rounded-full">
                                                    {detailedProjectInfo?.pendingPmCount || 0}
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (detailedProjectInfo?.budget) {
                                                        const rawTotal = parseFloat(detailedProjectInfo.budget.rabTotal) || 0;
                                                        setRabTotal(formatRibuan(String(Math.round(rawTotal))));

                                                        const existingPos = detailedProjectInfo.budget.posAnggaran.map((pos: any) => {
                                                            const rawAlokasi = parseFloat(pos.nominalAlokasi) || 0;
                                                            return {
                                                                deskripsi: pos.namaPos || pos.deskripsi,
                                                                nominalAlokasi: formatRibuan(String(Math.round(rawAlokasi)))
                                                            };
                                                        });
                                                        setPosAnggaranList(existingPos);
                                                    }
                                                    setShowInitBudget(showProjectDetail);
                                                }}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-900 text-[11px] font-semibold rounded-xl shadow-sm hover:shadow transition duration-200 cursor-pointer"
                                            >
                                                <Settings size={13.5} className="text-stone-500" />
                                                <span>Edit Nilai Proyek</span>
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowDetailBudgetModal(true)}
                                            className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-900 text-[11px] font-semibold rounded-xl shadow-sm hover:shadow transition duration-200 cursor-pointer"
                                        >
                                            <Eye size={13.5} className="text-stone-500" />
                                            <span>Lihat Detail Anggaran</span>
                                        </button>
                                    </div>

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
                                                const percentUsed = nominalAlokasi > 0 ? Math.round((terpakaiVal / nominalAlokasi) * 100) : 0;

                                                let barColor = "bg-[#00966c]";
                                                if (percentUsed >= 90) {
                                                    barColor = "bg-[#d65f5f]";
                                                } else if (percentUsed >= 80) {
                                                    barColor = "bg-[#d4a373]";
                                                }

                                                return (
                                                    <div key={pos.id || index} className="space-y-2 text-left">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h4 className="text-[14px] font-bold text-stone-800 leading-tight">
                                                                    {pos.namaPos || pos.deskripsi}
                                                                </h4>
                                                                <span className="text-[10px] font-mono font-bold text-stone-400">
                                                                    POS-{201 + index}
                                                                </span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-[14px] font-black text-stone-900 font-mono">
                                                                    <CompactNominal value={terpakaiVal} compactThreshold={1_000_000} />
                                                                </span>
                                                                <span className="text-[10px] text-stone-400 block font-medium mt-0.5">
                                                                    dari <CompactNominal value={nominalAlokasi} compactThreshold={1_000_000} />
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="w-full h-2 bg-stone-100/80 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
                                                                style={{ width: `${Math.min(percentUsed, 100)}%` }}
                                                            />
                                                        </div>

                                                        <div className="flex justify-between items-center text-[11px] text-stone-400 font-medium pt-0.5">
                                                            <span className="font-semibold" style={{ color: percentUsed >= 90 ? '#d65f5f' : percentUsed >= 80 ? '#d4a373' : '#00966c' }}>
                                                                {percentUsed}% terpakai
                                                            </span>
                                                            <span>
                                                                Sisa <b className="text-stone-700 font-mono font-bold"><CompactNominal value={sisaVal} compactThreshold={1_000_000} /></b>
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
                            )}

                            {activeTab === "tim" && (
                                <div id="tim-sec" className="min-h-full w-full px-6 pb-48 pt-4 text-left flex-shrink-0 space-y-3">
                                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Anggota Tim Proyek</h3>
                                    <div className="space-y-3">
                                        {teamRows.map((row, idx) => (
                                            <div key={row.id} className="grid grid-cols-12 gap-2.5 items-center">
                                                <div className="col-span-5">
                                                    <input
                                                        type="text"
                                                        placeholder={row.isLocked ? "Role Karyawan" : "Cth: DevOps"}
                                                        required
                                                        disabled={row.isLocked}
                                                        value={row.role}
                                                        onChange={(e) => {
                                                            const updated = [...teamRows];
                                                            updated[idx].role = e.target.value;
                                                            setTeamRows(updated);
                                                        }}
                                                        className="w-full border border-stone-200 rounded-xl px-3 py-2 text-[12px] bg-white focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
                                                    />
                                                </div>
                                                <div className={row.isLocked ? "col-span-7" : "col-span-6"}>
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
                                                        placeholder="Pilih nama..."
                                                    />
                                                </div>
                                                {!row.isLocked && (
                                                    <div className="col-span-1 flex justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveTeamRow(row.id)}
                                                            className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                                            title="Hapus Anggota"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                )}
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

                            {/* TAB PEMASUKAN */}
                            {activeTab === "pemasukan" && (
                                <>
                                    <div id="pemasukan-sec" className="px-6 py-4 space-y-6 flex-shrink-0">

                                        <div className="flex flex-col gap-3">
                                            <div className="flex gap-2 w-full">
                                                <button
                                                    onClick={() => setIsPencairanOpen(true)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 px-2 h-[34px] bg-[#00966c] border border-transparent hover:bg-[#007f5a] text-white text-[12px] font-medium rounded-xl shadow-sm transition-all whitespace-nowrap cursor-pointer"
                                                >
                                                    <Plus size={14} className="shrink-0" /> Pencairan Termin
                                                </button>

                                                <button
                                                    onClick={() => setIsAlokasiOpen(true)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 px-2 h-[34px] bg-white border border-[#e2e2e0] hover:bg-stone-50 text-stone-700 text-[12px] font-medium rounded-xl shadow-sm transition-all whitespace-nowrap cursor-pointer"
                                                >
                                                    <Settings size={14} className="text-stone-500 shrink-0" /> Edit Alokasi
                                                </button>

                                                <button
                                                    onClick={() => setIsEditTerminOpen(true)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 px-2 h-[34px] bg-white border border-[#e2e2e0] hover:bg-stone-50 text-stone-700 text-[12px] font-medium rounded-xl shadow-sm transition-all whitespace-nowrap cursor-pointer"
                                                >
                                                    <Settings size={14} className="text-stone-500 shrink-0" /> Edit Termin
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => setIsRiwayatOpen(true)}
                                                className="w-full flex items-center justify-center gap-1.5 px-2 h-[34px] bg-white border border-[#e2e2e0] hover:bg-stone-50 text-stone-700 text-[12px] font-medium rounded-xl shadow-sm transition-all cursor-pointer"
                                            >
                                                <History size={14} className="text-stone-500 shrink-0" /> Riwayat Pemasukan
                                            </button>
                                        </div>

                                        <div className="space-y-3 pt-2 text-left">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="text-[14px] font-extrabold text-stone-900">Termin Pembayaran</h3>
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
                                                            <div key={termin.id} className="flex justify-between items-center bg-[#f8f7f4] px-4 py-3.5 rounded-xl">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[13px] font-bold text-stone-800">{termin.namaTermin}</span>
                                                                    {parseFloat(termin.persentaseProgress) > 0 && (
                                                                        <span className="text-[12px] text-stone-400 font-medium">({parseFloat(termin.persentaseProgress)}%)</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <span className="text-[12px] font-mono font-medium text-stone-500">
                                                                        Rp &nbsp;{parseFloat(termin.nominal).toLocaleString('id-ID')}
                                                                    </span>
                                                                    {isDiterima ? (
                                                                        <span className="px-3.5 py-1 bg-[#def2e6] text-[#21794b] text-[11px] font-bold rounded-full">
                                                                            Diterima
                                                                        </span>
                                                                    ) : (
                                                                        <span className="px-3.5 py-1 bg-[#f4e4cf] text-[#8b5d2e] text-[11px] font-bold rounded-full">
                                                                            Belum Diterima
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3 pt-4 text-left border-t border-stone-100">
                                            <h3 className="text-[14px] font-extrabold text-stone-900">Alokasi Pemasukan</h3>

                                            <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[12px] font-bold text-stone-600">Total Pemasukan Proyek</span>
                                                    <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-700">
                                                        <span className="text-sm font-bold">↑</span>
                                                    </div>
                                                </div>
                                                <p className="text-[20px] font-bold text-stone-900 tracking-tight">
                                                    <span className="text-stone-400 text-[14px] font-normal mr-1.5">Rp</span>
                                                    {
                                                        Number(
                                                            detailedProjectInfo?.budget?.total_pemasukan ??
                                                            detailedProjectInfo?.budget?.totalPemasukan ??
                                                            0
                                                        ).toLocaleString("id-ID")
                                                    }
                                                </p>
                                            </div>

                                            <div className="space-y-2 bg-stone-50/50 border border-stone-200/70 rounded-2xl p-4">

                                                <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium pt-1">
                                                    {/* Progress Bar Dinamis */}
                                                    <div className="space-y-2 bg-stone-50/50 border border-stone-200/70 rounded-2xl p-4">
                                                        <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden flex">
                                                            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${pJasa}%` }} />
                                                            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${pBarang}%` }} />
                                                            <div className="h-full bg-stone-400 flex-1 transition-all duration-300" title="Belum dialokasikan" />
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium pt-1">
                                                            <span className="flex items-center gap-1.5 text-stone-700">
                                                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                                                                Penjualan Jasa <b className="text-stone-900 ml-1">Rp {nominalPenjualanJasa.toLocaleString("id-ID")}</b>
                                                            </span>
                                                            <span className="flex items-center gap-1.5 text-stone-700">
                                                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                                                                Penjualan Barang <b className="text-stone-900 ml-1">Rp {nominalPenjualanBarang.toLocaleString("id-ID")}</b>
                                                            </span>
                                                            <span className="flex items-center gap-1.5 text-stone-700">
                                                                <span className="w-2.5 h-2.5 rounded-full bg-stone-400 inline-block" />
                                                                Belum dialokasikan <b className="text-stone-900 ml-1">
                                                                    Rp {sisaBelumDialokasikan.toLocaleString("id-ID")}
                                                                </b>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-3 pt-1">
    {((detailedProjectInfo?.budget?.alokasiPemasukan) || []).length === 0 ? (
        <div className="text-center py-3 text-xs text-stone-400 italic bg-[#f8f7f4] rounded-xl">
            Belum ada pos pemasukan
        </div>
    ) : (
        (detailedProjectInfo.budget.alokasiPemasukan).map((item: any, idx: number) => {
            const namaPos = item.namaMain || item.nama || "Kategori Lain";
            const nominalAlokasi = parseFloat(item.nominalAlokasi || item.nominal || 0);
            const nominalTerpakai = parseFloat(item.nominalTerpakai || 0);

            // Hitung persentase progress (jika alokasi 0, persentase 0)
            const pct = nominalAlokasi > 0 ? (nominalTerpakai / nominalAlokasi) * 100 : 0;
            const displayPct = Math.min(Math.max(pct, 0), 100);
            
            // Kondisi warna: Merah jika sudah penuh/lebih (>= 100%), Hijau jika belum
            const isFull = pct >= 100;
            const barColor = isFull ? "bg-[#c95d5d]" : "bg-[#00966c]";

            return (
                <div key={item.id || idx} className="bg-[#f8f7f4] px-4 py-3.5 rounded-2xl flex flex-col gap-2">
                    {/* Baris Atas: Nama Pos & Nominal */}
                    <div className="flex justify-between items-center">
                        <span className="text-[13px] font-extrabold text-stone-900 tracking-wide uppercase">
                            {namaPos}
                        </span>
                        <span className="text-[12px] font-mono text-stone-600 font-bold">
                            <span className="text-stone-400 text-[10px] mr-1">Rp</span>
                            {nominalAlokasi.toLocaleString("id-ID")}
                        </span>
                    </div>

                    {/* Baris Bawah: Progress Bar */}
                    <div className="w-full bg-[#f0efe9] h-2.5 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-300 ${barColor}`} 
                            style={{ width: `${displayPct}%` }} 
                        />
                    </div>
                </div>
            );
        })
    )}
</div>
                                        </div>

                                        {/* Rincian Pos (Penjualan Jasa & Penjualan Barang) */}
                                    </div>

                                    {/* Modal-modal Pendukung */}
                                    <PencairanTerminModal
                                        isOpen={isPencairanOpen}
                                        onClose={() => setIsPencairanOpen(false)}
                                        proyekId={showProjectDetail?.id ?? 0}
                                        proyekNama={detailedProjectInfo?.nama ?? showProjectDetail?.nama ?? ''}
                                        termin={terminList}
                                        onSuccess={() => { onTerminChanged?.(); }}
                                    />
                                    <AlokasiPemasukanModal
                                        isOpen={isAlokasiOpen}
                                        onClose={() => setIsAlokasiOpen(false)}
                                        proyekId={showProjectDetail?.id ?? 0}
                                        proyekNama={detailedProjectInfo?.nama ?? showProjectDetail?.nama ?? ''}
                                        totalPemasukan={detailedProjectInfo?.budget?.totalPemasukan ?? 0}
                                        dataPemasukan={dataAlokasiModal}
                                        onRefresh={() => {
                                            fetchAlokasiModalData();
                                            if (onTerminChanged) onTerminChanged();
                                        }}
                                    />
                                    <RiwayatPemasukanModal
                                        isOpen={isRiwayatOpen}
                                        onClose={() => setIsRiwayatOpen(false)}
                                        proyekId={showProjectDetail?.id ?? 0}
                                        proyekNama={detailedProjectInfo?.nama ?? showProjectDetail?.nama ?? ''}
                                        historyData={terminList.filter((t: any) => t.status === 'DITERIMA')}
                                    />
                                    <EditTerminModal
                                        isOpen={isEditTerminOpen}
                                        onClose={() => setIsEditTerminOpen(false)}
                                        proyekId={showProjectDetail?.id ?? 0}
                                        proyekNama={detailedProjectInfo?.nama ?? showProjectDetail?.nama ?? ''}
                                        terminList={terminList}
                                    />
                                </>
                            )}
                        </div>

                        {/* Footer Modal */}
                        <div className="p-4 border-t border-stone-100 bg-white flex gap-3 flex-shrink-0">
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