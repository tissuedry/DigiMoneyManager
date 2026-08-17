import React, { useState } from "react";
import { X } from "lucide-react";

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

function formatFullRupiah(val: number | string | undefined): string {
    if (val === undefined || val === null || val === "") return "Rp 0";
    const num = Number(val);
    if (isNaN(num)) return "Rp 0";
    return `Rp ${num.toLocaleString("id-ID")}`;
}

function formatCompactRupiah(val: number | string | undefined): string {
    if (val === undefined || val === null || val === "") return "";
    const num = Number(val);
    if (isNaN(num) || num === 0) return "Rp 0";

    if (num >= 1_000_000_000) {
        const b = num / 1_000_000_000;
        return `Rp ${b % 1 === 0 ? b : b.toFixed(1)} M`;
    }
    if (num >= 1_000_000) {
        const m = num / 1_000_000;
        return `Rp ${m % 1 === 0 ? m : m.toFixed(1)} jt`;
    }
    if (num >= 1_000) {
        const k = num / 1_000;
        return `Rp ${k % 1 === 0 ? k : k.toFixed(0)} rb`;
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

    // Default fallback dataset if terminData is undefined
    const defaultTermins: TerminItem[] = [
        { namaTermin: "Termin 1", persentaseProgress: 10, nominal: 200000, status: "DITERIMA" },
        { namaTermin: "Termin 2", persentaseProgress: 20, nominal: 300000, status: "DITERIMA" },
        { namaTermin: "Termin 3", persentaseProgress: 30, nominal: 3000000, status: "BELUM_DITERIMA" },
        { namaTermin: "Termin 4", persentaseProgress: 40, nominal: 3000000, status: "BELUM_DITERIMA" },
        { namaTermin: "Termin 5", persentaseProgress: 50, nominal: 30000000, status: "BELUM_DITERIMA" },
        { namaTermin: "Termin 6", persentaseProgress: 60, nominal: 3000000, status: "BELUM_DITERIMA" },
        { namaTermin: "Termin 7", persentaseProgress: 70, nominal: 3000000, status: "BELUM_DITERIMA" },
        { namaTermin: "Termin 8", persentaseProgress: 80, nominal: 3000000, status: "BELUM_DITERIMA" },
        { namaTermin: "Termin 9", persentaseProgress: 90, nominal: 3000000, status: "BELUM_DITERIMA" },
        { namaTermin: "Termin 10", persentaseProgress: 100, nominal: 300000000, status: "BELUM_DITERIMA" },
    ];

    // If terminData is explicitly passed as empty array [], render empty state
    const hasData = terminData !== undefined ? terminData.length > 0 : true;

    const rawTermins = (terminData && terminData.length > 0)
        ? terminData.map((t, idx) => ({
            namaTermin: t.namaTermin || `Termin ${idx + 1}`,
            persentaseProgress: Math.min(100, Math.max(0, Number(t.persentaseProgress) || 0)),
            nominal: t.nominal !== undefined ? Number(t.nominal) : (idx + 1) * 1000000,
            status: t.status || (idx < 2 ? "DITERIMA" : "BELUM_DITERIMA"),
        }))
        : defaultTermins;

    // Calculate CUMULATIVE NOMINAL for each running step
    const termins = rawTermins.map((t, idx, arr) => {
        const cumNominal = arr
            .slice(0, idx + 1)
            .reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);
        return {
            ...t,
            cumNominal,
        };
    });

    const count = termins.length;
    const hasTermin0 = termins.some((t) => Number(t.persentaseProgress) === 0 || t.namaTermin?.toLowerCase().includes("termin 0"));
    const totalSections = hasTermin0 ? Math.max(1, count) : count + 1;

    // SVG geometry with maxBlockHeight = 150px
    const viewWidth = Math.max(540, totalSections * 80);
    const viewHeight = 230;

    const xStart = 62;
    const xEnd = viewWidth - 25;
    const totalWidth = xEnd - xStart;

    const yTop = 15;
    const yBottom = 175;

    const sectionWidth = totalWidth / totalSections;

    // Calculate maximum cumulative nominal (total accumulated income at final step)
    const maxCumNominal = Math.max(1, termins.length > 0 ? termins[termins.length - 1].cumNominal : 1);

    // Height boundaries for truth-to-size proportional scaling
    const maxBlockHeight = 150;
    const minBlockHeight = 4;

    // Gap between blocks so they don't merge visually
    const blockGap = 3;

    const renderLegend = () => (
        <div className="flex items-center gap-3.5 text-xs text-stone-600 font-medium bg-stone-50/90 border border-stone-200/70 px-3 py-1.5 rounded-xl w-fit">
            <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#52b788] shadow-sm" />
                <span>Sudah Dicairkan</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#9ca3af] shadow-sm" />
                <span>Belum Dicairkan</span>
            </div>
        </div>
    );

    const renderChartSvg = (isModal: boolean) => {
        const activeHoveredIdx = isModal ? hoveredIdxModal : hoveredIdxCard;
        const setHoveredIdx = isModal ? setHoveredIdxModal : setHoveredIdxCard;

        // Calculate step positions & heights based on CUMULATIVE NOMINAL
        const stepPositions = termins.map((t, idx) => {
            const xLeft = hasTermin0 ? xStart + idx * sectionWidth : xStart + (idx + 1) * sectionWidth;
            const xRight = hasTermin0 ? xStart + (idx + 1) * sectionWidth : xStart + (idx + 2) * sectionWidth;
            const midX = (xLeft + xRight) / 2;
            const pct = Number(t.persentaseProgress) || 0;
            const cumNominalVal = t.cumNominal;

            // Strict linear scaling (Truth to size) based on CUMULATIVE NOMINAL
            const linearRatio = maxCumNominal > 0 ? cumNominalVal / maxCumNominal : 0;
            const blockHeight = linearRatio > 0 ? Math.max(minBlockHeight, linearRatio * maxBlockHeight) : 0;
            const blockY = yBottom - blockHeight;

            // Determine status color: Green if disbursed (DITERIMA / PAID / DISBURSED), Grey if undisbursed (BELUM_DITERIMA)
            const isDisbursed = t.status
                ? ["DITERIMA", "PAID", "DISBURSED", "APPROVED"].includes(String(t.status).toUpperCase())
                : idx < 2;

            const color = isDisbursed
                ? { fill: "#52b788", text: "#2e7d56", dash: "#6ee7b7" } // Hijau (Sudah dicairkan)
                : { fill: "#9ca3af", text: "#4b5563", dash: "#d1d5db" }; // Abu-abu (Belum dicairkan)

            return { xLeft, xRight, midX, pct, cumNominalVal, blockHeight, blockY, color, isDisbursed };
        });

        // Edge-aware tooltip alignment so rightmost termins (e.g. Termin 10) never overflow right
        let tooltipTranslateClass = "-translate-x-1/2";
        if (activeHoveredIdx !== null) {
            if (activeHoveredIdx >= count - 2) {
                tooltipTranslateClass = "-translate-x-[85%]";
            } else if (activeHoveredIdx === 0) {
                tooltipTranslateClass = "-translate-x-[15%]";
            }
        }

        return (
            <div className="relative w-full overflow-visible">
                {/* Legend Pill positioned on the top-right section as requested by user arrow */}
                <div className="mb-3 flex justify-end">
                    {renderLegend()}
                </div>

                {/* Floating Tooltip Pill on Hover - Edge aware alignment */}
                {activeHoveredIdx !== null && stepPositions[activeHoveredIdx] && (
                    <div
                        className={`absolute pointer-events-none z-50 transform ${tooltipTranslateClass} -translate-y-full transition-all duration-150`}
                        style={{
                            left: `${(stepPositions[activeHoveredIdx].midX / viewWidth) * 100}%`,
                            top: `${(stepPositions[activeHoveredIdx].blockY / viewHeight) * 100 + 25}%`,
                        }}
                    >
                        <div className="bg-white border border-stone-200/90 shadow-2xl rounded-xl px-3 py-1.5 text-[12px] font-bold font-mono text-stone-900 whitespace-nowrap flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                            <span
                                className={`w-2 h-2 rounded-full ${
                                    stepPositions[activeHoveredIdx].isDisbursed
                                        ? "bg-emerald-500"
                                        : "bg-stone-400"
                                }`}
                            />
                            {formatFullRupiah(termins[activeHoveredIdx].nominal)}
                            <span className="text-[10px] text-stone-400 font-sans font-normal ml-0.5">
                                ({stepPositions[activeHoveredIdx].isDisbursed ? "Sudah Dicairkan" : "Belum Dicairkan"})
                            </span>
                        </div>
                    </div>
                )}

                <svg
                    viewBox={`0 0 ${viewWidth} ${viewHeight}`}
                    className="w-full h-auto overflow-visible select-none"
                    style={{ maxHeight: isModal ? "540px" : "240px" }}
                >
                    {/* Horizontal Baseline */}
                    <line
                        x1={xStart - 10}
                        y1={yBottom}
                        x2={xEnd + 5}
                        y2={yBottom}
                        stroke="#e7e5e4"
                        strokeWidth="1.2"
                    />

                    {/* Origin (0%) Vertical Dotted Line & Label */}
                    {!hasTermin0 && (
                        <>
                            <line
                                x1={xStart}
                                y1={yTop - 5}
                                x2={xStart}
                                y2={yBottom}
                                stroke="#d6d3d1"
                                strokeWidth="1"
                                strokeDasharray="3 3"
                            />
                            <text
                                x={xStart}
                                y={yBottom + 26}
                                textAnchor="middle"
                                className="text-[9.5px] font-medium fill-stone-400 font-sans"
                            >
                                0%
                            </text>
                        </>
                    )}

                    {/* Faint Horizontal Dotted Guidelines (Muncul Saat Hover) & Left Y-Axis Labels */}
                    {termins.map((t, idx) => {
                        const { blockY, xRight } = stepPositions[idx];
                        const compactText = formatCompactRupiah(t.cumNominal);
                        const isHovered = activeHoveredIdx === idx;

                        return (
                            <g key={`guide-${idx}`}>
                                {/* Garis putus-putus samar abu-abu terang (hanya muncul saat di-hover) */}
                                {isHovered && (
                                    <line
                                        x1={xStart - 4}
                                        y1={blockY}
                                        x2={xRight}
                                        y2={blockY}
                                        stroke="#c7c3bd"
                                        strokeWidth="1"
                                        strokeDasharray="3 3"
                                        className="transition-all duration-150 animate-in fade-in"
                                    />
                                )}

                                {/* Label Nominal di Sisi Kiri (Y-Axis) */}
                                {compactText && (
                                    <text
                                        x={xStart - 8}
                                        y={blockY + 3.5}
                                        textAnchor="end"
                                        className={`text-[9.5px] font-semibold font-mono tracking-tight transition-all ${
                                            isHovered ? "fill-stone-900 font-extrabold" : "fill-[#a8a29e]"
                                        }`}
                                    >
                                        {compactText}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Render Step Blocks with subtle blockGap separation */}
                    {termins.map((t, idx) => {
                        const { xLeft, pct, blockY, blockHeight, color } = stepPositions[idx];
                        const isHovered = activeHoveredIdx === idx;
                        const isTermin0 = Number(pct) === 0 || t.namaTermin?.toLowerCase().includes("termin 0");

                        // Block rectangle with small gap separation
                        const blockX = xLeft + blockGap / 2;
                        const blockW = Math.max(2, sectionWidth - blockGap);

                        return (
                            <g
                                key={`step-${idx}`}
                                onMouseEnter={() => setHoveredIdx(idx)}
                                onMouseLeave={() => setHoveredIdx(null)}
                                className="cursor-pointer transition-opacity duration-150"
                            >
                                {/* Vertical Dotted Division Line at Milestone */}
                                <line
                                    x1={xLeft}
                                    y1={yTop - 5}
                                    x2={xLeft}
                                    y2={yBottom}
                                    stroke={color.dash}
                                    strokeWidth="1"
                                    strokeDasharray="3 3"
                                />

                                {/* Solid Color Step Block with 3px gap separation and rx="2" rounded corners */}
                                <rect
                                    x={blockX}
                                    y={blockY}
                                    width={blockW}
                                    height={blockHeight}
                                    fill={color.fill}
                                    rx="2"
                                    className={`transition-all duration-150 ${isHovered ? "brightness-110 opacity-95 stroke-white stroke-2" : ""}`}
                                />

                                {/* X-Axis Labels */}
                                {isTermin0 ? (
                                    <text
                                        x={xLeft}
                                        y={yBottom + 20}
                                        textAnchor="middle"
                                        className="text-[10px] font-bold fill-stone-700 font-sans"
                                    >
                                        0%
                                    </text>
                                ) : (
                                    <>
                                        {/* X-Axis Termin Name below milestone line */}
                                        <text
                                            x={xLeft}
                                            y={yBottom + 16}
                                            textAnchor="middle"
                                            className="text-[10px] font-bold fill-stone-700 font-sans"
                                        >
                                            {t.namaTermin}
                                        </text>

                                        {/* X-Axis Percentage below Termin Name */}
                                        <text
                                            x={xLeft}
                                            y={yBottom + 28}
                                            textAnchor="middle"
                                            className="text-[9.5px] font-medium fill-stone-400 font-sans"
                                        >
                                            {pct}%
                                        </text>
                                    </>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        );
    };

    return (
        <>
            {/* Main Interactive Card */}
            <div
                onClick={() => setIsModalOpen(true)}
                className="bg-white border border-stone-200 hover:border-emerald-500 rounded-2xl p-4 shadow-sm hover:shadow transition-all duration-200 cursor-pointer group text-left space-y-3"
            >
                <div className="flex items-center justify-between">
                    <h4 className="text-[13px] font-bold text-stone-900 tracking-tight">
                        Grafik Progress Termin
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

            {/* Pop-up Modal View - Enlarged 2x */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsModalOpen(false);
                    }}
                >
                    <div
                        className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-w-5xl w-full border border-stone-100 animate-in zoom-in-95 duration-200 relative text-left flex flex-col max-h-[90vh] overflow-visible"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-4 border-b border-stone-100 pb-3 flex-shrink-0">
                            <div>
                                <h3 className="font-bold text-xl text-stone-900">Grafik Progres Termin</h3>
                                {projectName && (
                                    <p className="text-xs text-stone-500 mt-1 font-medium">{projectName}</p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition cursor-pointer"
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
