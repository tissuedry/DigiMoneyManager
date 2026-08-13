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
        { namaTermin: "Termin 1", persentaseProgress: 10, nominal: 200000 },
        { namaTermin: "Termin 2", persentaseProgress: 20, nominal: 300000 },
        { namaTermin: "Termin 3", persentaseProgress: 30, nominal: 3000000 },
        { namaTermin: "Termin 4", persentaseProgress: 40, nominal: 3000000 },
        { namaTermin: "Termin 5", persentaseProgress: 50, nominal: 30000000 },
        { namaTermin: "Termin 6", persentaseProgress: 60, nominal: 3000000 },
        { namaTermin: "Termin 7", persentaseProgress: 70, nominal: 3000000 },
        { namaTermin: "Termin 8", persentaseProgress: 80, nominal: 3000000 },
        { namaTermin: "Termin 9", persentaseProgress: 90, nominal: 3000000 },
        { namaTermin: "Termin 10", persentaseProgress: 100, nominal: 300000000 },
    ];

    // If terminData is explicitly passed as empty array [], render empty state
    const hasData = terminData !== undefined ? terminData.length > 0 : true;

    const termins = (terminData && terminData.length > 0)
        ? terminData.map((t, idx) => ({
            namaTermin: t.namaTermin || `Termin ${idx + 1}`,
            persentaseProgress: Math.min(100, Math.max(0, Number(t.persentaseProgress) || 0)),
            nominal: t.nominal !== undefined ? Number(t.nominal) : (idx + 1) * 1000000,
        }))
        : defaultTermins;

    const count = termins.length;

    // SVG geometry with maxBlockHeight = 150px
    const viewWidth = Math.max(540, (count + 1) * 80);
    const viewHeight = 230;

    const xStart = 40;
    const xEnd = viewWidth - 30;
    const totalWidth = xEnd - xStart;

    const yTop = 15;
    const yBottom = 175;
    const totalHeight = yBottom - yTop; // 160px capacity

    const sectionWidth = totalWidth / (count + 1);

    // Calculate maximum nominal for nominal scaling
    const maxNominal = Math.max(1, ...termins.map((t) => Number(t.nominal) || 0));

    // Dynamic height boundaries (maxBlockHeight set to 150px as requested)
    const minBlockHeight = 18;
    const maxBlockHeight = 150;

    // Color theme configuration per step
    const stepColors = [
        { fill: "#d65f5f", text: "#d65f5f", dash: "#fca5a5" },
        { fill: "#52b788", text: "#2e7d56", dash: "#6ee7b7" },
        { fill: "#5b92e5", text: "#3b82f6", dash: "#93c5fd" },
        { fill: "#eb9824", text: "#d97706", dash: "#fcd34d" },
    ];

    const renderChartSvg = (isModal: boolean) => {
        const activeHoveredIdx = isModal ? hoveredIdxModal : hoveredIdxCard;
        const setHoveredIdx = isModal ? setHoveredIdxModal : setHoveredIdxCard;

        // Calculate step positions & heights
        const stepPositions = termins.map((t, idx) => {
            const xLeft = xStart + (idx + 1) * sectionWidth;
            const xRight = xStart + (idx + 2) * sectionWidth;
            const midX = (xLeft + xRight) / 2;
            const pct = Number(t.persentaseProgress) || 0;
            const nominalVal = Number(t.nominal) || 0;

            // Power-scaling (exponent 0.42) for clear visual step hierarchy
            const linearRatio = maxNominal > 0 ? nominalVal / maxNominal : 0;
            const scaledRatio = linearRatio > 0 ? Math.pow(linearRatio, 0.42) : 0;

            const blockHeight = minBlockHeight + scaledRatio * (maxBlockHeight - minBlockHeight);
            const blockY = yBottom - blockHeight;

            return { xLeft, xRight, midX, pct, nominalVal, blockHeight, blockY };
        });

        return (
            <div className="relative w-full overflow-x-auto scrollbar-thin">
                {/* Floating Tooltip Pill on Hover */}
                {activeHoveredIdx !== null && stepPositions[activeHoveredIdx] && (
                    <div
                        className="absolute pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full transition-all duration-150"
                        style={{
                            left: `${(stepPositions[activeHoveredIdx].midX / viewWidth) * 100}%`,
                            top: `${(stepPositions[activeHoveredIdx].blockY / viewHeight) * 100 - 3}%`,
                        }}
                    >
                        <div className="bg-white border border-stone-200/90 shadow-2xl rounded-xl px-3 py-1.5 text-[12px] font-bold font-mono text-stone-900 whitespace-nowrap flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                            {formatFullRupiah(termins[activeHoveredIdx].nominal)}
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

                    {/* Render Step Blocks */}
                    {termins.map((t, idx) => {
                        const color = stepColors[idx % stepColors.length];
                        const { xLeft, xRight, midX, pct, blockY, blockHeight } = stepPositions[idx];
                        const isHovered = activeHoveredIdx === idx;
                        const compactText = formatCompactRupiah(t.nominal);

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

                                {/* Solid Color Step Block */}
                                <rect
                                    x={xLeft}
                                    y={blockY}
                                    width={sectionWidth}
                                    height={blockHeight}
                                    fill={color.fill}
                                    className={`transition-all duration-150 ${isHovered ? "brightness-110 opacity-90 stroke-white stroke-2" : ""}`}
                                />

                                {/* Compact Nominal Label Above Step Block */}
                                {compactText && (
                                    <text
                                        x={midX}
                                        y={blockY - 7}
                                        textAnchor="middle"
                                        fill={color.text}
                                        className={`text-[10.5px] font-bold font-mono tracking-tight transition-all ${isHovered ? "font-black" : ""}`}
                                    >
                                        {compactText}
                                    </text>
                                )}

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
                        className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-w-5xl w-full border border-stone-100 animate-in zoom-in-95 duration-200 relative text-left overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between mb-4 border-b border-stone-100 pb-3 flex-shrink-0">
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

                        <div className="w-full flex-1 overflow-x-auto overflow-y-auto pt-4 pb-4">
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
