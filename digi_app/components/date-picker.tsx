"use client";

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const BULAN_PENDEK = BULAN.map((b) => b.slice(0, 3));
const HARI = ["M", "S", "S", "R", "K", "J", "S"];

const EXIT_DURATION = 120;
const POPUP_GAP = 8;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateString(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function parseDateString(value?: string | null): { y: number; m: number; d: number } | null {
  if (!value) return null;
  const parts = value.split("-").map(Number);
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  return { y, m: m - 1, d };
}

function clampSegment(digits: string, min: number, max: number): string {
  if (digits.length < 2) return digits;
  const n = Math.min(Math.max(parseInt(digits, 10), min), max);
  return pad(n);
}

// Batas hari maksimum untuk segmen bulan/tahun yang sedang diketik (mis. Februari 28/29, April 30)
function maxDayForSegments(monthStr: string, yearStr: string): number {
  const mm = monthStr.length === 2 ? parseInt(monthStr, 10) : NaN;
  if (Number.isNaN(mm) || mm < 1 || mm > 12) return 31;
  const yy = yearStr.length === 4 ? parseInt(yearStr, 10) : new Date().getFullYear();
  return new Date(yy, mm, 0).getDate();
}

function formatDisplay(value?: string | null): string {
  const parsed = parseDateString(value);
  if (!parsed) return "";
  return `${parsed.d} ${BULAN_PENDEK[parsed.m]} ${parsed.y}`;
}

type DatePickerSize = "md" | "sm";
type CalendarView = "days" | "months" | "years";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  size?: DatePickerSize;
  align?: "left" | "right";
  clearable?: boolean;
}

export default function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "Pilih tanggal",
  disabled,
  error,
  size = "md",
  align = "left",
  clearable = true,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [view, setView] = useState<CalendarView>("days");
  const [dayStr, setDayStr] = useState("");
  const [monthStr, setMonthStr] = useState("");
  const [yearStr, setYearStr] = useState("");
  const today = new Date();
  const [viewYear, setViewYear] = useState(() => parseDateString(value)?.y ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parseDateString(value)?.m ?? today.getMonth());
  const [yearRangeStart, setYearRangeStart] = useState(() => Math.floor(viewYear / 12) * 12);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  const isDisabledDate = (dateStr: string) => Boolean((min && dateStr < min) || (max && dateStr > max));

  useEffect(() => setMounted(true), []);

  const updateCoords = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({
      top: rect.top - POPUP_GAP,
      left: align === "right" ? rect.right : rect.left,
    });
  };

  useEffect(() => {
    if (open) {
      const s = parseDateString(value);
      setViewYear(s?.y ?? today.getFullYear());
      setViewMonth(s?.m ?? today.getMonth());
      setYearRangeStart(Math.floor((s?.y ?? today.getFullYear()) / 12) * 12);
      setDayStr(s ? pad(s.d) : "");
      setMonthStr(s ? pad(s.m + 1) : "");
      setYearStr(s ? String(s.y) : "");
      setView("days");
      updateCoords();
      setShouldRender(true);
      const raf = requestAnimationFrame(() => setIsVisible(true));
      window.addEventListener("scroll", updateCoords, true);
      window.addEventListener("resize", updateCoords);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("scroll", updateCoords, true);
        window.removeEventListener("resize", updateCoords);
      };
    }
    setIsVisible(false);
    const timer = setTimeout(() => setShouldRender(false), EXIT_DURATION);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Sinkronkan segmen ketikan saat tanggal berubah dari grid/tombol lain selagi popup terbuka
  useEffect(() => {
    if (!open) return;
    const s = parseDateString(value);
    setDayStr(s ? pad(s.d) : "");
    setMonthStr(s ? pad(s.m + 1) : "");
    setYearStr(s ? String(s.y) : "");
    if (s) {
      setViewYear(s.y);
      setViewMonth(s.m);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (popupRef.current?.contains(target)) return;
      setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const commitIfComplete = (d: string, m: string, y: string) => {
    if (d.length !== 2 || m.length !== 2 || y.length !== 4) return;
    const dd = parseInt(d, 10);
    const mm = parseInt(m, 10);
    const yy = parseInt(y, 10);
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || yy < 1) return;
    const test = new Date(yy, mm - 1, dd);
    if (test.getFullYear() !== yy || test.getMonth() !== mm - 1 || test.getDate() !== dd) return;
    const dateStr = toDateString(yy, mm - 1, dd);
    if (isDisabledDate(dateStr)) return;
    onChange(dateStr);
    setViewYear(yy);
    setViewMonth(mm - 1);
    setView("days");
  };

  const handleDayInput = (e: ChangeEvent<HTMLInputElement>) => {
    const digits = clampSegment(e.target.value.replace(/\D/g, "").slice(0, 2), 1, maxDayForSegments(monthStr, yearStr));
    setDayStr(digits);
    if (digits.length === 2) monthRef.current?.focus();
    commitIfComplete(digits, monthStr, yearStr);
  };

  const handleMonthInput = (e: ChangeEvent<HTMLInputElement>) => {
    const digits = clampSegment(e.target.value.replace(/\D/g, "").slice(0, 2), 1, 12);
    setMonthStr(digits);
    // Bulan berubah bisa mempersempit hari maksimum (mis. dari 31 ke 30/28/29) — sesuaikan hari yang sudah diketik
    const clampedDay = clampSegment(dayStr, 1, maxDayForSegments(digits, yearStr));
    if (clampedDay !== dayStr) setDayStr(clampedDay);
    if (digits.length === 2) {
      setViewMonth(parseInt(digits, 10) - 1);
      yearRef.current?.focus();
    }
    commitIfComplete(clampedDay, digits, yearStr);
  };

  const handleYearInput = (e: ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
    setYearStr(digits);
    // Tahun berubah bisa mempengaruhi tahun kabisat (Februari 28 vs 29)
    const clampedDay = clampSegment(dayStr, 1, maxDayForSegments(monthStr, digits));
    if (clampedDay !== dayStr) setDayStr(clampedDay);
    if (digits.length === 4) setViewYear(parseInt(digits, 10));
    commitIfComplete(clampedDay, monthStr, digits);
  };

  // Ketik 1 digit lalu pindah/keluar dari field -> otomatis diberi angka nol di depan (mis. "3" -> "03")
  const handleDayBlur = () => {
    if (dayStr.length !== 1) return;
    const padded = clampSegment(dayStr.padStart(2, "0"), 1, maxDayForSegments(monthStr, yearStr));
    setDayStr(padded);
    commitIfComplete(padded, monthStr, yearStr);
  };

  const handleMonthBlur = () => {
    if (monthStr.length !== 1) return;
    const padded = clampSegment(monthStr.padStart(2, "0"), 1, 12);
    setMonthStr(padded);
    setViewMonth(parseInt(padded, 10) - 1);
    const clampedDay = clampSegment(dayStr, 1, maxDayForSegments(padded, yearStr));
    if (clampedDay !== dayStr) setDayStr(clampedDay);
    commitIfComplete(clampedDay, padded, yearStr);
  };

  const handleSegmentKeyDown =
    (seg: "d" | "m" | "y") => (e: KeyboardEvent<HTMLInputElement>) => {
      const current = seg === "d" ? dayStr : seg === "m" ? monthStr : yearStr;
      if (e.key === "Backspace" && current.length === 0) {
        if (seg === "m") dayRef.current?.focus();
        if (seg === "y") monthRef.current?.focus();
      } else if (e.key === "ArrowLeft") {
        if (seg === "m") dayRef.current?.focus();
        if (seg === "y") monthRef.current?.focus();
      } else if (e.key === "ArrowRight") {
        if (seg === "d") monthRef.current?.focus();
        if (seg === "m") yearRef.current?.focus();
      } else if (e.key === "Enter") {
        if (seg === "d") handleDayBlur();
        if (seg === "m") handleMonthBlur();
      }
    };

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setView("days");
  };

  const handleHeaderClick = () => {
    if (view === "days") setView("months");
    else if (view === "months") {
      setYearRangeStart(Math.floor(viewYear / 12) * 12);
      setView("years");
    } else setView("days");
  };

  const handlePrev = () => {
    if (view === "years") setYearRangeStart((y) => y - 12);
    else if (view === "months") setViewYear((y) => y - 1);
    else goPrevMonth();
  };

  const handleNext = () => {
    if (view === "years") setYearRangeStart((y) => y + 12);
    else if (view === "months") setViewYear((y) => y + 1);
    else goNextMonth();
  };

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells: { y: number; m: number; d: number; inMonth: boolean }[] = [];
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    cells.push({ y, m, d, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ y: viewYear, m: viewMonth, d, inMonth: true });
  }
  let trailing = 1;
  while (cells.length < 42) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    cells.push({ y, m, d: trailing, inMonth: false });
    trailing++;
  }

  const todayStr = toDateString(today.getFullYear(), today.getMonth(), today.getDate());

  const sizeClasses =
    size === "sm"
      ? "px-3 py-2 text-[12px] rounded-lg bg-stone-50"
      : "px-4 py-2.5 text-[13px] rounded-xl bg-white";

  const borderClasses = open
    ? "border-emerald-500 ring-2 ring-emerald-500/20"
    : error
      ? "border-red-300 hover:border-red-400"
      : "border-stone-200 hover:border-stone-300";

  const baseTranslate = align === "right" ? "translate(-100%, -100%)" : "translateY(-100%)";
  const scale = isVisible ? "scale(1)" : "scale(0.95)";

  const headerLabel =
    view === "years"
      ? `${yearRangeStart} - ${yearRangeStart + 11}`
      : view === "months"
        ? `${viewYear}`
        : `${BULAN[viewMonth]} ${viewYear}`;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 border transition cursor-pointer text-left disabled:opacity-60 disabled:cursor-not-allowed ${sizeClasses} ${borderClasses}`}
      >
        <span className={value ? "text-stone-800 font-semibold" : "text-stone-400 font-medium"}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <Calendar size={14} className={open ? "text-emerald-600 shrink-0" : "text-stone-400 shrink-0"} />
      </button>

      {mounted && shouldRender && coords &&
        createPortal(
          <div
            ref={popupRef}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              transform: `${baseTranslate} ${scale}`,
              transformOrigin: align === "right" ? "bottom right" : "bottom left",
            }}
            className={`z-[110] w-[272px] bg-white border border-stone-100 rounded-2xl shadow-xl shadow-stone-900/10 p-4 transition-[opacity,transform] duration-150 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Ketik manual tanggal per segmen */}
            <div className="flex items-center justify-center gap-1 mb-3 border border-stone-200 rounded-lg px-2.5 py-1.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/15 transition">
              <input
                ref={dayRef}
                type="text"
                inputMode="numeric"
                maxLength={2}
                placeholder="dd"
                value={dayStr}
                onChange={handleDayInput}
                onKeyDown={handleSegmentKeyDown("d")}
                onBlur={handleDayBlur}
                autoFocus
                onFocus={(e) => e.target.select()}
                className={`w-[1.6em] bg-transparent outline-none text-center tabular-nums text-[12px] placeholder:text-stone-300 placeholder:font-medium ${
                  dayStr ? "text-stone-800 font-semibold" : "text-stone-400 font-medium"
                }`}
              />
              <span className="text-stone-300 font-medium select-none">/</span>
              <input
                ref={monthRef}
                type="text"
                inputMode="numeric"
                maxLength={2}
                placeholder="mm"
                value={monthStr}
                onChange={handleMonthInput}
                onKeyDown={handleSegmentKeyDown("m")}
                onBlur={handleMonthBlur}
                onFocus={(e) => e.target.select()}
                className={`w-[1.6em] bg-transparent outline-none text-center tabular-nums text-[12px] placeholder:text-stone-300 placeholder:font-medium ${
                  monthStr ? "text-stone-800 font-semibold" : "text-stone-400 font-medium"
                }`}
              />
              <span className="text-stone-300 font-medium select-none">/</span>
              <input
                ref={yearRef}
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="yyyy"
                value={yearStr}
                onChange={handleYearInput}
                onKeyDown={handleSegmentKeyDown("y")}
                onFocus={(e) => e.target.select()}
                className={`w-[2.8em] bg-transparent outline-none text-center tabular-nums text-[12px] placeholder:text-stone-300 placeholder:font-medium ${
                  yearStr ? "text-stone-800 font-semibold" : "text-stone-400 font-medium"
                }`}
              />
            </div>

            {/* Header: navigasi & label bulan/tahun (klik untuk ganti mode pilih bulan/tahun) */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              >
                <ChevronLeft size={15} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={handleHeaderClick}
                className="text-[13px] font-bold text-stone-900 tracking-tight hover:text-emerald-700 transition cursor-pointer px-2 py-1 rounded-lg hover:bg-stone-50"
              >
                {headerLabel}
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              >
                <ChevronRight size={15} strokeWidth={2.5} />
              </button>
            </div>

            {view === "months" && (
              <div className="grid grid-cols-3 gap-1.5">
                {BULAN_PENDEK.map((b, i) => {
                  const isCurrent = i === viewMonth;
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => {
                        setViewMonth(i);
                        setView("days");
                      }}
                      className={`py-2 rounded-xl text-[12px] font-semibold transition cursor-pointer ${
                        isCurrent ? "bg-[#008f5d] text-white" : "text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      {b}
                    </button>
                  );
                })}
              </div>
            )}

            {view === "years" && (
              <div className="grid grid-cols-3 gap-1.5">
                {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map((y) => {
                  const isCurrent = y === viewYear;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        setViewYear(y);
                        setView("months");
                      }}
                      className={`py-2 rounded-xl text-[12px] font-semibold transition cursor-pointer ${
                        isCurrent ? "bg-[#008f5d] text-white" : "text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            )}

            {view === "days" && (
              <>
                <div className="grid grid-cols-7 mb-1.5">
                  {HARI.map((h, i) => (
                    <span key={`${h}-${i}`} className="text-[10px] font-bold text-stone-300 text-center uppercase">
                      {h}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-y-1">
                  {cells.map((cell, i) => {
                    const dateStr = toDateString(cell.y, cell.m, cell.d);
                    const isSelected = value === dateStr;
                    const isToday = todayStr === dateStr;
                    const cellDisabled = isDisabledDate(dateStr);
                    const isTypingDay =
                      !isSelected && cell.inMonth && dayStr.length > 0 && parseInt(dayStr, 10) === cell.d;

                    let cellClasses = "";
                    if (isSelected) {
                      cellClasses = "bg-[#008f5d] text-white font-bold shadow-sm shadow-emerald-900/20";
                    } else if (cellDisabled) {
                      cellClasses = "text-stone-300 cursor-not-allowed";
                    } else if (isTypingDay) {
                      cellClasses = "text-emerald-700 font-bold ring-2 ring-emerald-500 ring-inset hover:bg-emerald-50 cursor-pointer";
                    } else if (isToday) {
                      cellClasses = "text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 cursor-pointer";
                    } else if (cell.inMonth) {
                      cellClasses = "text-stone-700 hover:bg-stone-100 cursor-pointer";
                    } else {
                      cellClasses = "text-stone-300 hover:bg-stone-50 cursor-pointer";
                    }

                    return (
                      <div key={`${cell.y}-${cell.m}-${cell.d}-${i}`} className="flex items-center justify-center">
                        <button
                          type="button"
                          disabled={cellDisabled}
                          onClick={() => {
                            onChange(dateStr);
                            setOpen(false);
                          }}
                          className={`w-8 h-8 text-[12px] rounded-full transition-all flex items-center justify-center ${cellClasses}`}
                        >
                          {cell.d}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={goToday}
                    className="text-[11px] font-semibold text-stone-500 hover:text-emerald-700 transition cursor-pointer"
                  >
                    Hari ini
                  </button>
                  {clearable && value && (
                    <button
                      type="button"
                      onClick={() => {
                        onChange("");
                        setOpen(false);
                      }}
                      className="text-[11px] font-semibold text-stone-400 hover:text-red-600 transition cursor-pointer"
                    >
                      Hapus tanggal
                    </button>
                  )}
                </div>
              </>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
