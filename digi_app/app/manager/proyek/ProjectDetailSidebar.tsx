import React from "react";
import { X, Loader2, Receipt, ClipboardList, Settings, Eye, Plus, Trash2, Check } from "lucide-react";
import { Project, Member } from "./types";
import { 
  formatRupiah, 
  formatSummaryRupiah, 
  getStatusStyles, 
  formatRibuan,
  calculateTotalTerpakai,    // <-- Import fungsi dari utils
  calculateBudgetProgress   // <-- Import fungsi dari utils
} from "./utils";

type Props = {
    showProjectDetail: Project | null;
    editMode: boolean;
    isDirectEdit: boolean;
    onClose: () => void;
    loadingDetail: boolean;
    detailedProjectInfo: any;
    activeTab: "ringkasan" | "anggaran" | "tim";
    setActiveTab: React.Dispatch<React.SetStateAction<"ringkasan" | "anggaran" | "tim">>;
    timeFilter: "4M" | "12M" | "YTD";
    setTimeFilter: React.Dispatch<React.SetStateAction<"4M" | "12M" | "YTD">>;
    activeCashFlow: any[];
    inflowNominal: number;
    outflowNominal: number;
    netCashNominal: number;
    sudahReimburseNominal: number;
    belumReimburseNominal: number;
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
}: Props) {
    // 1. Pengecekan guard clause
    if (!showProjectDetail || editMode || isDirectEdit) return null;

    // 2. Langsung panggil fungsinya di sini!
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
                            </div>
                        </div>

                        <div id="scroll-bridge-container" className="flex-1 flex flex-col overflow-y-auto scroll-smooth min-h-0" style={{ scrollbarWidth: 'none' }}>
                            {activeTab === "ringkasan" && (
                                <div id="ringkasan-sec" className="px-6 py-4 space-y-5">
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 pt-2 text-left">
                                        <div>
                                            <span className="text-[11px] text-stone-400 block font-medium">Status</span>
                                            <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg border mt-1 ${getStatusStyles(detailedProjectInfo?.status || showProjectDetail.status)}`}>
                                                {detailedProjectInfo?.status || showProjectDetail.status}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-stone-400 block font-medium">Project Manager</span>
                                            <span className="text-[13px] font-bold text-stone-800 block mt-1 truncate">
                                                {detailedProjectInfo?.users?.find((u: any) => u.roleInProyek === 'Project Manager')?.nama || "Muhammad Zaini"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-stone-400 block font-medium">Tanggal Mulai</span>
                                            <span className="text-[13px] font-bold text-stone-800 block mt-0.5">
                                                {detailedProjectInfo?.tanggalMulai ? new Date(detailedProjectInfo.tanggalMulai).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "12 Januari 2026"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-stone-400 block font-medium">Tanggal Selesai</span>
                                            <span className="text-[13px] font-bold text-stone-800 block mt-0.5">
                                                {detailedProjectInfo?.tanggalSelesai ? new Date(detailedProjectInfo.tanggalSelesai).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "30 September 2026"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress Anggaran */}
                                    {detailedProjectInfo?.budget ? (
                                        <div className="border border-stone-100 rounded-3xl p-5 bg-white space-y-4 text-left shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                                            <div className="flex justify-between items-center text-[13px] font-extrabold text-stone-900 tracking-wide">
                                                <span>Realisasi Anggaran</span>
                                                {/* Ganti detailPercentUsed -> calculatedPercentUsed */}
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
                                                <span>Nilai Proyek <b className="text-stone-700 font-mono font-bold ml-0.5">{formatSummaryRupiah(detailTotalRAB)}</b></span>
                                                {/* Ganti detailTotalTerpakai -> calculatedTotalTerpakai */}
                                                <span>Realisasi <b className="text-stone-700 font-mono font-bold ml-0.5">{formatSummaryRupiah(calculatedTotalTerpakai)}</b></span>
                                                <span>Sisa <b className="text-stone-400 font-mono font-bold ml-0.5">{formatSummaryRupiah(Math.max(0, detailTotalRAB - calculatedTotalTerpakai))}</b></span>
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
                                                <span className="text-[11px] font-bold text-emerald-700 block">Sudah Reimburse</span>
                                                <span className="font-mono text-lg font-black text-stone-900 mt-2 block">
                                                    {formatSummaryRupiah(sudahReimburseNominal)}
                                                </span>
                                            </div>
                                            <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 flex flex-col justify-between">
                                                <span className="text-[11px] font-bold text-amber-700 block">Belum Reimburse</span>
                                                <span className="font-mono text-lg font-black text-stone-900 mt-2 block">
                                                    {formatSummaryRupiah(belumReimburseNominal)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Arus Kas Real-Time */}
                                    <div className="space-y-3 text-left">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Arus Kas Real-Time</h4>
                                            <div className="flex gap-1 bg-[#f5f4f0] p-1 rounded-xl text-[10px] font-bold text-stone-500">
                                                {(["4M", "12M", "YTD"] as const).map((filter) => (
                                                    <button
                                                        key={filter}
                                                        type="button"
                                                        onClick={() => setTimeFilter(filter)}
                                                        className={`px-2 py-1 rounded-lg transition ${timeFilter === filter ? "bg-white text-stone-900 shadow-sm" : "hover:text-stone-800"}`}
                                                    >
                                                        {filter}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)] space-y-4">
                                            <div className="h-28 flex items-end gap-3 px-2 pt-2 border-b border-stone-100">
                                                {activeCashFlow.length === 0 ? (
                                                    <div className="flex-1 flex items-center justify-center text-xs text-stone-400 pb-4">
                                                        Tidak ada data arus kas untuk periode ini
                                                    </div>
                                                ) : (
                                                    (() => {
                                                        const maxVal = Math.max(1, ...activeCashFlow.map((c: any) => Math.max(c.inflow || 0, c.outflow || 0)));
                                                        return activeCashFlow.map((bar: any, idx: number) => {
                                                            const inflowHeight = Math.min(100, Math.round(((bar.inflow || 0) / maxVal) * 100));
                                                            const outflowHeight = Math.min(100, Math.round(((bar.outflow || 0) / maxVal) * 100));

                                                            return (
                                                                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                                                                    <div className="w-full flex justify-center items-end gap-0.5 h-full">
                                                                        <div
                                                                            className="w-2.5 bg-[#2d6a4f] rounded-t-sm transition-all duration-500 ease-out"
                                                                            style={{ height: `${inflowHeight}%` }}
                                                                            title={`Inflow: ${formatRupiah(bar.inflow)}`}
                                                                        />
                                                                        <div
                                                                            className="w-2.5 bg-[#d4a373] rounded-t-sm transition-all duration-500 ease-out"
                                                                            style={{ height: `${outflowHeight}%` }}
                                                                            title={`Outflow: ${formatRupiah(bar.outflow)}`}
                                                                        />
                                                                    </div>
                                                                    <span className="text-[9px] font-medium text-stone-400 mt-1 block">{bar.bulan}</span>
                                                                </div>
                                                            );
                                                        });
                                                    })()
                                                )}
                                            </div>

                                            <div className="flex justify-between items-center pt-1 text-[11px]">
                                                <div className="flex gap-3 text-stone-500 font-medium">
                                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#2d6a4f]" /> Inflow {formatSummaryRupiah(inflowNominal)}</span>
                                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#d4a373]" /> Outflow {formatSummaryRupiah(outflowNominal)}</span>
                                                </div>
                                                <span className={`font-bold ${netCashNominal >= 0 ? "text-[#2d6a4f]" : "text-rose-600"}`}>
                                                    Net cash {netCashNominal >= 0 ? "+" : ""}{formatSummaryRupiah(netCashNominal)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
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
                                                    <span>Pengajuan Pos PM</span>
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

                                                // Alokasi MAIN selalu pakai nominalAlokasi milik MAIN sendiri — Sub/Keterangan
                                                // adalah subdivisi dari alokasi ini, bukan penjumlahan yang menggantikannya.
                                                const nominalAlokasi = parseFloat(pos.nominalAlokasi) || 0;

                                                // KALKULASI DINAMIS REALISASI (TERPAKAI)
                                                const terpakaiVal = hasSub
                                                    ? pos.subAnggaran.reduce((accSub: number, sub: any) => {
                                                        const hasKet = sub.keterangan && sub.keterangan.length > 0;
                                                        const subRealisasi = hasKet
                                                            ? sub.keterangan.reduce((accKet: number, k: any) => {
                                                                const reimbs = (k.reimbursements || []).filter((r: any) =>
                                                                    ['APPROVED', 'APPROVED_BY_PM', 'SUBMITTED', 'PAID', 'DISBURSED'].includes(r.status)
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
                                                                    {formatSummaryRupiah(terpakaiVal)}
                                                                </span>
                                                                <span className="text-[10px] text-stone-400 block font-medium mt-0.5">
                                                                    dari {formatSummaryRupiah(nominalAlokasi)}
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
                                                                Sisa <b className="text-stone-700 font-mono font-bold">{formatSummaryRupiah(sisaVal)}</b>
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
                                <div id="tim-sec" className="min-h-full w-full px-6 pb-20 pt-4 text-left flex-shrink-0 space-y-3">
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
                                                    <select
                                                        required
                                                        value={row.userId}
                                                        onChange={(e) => {
                                                            const updated = [...teamRows];
                                                            updated[idx].userId = e.target.value;
                                                            setTeamRows(updated);
                                                        }}
                                                        className="w-full border border-stone-200 rounded-xl px-3 py-2 text-[12px] bg-white focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
                                                    >
                                                        <option value="" disabled hidden>Pilih nama...</option>
                                                        {members.map((member) => (
                                                            <option key={member.id} value={member.id}>{member.nama}</option>
                                                        ))}
                                                    </select>
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
                                                disabled={submitting}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2d6a4f] text-white text-[12px] font-bold rounded-xl shadow-sm hover:bg-[#1e5038] transition cursor-pointer"
                                            >
                                                {submitting && <Loader2 size={12} className="animate-spin" />}
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