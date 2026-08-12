import React from "react";

export type TerminItem = {
    id?: number;
    namaTermin: string;
    persentaseProgress: number | string;
    nominal?: number | string;
    status?: string;
};

type Props = {
    terminData?: TerminItem[];
};

export default function GrafikProgressTermin({ terminData }: Props) {
    // If no termin dataset is available from database, render clean empty state matching graph dimensions
    if (!terminData || terminData.length === 0) {
        return (
            <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)] text-left space-y-3">
                <h4 className="text-[13px] font-bold text-stone-900 tracking-tight">
                    Grafik Progress Termin
                </h4>
                <div className="w-full h-[210px] bg-stone-50/60 border border-dashed border-stone-200 rounded-xl flex items-center justify-center text-xs font-medium text-stone-400 italic">
                    Termin pemasukan belum diatur
                </div>
            </div>
        );
    }

    const termins = terminData.map((t, idx) => ({
        namaTermin: t.namaTermin || `Termin ${idx + 1}`,
        persentaseProgress: Math.min(100, Math.max(0, Number(t.persentaseProgress) || 0)),
    }));

    const count = termins.length;

    // Canvas geometry
    const viewWidth = 340;
    const viewHeight = 175;

    const xStart = 65;
    const xEnd = 325;
    const totalWidth = xEnd - xStart;

    const yTop = 28;
    const yBottom = 142;
    const totalHeight = yBottom - yTop;

    // Color definitions for up to N termins
    const terminColors = [
        {
            theme: "red",
            stroke: "#ef4444",
            strokeLight: "#fca5a5",
            bgFill: "rgba(254, 226, 226, 0.45)",
            hatchId: "hatch-red",
            badgeText: "text-red-500",
            labelText: "#ef4444",
            dashColor: "#f87171",
        },
        {
            theme: "green",
            stroke: "#10b981",
            strokeLight: "#6ee7b7",
            bgFill: "rgba(209, 250, 229, 0.45)",
            hatchId: "hatch-green",
            badgeText: "text-emerald-500",
            labelText: "#10b981",
            dashColor: "#34d399",
        },
        {
            theme: "blue",
            stroke: "#3b82f6",
            strokeLight: "#93c5fd",
            bgFill: "rgba(219, 234, 254, 0.45)",
            hatchId: "hatch-blue",
            badgeText: "text-blue-500",
            labelText: "#3b82f6",
            dashColor: "#60a5fa",
        },
        {
            theme: "amber",
            stroke: "#f59e0b",
            strokeLight: "#fcd34d",
            bgFill: "rgba(254, 243, 199, 0.45)",
            hatchId: "hatch-amber",
            badgeText: "text-amber-500",
            labelText: "#f59e0b",
            dashColor: "#fbbf24",
        },
    ];

    // Compute point coordinates
    // Origin point P0 at xStart (Start of project progress at 0%)
    const p0 = {
        x: xStart,
        y: yBottom,
    };

    const sectionWidth = totalWidth / count;

    const points = termins.map((t, idx) => {
        const x = xStart + (idx + 1) * sectionWidth;
        const pct = Math.max(0, Math.min(100, Number(t.persentaseProgress)));
        const y = yBottom - (pct / 100) * totalHeight;
        return { x, y, pct, name: t.namaTermin };
    });

    const allPoints = [p0, ...points];

    return (
        <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)] text-left space-y-3">
            <h4 className="text-[13px] font-bold text-stone-900 tracking-tight">
                Grafik Progress Termin
            </h4>

            <div className="w-full relative select-none">
                <svg
                    viewBox={`0 0 ${viewWidth} ${viewHeight}`}
                    className="w-full h-auto overflow-visible"
                    style={{ maxHeight: "240px" }}
                >
                    <defs>
                        {/* Hatch Pattern - Red */}
                        <pattern
                            id="hatch-red"
                            width="6"
                            height="6"
                            patternUnits="userSpaceOnUse"
                        >
                            <rect width="6" height="6" fill="rgba(254, 226, 226, 0.4)" />
                            <line x1="3" y1="0" x2="3" y2="6" stroke="#fca5a5" strokeWidth="0.8" />
                        </pattern>

                        {/* Hatch Pattern - Green */}
                        <pattern
                            id="hatch-green"
                            width="6"
                            height="6"
                            patternUnits="userSpaceOnUse"
                        >
                            <rect width="6" height="6" fill="rgba(209, 250, 229, 0.4)" />
                            <line x1="3" y1="0" x2="3" y2="6" stroke="#6ee7b7" strokeWidth="0.8" />
                        </pattern>

                        {/* Hatch Pattern - Blue */}
                        <pattern
                            id="hatch-blue"
                            width="6"
                            height="6"
                            patternUnits="userSpaceOnUse"
                        >
                            <rect width="6" height="6" fill="rgba(219, 234, 254, 0.4)" />
                            <line x1="3" y1="0" x2="3" y2="6" stroke="#93c5fd" strokeWidth="0.8" />
                        </pattern>

                        {/* Hatch Pattern - Amber */}
                        <pattern
                            id="hatch-amber"
                            width="6"
                            height="6"
                            patternUnits="userSpaceOnUse"
                        >
                            <rect width="6" height="6" fill="rgba(254, 243, 199, 0.4)" />
                            <line x1="3" y1="0" x2="3" y2="6" stroke="#fcd34d" strokeWidth="0.8" />
                        </pattern>
                    </defs>

                    {/* Y-Axis Line */}
                    <line
                        x1={xStart}
                        y1={yTop - 5}
                        x2={xStart}
                        y2={yBottom + 2}
                        stroke="#e7e5e4"
                        strokeWidth="1.2"
                    />

                    {/* Baseline (X-Axis) */}
                    <line
                        x1={xStart}
                        y1={yBottom}
                        x2={xEnd}
                        y2={yBottom}
                        stroke="#e7e5e4"
                        strokeWidth="1.2"
                    />

                    {/* Y-Axis Labels */}
                    <text
                        x={xStart - 8}
                        y={yTop + 5}
                        textAnchor="end"
                        className="text-[9.5px] fill-stone-400 font-medium font-sans"
                    >
                        Progress
                    </text>
                    <text
                        x={xStart - 8}
                        y={yBottom - 2}
                        textAnchor="end"
                        className="text-[9.5px] fill-stone-400 font-medium font-sans"
                    >
                        Pemasukan
                    </text>

                    {/* Shaded Area Regions & Vertical Division Lines */}
                    {points.map((pt, idx) => {
                        const prevPt = allPoints[idx];
                        const color = terminColors[idx % terminColors.length];

                        // Polygon path for this section:
                        // (prevPt.x, yBottom) -> (prevPt.x, prevPt.y) -> (pt.x, pt.y) -> (pt.x, yBottom)
                        const polyD = `M ${prevPt.x},${yBottom} L ${prevPt.x},${prevPt.y} L ${pt.x},${pt.y} L ${pt.x},${yBottom} Z`;

                        return (
                            <g key={`region-${idx}`}>
                                {/* Polygon hatch fill */}
                                <path d={polyD} fill={`url(#${color.hatchId})`} />

                                {/* Vertical dashed divider at section boundary */}
                                <line
                                    x1={pt.x}
                                    y1={yTop - 5}
                                    x2={pt.x}
                                    y2={yBottom}
                                    stroke={color.dashColor}
                                    strokeWidth="1"
                                    strokeDasharray="3 3"
                                />
                            </g>
                        );
                    })}

                    {/* Line segments connecting points */}
                    {points.map((pt, idx) => {
                        const prevPt = allPoints[idx];
                        const color = terminColors[idx % terminColors.length];

                        return (
                            <line
                                key={`line-${idx}`}
                                x1={prevPt.x}
                                y1={prevPt.y}
                                x2={pt.x}
                                y2={pt.y}
                                stroke={color.stroke}
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        );
                    })}

                    {/* 0% Origin Marker P0 */}
                    <g key="badge-p0">
                        <circle
                            cx={p0.x}
                            cy={p0.y}
                            r="3.5"
                            fill="#78716c"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                        />
                        <text
                            x={p0.x}
                            y={p0.y - 7}
                            textAnchor="middle"
                            fill="#78716c"
                            className="text-[9.5px] font-extrabold font-mono"
                        >
                            0%
                        </text>
                    </g>

                    {/* Points & Percentage Badges */}
                    {points.map((pt, idx) => {
                        const color = terminColors[idx % terminColors.length];
                        return (
                            <g key={`badge-${idx}`}>
                                {/* Circle node on line */}
                                <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r="3.5"
                                    fill={color.stroke}
                                    stroke="#ffffff"
                                    strokeWidth="1.5"
                                />

                                {/* Percentage label above dot */}
                                <text
                                    x={pt.x}
                                    y={pt.y - 7}
                                    textAnchor="middle"
                                    fill={color.stroke}
                                    className="text-[9.5px] font-extrabold font-mono"
                                >
                                    {pt.pct}%
                                </text>
                            </g>
                        );
                    })}

                    {/* X-Axis Labels (Termin names) */}
                    {points.map((pt, idx) => {
                        const prevPt = allPoints[idx];
                        const midX = (prevPt.x + pt.x) / 2;
                        const color = terminColors[idx % terminColors.length];

                        return (
                            <text
                                key={`label-${idx}`}
                                x={midX}
                                y={yBottom + 16}
                                textAnchor="middle"
                                fill={color.labelText}
                                className="text-[9px] font-semibold tracking-tight"
                            >
                                {pt.name}
                            </text>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}
