import { useState } from "react";
import { X } from "lucide-react";
import CompactNominal from "./compact-nominal";

export type TerminItem = {
    id?: number;
    namaTermin: string;
    persentaseProgress: number | string;
    nominal?: number | string;
    status?: string;
};

type Props = {
    terminData?: TerminItem[];
    projectName?: string;
    showEnlargeHint?: boolean;
};

function formatCompactRupiah(val: number | string | undefined): string {
    if (val === undefined || val === null || val === "") return "";
    const num = Number(val);
    if (isNaN(num) || num === 0) return "Rp 0";

    if (num >= 1_000_000_000) {
        const b = num / 1_000_000_000;
        return `Rp ${b % 1 === 0 ? b.toFixed(1) : b.toFixed(1)} M`;
    }
    if (num >= 1_000_000) {
        const m = num / 1_000_000;
        return `Rp ${m % 1 === 0 ? m.toFixed(1) : m.toFixed(1)} jt`;
    }
    if (num >= 1_000) {
        const k = num / 1_000;
        return `Rp ${k % 1 === 0 ? k.toFixed(0) : k.toFixed(0)} rb`;
    }
    return `Rp ${num}`;
}

export default function GrafikProgressTermin({
    terminData,
    projectName = "Detail Proyek",
    showEnlargeHint = true,
}: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hoveredIdxCard, setHoveredIdxCard] = useState<number | null>(null);
    const [hoveredIdxModal, setHoveredIdxModal] = useState<number | null>(null);

    const defaultTermins: TerminItem[] = [
        { namaTermin: "Termin 1", persentaseProgress: 20, nominal: 2000000, status: "DITERIMA" },
        { namaTermin: "Termin 2", persentaseProgress: 50, nominal: 3000000, status: "DITERIMA" },
        { namaTermin: "Termin 3", persentaseProgress: 100, nominal: 5000000, status: "BELUM_DITERIMA" },
    ];

    const hasData = terminData !== undefined ? terminData.length > 0 : true;

    const rawTermins = (terminData && terminData.length > 0)
        ? terminData.map((t, idx) => ({
            namaTermin: t.namaTermin || `Termin ${idx + 1}`,
            persentaseProgress: Math.min(100, Math.max(0, Number(t.persentaseProgress) || 0)),
            nominal: t.nominal !== undefined ? Number(t.nominal) : (idx + 1) * 1000000,
            status: t.status || (idx < 2 ? "DITERIMA" : "BELUM_DITERIMA"),
        }))
        : defaultTermins;

    const termins = rawTermins.map((t, idx, arr) => {
        const prevCum = arr
            .slice(0, idx)
            .reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);
        const cumNominal = prevCum + (Number(t.nominal) || 0);
        return {
            ...t,
            nominalNum: Number(t.nominal) || 0,
            prevCumNominal: prevCum,
            cumNominal,
        };
    });

    const count = termins.length;

    const hasTermin0 = termins.length > 0 && (
        Number(termins[0].persentaseProgress) === 0 ||
        termins[0].namaTermin?.toLowerCase().trim() === "termin 0" ||
        termins[0].namaTermin?.toLowerCase().trim() === "dp" ||
        termins[0].namaTermin?.toLowerCase().includes("down payment")
    );

    const totalSections = hasTermin0 ? Math.max(1, count) : count + 1;

    const viewWidth = Math.max(560, totalSections * 115);
    const viewHeight = 250;

    const xStart = 88;
    const xEnd = viewWidth - 20;
    const totalWidth = xEnd - xStart;

    const yTop = 38;
    const yBottom = 195;
    const chartHeight = yBottom - yTop;

    const sectionWidth = totalWidth / totalSections;

    const maxCumNominal = Math.max(1, termins.length > 0 ? termins[termins.length - 1].cumNominal : 1);

    const renderLegend = (isModal: boolean) => (
        <div className={`flex items-center font-medium text-stone-600 whitespace-nowrap flex-nowrap ${
            isModal
                ? "justify-end gap-4 text-xs"
                : "justify-start sm:justify-end gap-2 sm:gap-3 text-[9px] sm:text-[10px]"
        }`}>
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#4d9368] shadow-sm flex-shrink-0" />
                <span className="text-stone-600">Nominal termin</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#afdcc9] shadow-sm flex-shrink-0" />
                <span className="text-stone-600">Akumulasi sebelumnya</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#8ea3b0] shadow-sm flex-shrink-0" />
                <span className="text-stone-600">Belum dicairkan</span>
            </div>
        </div>
    );

    const renderChartSvg = (isModal: boolean) => {
        const activeHoveredIdx = isModal ? hoveredIdxModal : hoveredIdxCard;
        const setHoveredIdx = isModal ? setHoveredIdxModal : setHoveredIdxCard;

        const stepPositions = termins.map((t, idx) => {
            const xMilestone = hasTermin0
                ? xStart + idx * sectionWidth
                : xStart + (idx + 1) * sectionWidth;

            const colX = hasTermin0
                ? xStart + idx * sectionWidth + 3
                : xStart + (idx + 1) * sectionWidth + 3;

            const colWidth = Math.max(20, sectionWidth - 6);
            const midX = colX + colWidth / 2;

            const isDisbursed = t.status
                ? ["DITERIMA", "PAID", "DISBURSED", "APPROVED", "SUDAH_DITERIMA", "SUDAH_DICAIRKAN", "CAIR"].includes(
                    String(t.status).toUpperCase()
                )
                : idx < 2;

            const curCumHeight = (t.cumNominal / maxCumNominal) * chartHeight;
            const prevCumHeight = (t.prevCumNominal / maxCumNominal) * chartHeight;
            const nominalHeight = (t.nominalNum / maxCumNominal) * chartHeight;

            const yTopCurCum = yBottom - curCumHeight;
            const yTopPrevCum = yBottom - prevCumHeight;

            return {
                xMilestone,
                colX,
                colWidth,
                midX,
                isDisbursed,
                nominalNum: t.nominalNum,
                prevCumNominal: t.prevCumNominal,
                cumNominal: t.cumNominal,
                curCumHeight,
                prevCumHeight,
                nominalHeight,
                yTopCurCum,
                yTopPrevCum,
            };
        });

        const clipPrefix = isModal ? "modal" : "card";

        return (
            <div className="relative w-full overflow-visible">
                <div className="mb-3 w-full">
                    {renderLegend(isModal)}
                </div>

                <svg
                    viewBox={`0 0 ${viewWidth} ${viewHeight}`}
                    className="w-full h-auto overflow-visible select-none"
                    style={{ maxHeight: isModal ? "540px" : "230px" }}
                >
                    <defs>
                        {stepPositions.map((step, idx) => (
                            <clipPath key={`clip-${clipPrefix}-${idx}`} id={`clip-${clipPrefix}-${idx}`}>
                                <rect
                                    x={step.colX}
                                    y={step.yTopCurCum}
                                    width={step.colWidth}
                                    height={step.curCumHeight}
                                    rx="4"
                                />
                            </clipPath>
                        ))}
                    </defs>

                    <text
                        x={xStart - 8}
                        y={yTop - 15}
                        textAnchor="end"
                        className="text-[9.5px] font-bold fill-stone-400 font-sans tracking-normal"
                    >
                        Total Kumulatif
                    </text>

                    <line
                        x1={xStart - 10}
                        y1={yBottom}
                        x2={xEnd + 5}
                        y2={yBottom}
                        stroke="#e2e8f0"
                        strokeWidth="1.2"
                    />

                    <line
                        x1={xStart}
                        y1={yTop - 5}
                        x2={xStart}
                        y2={yBottom}
                        stroke={(hasTermin0 && stepPositions[0]?.isDisbursed) ? "#7cd3c1" : "#d1d5db"}
                        strokeWidth="1.2"
                        strokeDasharray="4 4"
                    />
                    <text
                        x={xStart}
                        y={yBottom + 20}
                        textAnchor="middle"
                        className="text-[10px] font-medium fill-stone-400 font-sans"
                    >
                        0%
                    </text>

                    {stepPositions.map((step, idx) => {
                        const isHovered = activeHoveredIdx === idx;
                        const compactText = formatCompactRupiah(step.cumNominal);

                        return (
                            <g key={`y-axis-${idx}`}>
                                {isHovered && (
                                    <line
                                        x1={xStart - 4}
                                        y1={step.yTopCurCum}
                                        x2={step.colX + step.colWidth}
                                        y2={step.yTopCurCum}
                                        stroke="#94a3b8"
                                        strokeWidth="1.2"
                                        strokeDasharray="3 3"
                                        className="transition-all duration-150 animate-in fade-in"
                                    />
                                )}

                                <text
                                    x={xStart - 8}
                                    y={step.yTopCurCum + 3.5}
                                    textAnchor="end"
                                    className={`text-[9.5px]  tracking-tight transition-all ${isHovered
                                            ? "fill-stone-900 font-extrabold text-[10.5px]"
                                            : "fill-stone-400 font-medium"
                                        }`}
                                >
                                    {compactText}
                                </text>
                            </g>
                        );
                    })}

                    {stepPositions.map((step, idx) => {
                        const t = termins[idx];
                        const isHovered = activeHoveredIdx === idx;
                        const hasPrevCum = step.prevCumNominal > 0;
                        const isTermin0Origin = hasTermin0 && idx === 0;

                        return (
                            <g
                                key={`col-group-${idx}`}
                                onMouseEnter={() => setHoveredIdx(idx)}
                                onMouseLeave={() => setHoveredIdx(null)}
                                className="cursor-pointer transition-opacity duration-150"
                            >
                                {!isTermin0Origin && (
                                    <>
                                        <line
                                            x1={step.xMilestone}
                                            y1={yTop - 5}
                                            x2={step.xMilestone}
                                            y2={yBottom}
                                            stroke={step.isDisbursed ? "#7cd3c1" : "#d1d5db"}
                                            strokeWidth="1.2"
                                            strokeDasharray="4 4"
                                        />
                                        <text
                                            x={step.xMilestone}
                                            y={yBottom + 16}
                                            textAnchor="middle"
                                            className="text-[10.5px] font-bold fill-stone-800 font-sans"
                                        >
                                            {t.namaTermin}
                                        </text>
                                        <text
                                            x={step.xMilestone}
                                            y={yBottom + 28}
                                            textAnchor="middle"
                                            className="text-[9.5px] font-medium fill-stone-400 font-sans"
                                        >
                                            {t.persentaseProgress}%
                                        </text>
                                    </>
                                )}

                                <g clipPath={`url(#clip-${clipPrefix}-${idx})`}>
                                    {step.isDisbursed ? (
                                        <>
                                            {hasPrevCum && (
                                                <rect
                                                    x={step.colX}
                                                    y={step.yTopPrevCum}
                                                    width={step.colWidth}
                                                    height={step.prevCumHeight}
                                                    fill="#afdcc9"
                                                />
                                            )}

                                            <rect
                                                x={step.colX}
                                                y={step.yTopCurCum}
                                                width={step.colWidth}
                                                height={step.nominalHeight}
                                                fill="#4d9368"
                                                className={`transition-all duration-150 ${isHovered ? "brightness-105" : ""}`}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            {hasPrevCum && (
                                                <rect
                                                    x={step.colX}
                                                    y={step.yTopPrevCum}
                                                    width={step.colWidth}
                                                    height={step.prevCumHeight}
                                                    fill="#cdd8df"
                                                />
                                            )}

                                            <rect
                                                x={step.colX}
                                                y={step.yTopCurCum}
                                                width={step.colWidth}
                                                height={step.nominalHeight}
                                                fill="#8ea3b0"
                                            />
                                        </>
                                    )}
                                </g>

                                {isHovered && (
                                    <rect
                                        x={step.colX}
                                        y={step.yTopCurCum}
                                        width={step.colWidth}
                                        height={step.curCumHeight}
                                        fill="none"
                                        stroke="#0284c7"
                                        strokeWidth="2"
                                        rx="4"
                                        className="transition-all duration-150 pointer-events-none"
                                    />
                                )}

                                {step.nominalHeight >= 14 && (
                                    <text
                                        x={step.midX}
                                        y={step.yTopCurCum + step.nominalHeight / 2 + 3}
                                        textAnchor="middle"
                                        className="text-[9px] font-bold fill-white  tracking-tight pointer-events-none"
                                    >
                                        {formatCompactRupiah(step.nominalNum)}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {activeHoveredIdx !== null && stepPositions[activeHoveredIdx] && (
                        <foreignObject
                            x={stepPositions[activeHoveredIdx].midX - 90}
                            y={stepPositions[activeHoveredIdx].yTopCurCum - 58}
                            width={180}
                            height={65}
                            className="overflow-visible pointer-events-none"
                        >
                            <div className="flex flex-col items-center justify-end w-full h-full">
                                <div className="bg-white border border-stone-200/90 shadow-xl rounded-xl p-2.5 w-max text-left animate-in fade-in zoom-in-95 duration-150 space-y-0.5 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5 whitespace-nowrap mb-0.5">
                                        <span
                                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                                stepPositions[activeHoveredIdx].isDisbursed ? "bg-[#4d9368]" : "bg-[#8ea3b0]"
                                            }`}
                                        />
                                        <span className="text-[9.5px] font-medium text-stone-500 whitespace-nowrap">
                                            {stepPositions[activeHoveredIdx].isDisbursed ? "Sudah dicairkan" : "Belum dicairkan"}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 text-[9px] whitespace-nowrap">
                                        <span className="text-stone-400 font-medium whitespace-nowrap">Nominal termin</span>
                                        <span className="font-bold text-[#2d6a4f]  whitespace-nowrap">
                                            {<CompactNominal value={termins[activeHoveredIdx].nominalNum} compactThreshold={1_000_000_000} showTooltip />}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 text-[9px] whitespace-nowrap">
                                        <span className="text-stone-400 font-medium whitespace-nowrap">Total kumulatif</span>
                                        <span className="font-bold text-stone-900  whitespace-nowrap">
                                            {<CompactNominal value={termins[activeHoveredIdx].cumNominal} compactThreshold={1_000_000_000} showTooltip />}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </foreignObject>
                    )}
                </svg>
            </div>
        );
    };

    return (
        <>
            <div
                onClick={() => setIsModalOpen(true)}
                className="bg-white border border-stone-200 hover:border-emerald-500 rounded-2xl p-4 shadow-sm hover:shadow transition-all duration-200 cursor-pointer group text-left space-y-3"
            >
                <div className="flex items-center justify-between">
                    <h4 className="text-[13px] font-bold text-stone-900 tracking-tight">
                        Grafik Pencairan Termin
                    </h4>
                    {showEnlargeHint && (
                        <span className="text-[11px] font-normal text-stone-400 group-hover:text-emerald-600 transition">
                            Klik untuk perbesar
                        </span>
                    )}
                </div>

                {!hasData ? (
                    <div className="w-full h-[200px] bg-stone-50/60 border border-dashed border-stone-200 rounded-xl flex items-center justify-center text-xs font-medium text-stone-400 italic">
                        Termin pemasukan belum diatur
                    </div>
                ) : (
                    renderChartSvg(false)
                )}
            </div>

            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsModalOpen(false);
                    }}
                >
                    <div
                        className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-w-4xl w-full border border-stone-100 animate-in zoom-in-95 duration-200 relative text-left flex flex-col max-h-[90vh] overflow-visible"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-6 pb-2 flex-shrink-0">
                            <div>
                                <h3 className="font-bold text-xl sm:text-2xl text-stone-900 leading-tight">
                                    Grafik Pencairan Termin
                                </h3>
                                {projectName && (
                                    <p className="text-sm text-stone-500 mt-1 font-normal">
                                        {projectName}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="p-2.5 border border-stone-200 hover:border-stone-300 hover:bg-stone-50 rounded-2xl transition text-stone-500 hover:text-stone-800 cursor-pointer shadow-sm"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="w-full flex-1 pt-2 pb-4 overflow-visible">
                            {!hasData ? (
                                <div className="w-full h-[350px] bg-stone-50/60 border border-dashed border-stone-200 rounded-2xl flex items-center justify-center text-sm font-medium text-stone-400 italic">
                                    Termin pemasukan belum diatur
                                </div>
                            ) : (
                                renderChartSvg(true)
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
