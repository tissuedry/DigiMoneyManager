"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Send, Loader2, Bot, User, X, Sparkles, MessageCircle, Maximize2, Minimize2, RotateCcw, Copy, Check } from "lucide-react";
import { useApi } from "@/lib/use-api";

type Message = {
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
};

type UserRole = "Karyawan" | "Project Manager" | "Tim Keuangan" | "Direktur / Manajemen";

type UserProfile = {
  nama: string;
  role: string;
};

type Point = { x: number; y: number };
type Anchor = { right: number; bottom: number };
type Size = { width: number; height: number };
type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

// Halaman yang tidak menampilkan widget (belum ada sesi/role yang jelas)
const HIDDEN_PATH_PREFIXES = ["/login", "/register", "/select-project"];

const BTN_SIZE = 56;
const BTN_MARGIN = 20;
const PANEL_MIN_WIDTH = 320;
const PANEL_MIN_HEIGHT = 400;
const DEFAULT_PANEL_SIZE: Size = { width: 380, height: 560 };
const MAXIMIZE_MARGIN = 16; // jarak dari tepi layar saat panel di-maximize

const BTN_POS_STORAGE_KEY = "smart-chat-btn-pos";

const GREETINGS: Record<UserRole, string> = {
  Karyawan:
    "Halo! Saya asisten keuangan AI-mu. Tanyakan status reimbursement, sisa budget proyekmu, atau riwayat pengajuanmu.",
  "Project Manager":
    "Halo! Tanyakan seputar sisa budget, margin, atau pengajuan pending untuk proyek yang kamu kelola.",
  "Tim Keuangan":
    "Halo! Tanyakan seputar pencairan, sisa budget proyek, jurnal akuntansi, atau CoA.",
  "Direktur / Manajemen":
    "Halo. Saya asisten keuangan AI-mu. Tanyakan apa saja seputar arus kas, sisa budget, profitabilitas, atau performa tim.",
};

const POPULAR_QUESTIONS: Record<UserRole, string[]> = {
  Karyawan: [
    "Bagaimana status pengajuan reimbursement terakhir saya?",
    "Berapa total reimbursement saya bulan ini?",
    "Berapa sisa budget proyek saya saat ini?",
  ],
  "Project Manager": [
    "Berapa sisa budget proyek yang saya pegang?",
    "Berapa banyak pengajuan yang masih pending?",
    "Apa pengeluaran terbesar di proyek saya?",
  ],
  "Tim Keuangan": [
    "Berapa banyak reimbursement pending?",
    "Bagaimana status CoA dan jurnal?",
    "Pengeluaran terbesar minggu ini",
  ],
  "Direktur / Manajemen": [
    "Berapa sisa budget proyek Cikarang minggu ini?",
    "Tim mana yang paling banyak ajukan reimbursement bulan ini?",
    "Tampilkan 3 proyek dengan margin tertinggi",
  ],
};

// Label "Proyek" di panel Konteks Aktif — mencerminkan lingkup akses data role masing-masing
const SCOPE_LABEL: Record<UserRole, string> = {
  Karyawan: "Proyek aktif Anda",
  "Project Manager": "Proyek yang Anda kelola",
  "Tim Keuangan": "Semua proyek",
  "Direktur / Manajemen": "Semua proyek",
};

// "Yang Bisa Ditanyakan" per role — disesuaikan dengan data yang benar-benar bisa diakses masing-masing role
const SCOPE_TOPICS: Record<UserRole, string[]> = {
  Karyawan: [
    "Sisa budget proyek aktif Anda",
    "Riwayat reimbursement Anda",
    "Status pengajuan terbaru",
  ],
  "Project Manager": [
    "Sisa budget & margin proyek yang dikelola",
    "Pengajuan pending di proyek Anda",
    "Realisasi Anggaran & Pengajuan Anggaran",
    "Susunan tim proyek",
  ],
  "Tim Keuangan": [
    "Sisa budget semua proyek",
    "Realisasi Anggaran & reimbursement",
    "Chart of Accounts & jurnal akuntansi",
    "Pengeluaran terbesar",
  ],
  "Direktur / Manajemen": [
    "Sisa budget & margin semua proyek",
    "Realisasi Anggaran & Pengajuan Anggaran",
    "Susunan tim seluruh proyek",
    "Chart of Accounts & jurnal akuntansi",
  ],
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function applyInlineMarkdown(text: string): string {
  const safe = escapeHtml(text);
  return safe
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

// Render list markdown ("- item" / "1. item") jadi <ul>/<ol> beneran, bukan sekadar tanda pisah mentah,
// karena jawaban AI sering berbentuk daftar (mis. "Sisa budget:\n- Proyek A...\n- Proyek B...").
function formatMarkdown(text: string): string {
  const lines = text.split("\n");
  let html = "";
  let listBuffer: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let needsBreakBeforeNext = false;

  const flushList = () => {
    if (listBuffer.length > 0 && listType) {
      const listClass = listType === "ul" ? "list-disc pl-4 space-y-0.5 my-1" : "list-decimal pl-4 space-y-0.5 my-1";
      html += `<${listType} class="${listClass}">${listBuffer.map((li) => `<li>${li}</li>`).join("")}</${listType}>`;
      needsBreakBeforeNext = false;
    }
    listBuffer = [];
    listType = null;
  };

  for (const rawLine of lines) {
    const bulletMatch = rawLine.match(/^\s*[-*]\s+(.+)$/);
    const numberedMatch = rawLine.match(/^\s*\d+[.)]\s+(.+)$/);

    if (bulletMatch) {
      if (listType !== "ul") flushList();
      listType = "ul";
      listBuffer.push(applyInlineMarkdown(bulletMatch[1]));
      continue;
    }
    if (numberedMatch) {
      if (listType !== "ol") flushList();
      listType = "ol";
      listBuffer.push(applyInlineMarkdown(numberedMatch[1]));
      continue;
    }

    flushList();
    if (needsBreakBeforeNext) html += "<br/>";
    html += applyInlineMarkdown(rawLine);
    needsBreakBeforeNext = true;
  }
  flushList();

  return html;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function HeaderIconButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className="p-1.5 hover:bg-stone-200/60 rounded-lg text-stone-500 hover:text-stone-800 transition cursor-pointer"
        aria-label={label}
      >
        {children}
      </button>
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-max max-w-[130px] text-center rounded-md bg-stone-800 px-2 py-1 text-[10px] font-medium leading-tight text-white opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 z-20">
        {label}
      </span>
    </div>
  );
}

// Posisi & kursor tiap gagang resize (8 arah: 4 sisi + 4 sudut), diberi affordance visual sendiri
// (bar/dot yang muncul saat hover) alih-alih mengandalkan resize bawaan browser yang tak terlihat.
const RESIZE_HANDLES: { dir: ResizeDir; className: string; cursor: string; corner: boolean }[] = [
  { dir: "n", className: "top-0 left-3 right-3 h-2", cursor: "ns-resize", corner: false },
  { dir: "s", className: "bottom-0 left-3 right-3 h-2", cursor: "ns-resize", corner: false },
  { dir: "e", className: "right-0 top-3 bottom-3 w-2", cursor: "ew-resize", corner: false },
  { dir: "w", className: "left-0 top-3 bottom-3 w-2", cursor: "ew-resize", corner: false },
  { dir: "ne", className: "top-0 right-0 w-4 h-4", cursor: "nesw-resize", corner: true },
  { dir: "nw", className: "top-0 left-0 w-4 h-4", cursor: "nwse-resize", corner: true },
  { dir: "se", className: "bottom-0 right-0 w-4 h-4", cursor: "nwse-resize", corner: true },
  { dir: "sw", className: "bottom-0 left-0 w-4 h-4", cursor: "nesw-resize", corner: true },
];

function ResizeHandle({
  dir,
  className,
  cursor,
  corner,
  onPointerDown,
}: {
  dir: ResizeDir;
  className: string;
  cursor: string;
  corner: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>, dir: ResizeDir) => void;
}) {
  return (
    <div
      onPointerDown={(e) => onPointerDown(e, dir)}
      className={`group/resize absolute z-30 ${className}`}
      style={{ cursor }}
    >
      {corner ? (
        <span className="absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-[#2d6a4f] opacity-0 group-hover/resize:opacity-70 transition-opacity" />
      ) : (
        <span
          className={`absolute bg-[#2d6a4f] rounded-full opacity-0 group-hover/resize:opacity-60 transition-opacity ${
            dir === "n" || dir === "s"
              ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-1"
              : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8"
          }`}
        />
      )}
    </div>
  );
}

function defaultBtnPos(): Point {
  if (typeof window === "undefined") return { x: 0, y: 0 };
  return {
    x: window.innerWidth - BTN_SIZE - BTN_MARGIN,
    y: window.innerHeight - BTN_SIZE - BTN_MARGIN,
  };
}

export default function SmartChatWidget() {
  const pathname = usePathname();
  const isHiddenPath = HIDDEN_PATH_PREFIXES.some((p) => pathname?.startsWith(p));

  const { data } = useApi<{ user: UserProfile }>(isHiddenPath ? null : "/api/auth/me");
  const profile = data?.user ?? null;
  const role = (profile?.role as UserRole) || null;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  // Posisi bulatan (bisa digeser) & ukuran panel chat (toggle normal/perbesar seperti aplikasi desktop)
  const [btnPos, setBtnPos] = useState<Point>({ x: 0, y: 0 });
  const [panelAnchor, setPanelAnchor] = useState<Anchor>({ right: BTN_MARGIN, bottom: BTN_MARGIN });
  const [panelSize, setPanelSize] = useState<Size>(DEFAULT_PANEL_SIZE);
  const [isMaximized, setIsMaximized] = useState(false);
  const dragMovedRef = useRef(false);
  const preMaximizeAnchorRef = useRef<Anchor>({ right: BTN_MARGIN, bottom: BTN_MARGIN });

  // Muat posisi bulatan tersimpan (kalau ada) saat pertama kali mount di client
  useEffect(() => {
    const savedBtn = localStorage.getItem(BTN_POS_STORAGE_KEY);
    if (savedBtn) {
      try {
        const parsed = JSON.parse(savedBtn) as Point;
        setBtnPos({
          x: clamp(parsed.x, 0, window.innerWidth - BTN_SIZE),
          y: clamp(parsed.y, 0, window.innerHeight - BTN_SIZE),
        });
      } catch {
        setBtnPos(defaultBtnPos());
      }
    } else {
      setBtnPos(defaultBtnPos());
    }
  }, []);

  // Jaga supaya widget tidak keluar layar kalau ukuran jendela browser berubah
  useEffect(() => {
    const handleWindowResize = () => {
      setBtnPos((p) => ({
        x: clamp(p.x, 0, window.innerWidth - BTN_SIZE),
        y: clamp(p.y, 0, window.innerHeight - BTN_SIZE),
      }));
      setPanelAnchor((p) => ({
        right: clamp(p.right, 0, Math.max(0, window.innerWidth - panelSize.width)),
        bottom: clamp(p.bottom, 0, Math.max(0, window.innerHeight - panelSize.height)),
      }));
    };
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [panelSize]);

  // Auto-scroll ke bawah HANYA kalau user memang sedang di dekat bawah — supaya tidak "menyeret" user
  // yang sengaja scroll ke atas membaca riwayat chat setiap kali ada pesan baru.
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Kembalikan tinggi textarea ke satu baris setiap kali input dikosongkan (mis. setelah pesan terkirim)
  useEffect(() => {
    if (input === "" && textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input]);

  // Fokus otomatis ke kotak input begitu panel dibuka
  useEffect(() => {
    if (isOpen) textareaRef.current?.focus();
  }, [isOpen]);

  // Tombol Esc menutup panel, seperti kebiasaan umum di aplikasi desktop
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  if (isHiddenPath || !role) return null;

  const ensureGreeting = () => {
    if (messages === null) {
      setMessages([
        { role: "assistant", content: GREETINGS[role], timestamp: new Date() },
      ]);
    }
  };

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    // Mengirim pesan sendiri selalu berarti user ingin melihat balasannya — paksa scroll ke bawah
    shouldAutoScrollRef.current = true;
    ensureGreeting();
    setInput("");
    setMessages((prev) => [
      ...(prev ?? []),
      { role: "user", content: msg, timestamp: new Date() },
    ]);
    setLoading(true);

    try {
      const res = await fetch("/api/smart-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: (messages ?? []).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const responseData = await res.json();
      setMessages((prev) => [
        ...(prev ?? []),
        {
          role: "assistant",
          content: responseData.reply || "Maaf, tidak ada respon dari asisten.",
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...(prev ?? []),
        {
          role: "assistant",
          content: "Terjadi kesalahan koneksi. Silakan coba lagi.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Lacak apakah user sedang berada dekat bagian bawah daftar pesan, untuk auto-scroll yang lebih pintar
  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 80;
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex((cur) => (cur === index ? null : cur)), 1500);
    } catch {
      // Clipboard API tidak tersedia (mis. konteks tidak aman) — abaikan secara senyap
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Textarea tumbuh otomatis mengikuti banyaknya baris, dibatasi max-h-24 (96px) lewat CSS
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
  };

  // Geser bulatan Smart Chat (drag)
  const handleBtnPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = btnPos;
    dragMovedRef.current = false;
    let latest = startPos;

    const handleMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMovedRef.current = true;
      latest = {
        x: clamp(startPos.x + dx, 0, window.innerWidth - BTN_SIZE),
        y: clamp(startPos.y + dy, 0, window.innerHeight - BTN_SIZE),
      };
      setBtnPos(latest);
    };
    const handleUp = () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
      localStorage.setItem(BTN_POS_STORAGE_KEY, JSON.stringify(latest));
    };
    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
  };

  // Perbesar (menutupi hampir seluruh layar) / kembalikan ukuran panel chat — seperti tombol maximize/restore di aplikasi desktop
  const handleToggleMaximize = () => {
    if (!isMaximized) {
      preMaximizeAnchorRef.current = panelAnchor;
      setPanelSize({
        width: Math.max(window.innerWidth - MAXIMIZE_MARGIN * 2, PANEL_MIN_WIDTH),
        height: Math.max(window.innerHeight - MAXIMIZE_MARGIN * 2, PANEL_MIN_HEIGHT),
      });
      setPanelAnchor({ right: MAXIMIZE_MARGIN, bottom: MAXIMIZE_MARGIN });
      setIsMaximized(true);
    } else {
      const restoredAnchor = preMaximizeAnchorRef.current;
      setPanelSize(DEFAULT_PANEL_SIZE);
      setPanelAnchor({
        right: clamp(restoredAnchor.right, 0, Math.max(0, window.innerWidth - DEFAULT_PANEL_SIZE.width)),
        bottom: clamp(restoredAnchor.bottom, 0, Math.max(0, window.innerHeight - DEFAULT_PANEL_SIZE.height)),
      });
      setIsMaximized(false);
    }
  };

  // Resize bebas dari 8 arah (4 sisi + 4 sudut). Tepi yang TIDAK sedang diseret harus tetap diam,
  // jadi hitung dulu posisi absolut tiap tepi di layar, lalu jaga tepi yang diam tetap konstan.
  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>, dir: ResizeDir) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsMaximized(false);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = panelSize.width;
    const startHeight = panelSize.height;
    const startRight = panelAnchor.right;
    const startBottom = panelAnchor.bottom;

    const rightFixedX = window.innerWidth - startRight;
    const leftFixedX = window.innerWidth - startRight - startWidth;
    const bottomFixedY = window.innerHeight - startBottom;
    const topFixedY = window.innerHeight - startBottom - startHeight;

    const movesEast = dir.includes("e");
    const movesWest = dir.includes("w");
    const movesSouth = dir.includes("s");
    const movesNorth = dir.includes("n");

    const handleMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      let width = startWidth;
      let right = startRight;
      if (movesEast) {
        const newRightEdgeX = clamp(rightFixedX + dx, leftFixedX + PANEL_MIN_WIDTH, window.innerWidth);
        width = newRightEdgeX - leftFixedX;
        right = window.innerWidth - newRightEdgeX;
      } else if (movesWest) {
        const newLeftEdgeX = clamp(leftFixedX + dx, 0, rightFixedX - PANEL_MIN_WIDTH);
        width = rightFixedX - newLeftEdgeX;
      }

      let height = startHeight;
      let bottom = startBottom;
      if (movesSouth) {
        const newBottomEdgeY = clamp(bottomFixedY + dy, topFixedY + PANEL_MIN_HEIGHT, window.innerHeight);
        height = newBottomEdgeY - topFixedY;
        bottom = window.innerHeight - newBottomEdgeY;
      } else if (movesNorth) {
        const newTopEdgeY = clamp(topFixedY + dy, 0, bottomFixedY - PANEL_MIN_HEIGHT);
        height = bottomFixedY - newTopEdgeY;
      }

      setPanelSize({ width, height });
      setPanelAnchor({ right, bottom });
    };
    const handleUp = () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
    };
    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
  };

  // Kembalikan bulatan & panel chat ke posisi dan ukuran semula
  const handleReset = () => {
    const pos = defaultBtnPos();
    setBtnPos(pos);
    setPanelAnchor({ right: BTN_MARGIN, bottom: BTN_MARGIN });
    setPanelSize(DEFAULT_PANEL_SIZE);
    setIsMaximized(false);
    localStorage.setItem(BTN_POS_STORAGE_KEY, JSON.stringify(pos));
  };

  const handleOpen = () => {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }

    // Buka panel di dekat posisi bulatan saat ini, dipastikan tetap sepenuhnya terlihat di layar
    const btnRight = window.innerWidth - btnPos.x - BTN_SIZE;
    const btnBottom = window.innerHeight - btnPos.y - BTN_SIZE;
    setPanelAnchor({
      right: clamp(btnRight, 0, Math.max(0, window.innerWidth - panelSize.width)),
      bottom: clamp(btnBottom, 0, Math.max(0, window.innerHeight - panelSize.height)),
    });
    setIsOpen(true);
    ensureGreeting();
  };

  const displayMessages = messages ?? [];

  if (isOpen) {
    return (
      <div
        className="fixed z-50 bg-white rounded-2xl border border-stone-200 shadow-2xl flex overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200 transition-[width,height,right,bottom] ease-in-out"
        style={{
          right: panelAnchor.right,
          bottom: panelAnchor.bottom,
          width: panelSize.width,
          height: panelSize.height,
          maxWidth: "calc(100vw - 16px)",
          maxHeight: "calc(100vh - 16px)",
        }}
      >
      {RESIZE_HANDLES.map((h) => (
        <ResizeHandle
          key={h.dir}
          dir={h.dir}
          className={h.className}
          cursor={h.cursor}
          corner={h.corner}
          onPointerDown={handleResizePointerDown}
        />
      ))}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-stone-100 bg-[#f9f8f4] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#2d6a4f]/10 flex items-center justify-center shrink-0">
              <Bot size={18} className="text-[#2d6a4f]" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-stone-900 truncate">Digi Money Assistant</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                <span className="text-[11px] text-stone-400 truncate">{role}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <HeaderIconButton onClick={handleReset} label="Reset posisi & ukuran">
              <RotateCcw size={14} />
            </HeaderIconButton>
            <HeaderIconButton onClick={handleToggleMaximize} label={isMaximized ? "Kembalikan ukuran" : "Perbesar"}>
              {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </HeaderIconButton>
            <HeaderIconButton onClick={() => setIsOpen(false)} label="Tutup">
              <X size={16} />
            </HeaderIconButton>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          onScroll={handleMessagesScroll}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0"
        >
          {displayMessages.map((msg, i) => (
            <div
              key={i}
              className={`group/msg flex gap-2.5 animate-in fade-in slide-in-from-bottom-1 duration-200 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === "user"
                    ? "bg-[#2d6a4f] text-white"
                    : "bg-stone-100 text-stone-500"
                }`}
              >
                {msg.role === "user" ? <User size={12} /> : <Bot size={12} />}
              </div>
              <div className={`flex flex-col max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#2d6a4f] text-white rounded-tr-sm"
                      : "bg-stone-100 text-stone-800 rounded-tl-sm"
                  }`}
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                />
                <div className="flex items-center gap-1.5 mt-1 px-1">
                  <span className="text-[10px] text-stone-400">{formatTime(msg.timestamp)}</span>
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => handleCopy(msg.content, i)}
                      className="opacity-0 group-hover/msg:opacity-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
                      aria-label="Salin balasan"
                    >
                      {copiedIndex === i ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                <Bot size={12} className="text-stone-500" />
              </div>
              <div className="bg-stone-100 rounded-2xl rounded-tl-sm px-3.5 py-2.5 flex items-center gap-2">
                <Loader2 size={13} className="animate-spin text-stone-400" />
                <span className="text-[11px] text-stone-400">Sedang memproses...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Popular Questions */}
        {displayMessages.length <= 1 && (
          <div className="px-4 pb-2.5 shrink-0">
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_QUESTIONS[role].map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="text-[11px] px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition font-medium cursor-pointer text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-stone-100 p-3 shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKey}
              rows={1}
              placeholder="Tanya apa saja..."
              className="flex-1 resize-none bg-stone-100 rounded-xl px-3.5 py-2.5 text-[12.5px] text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 transition max-h-24 overflow-y-auto"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-9 h-9 bg-[#2d6a4f] hover:bg-[#1e5038] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition cursor-pointer shrink-0"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

        {/* Panel info tambahan — sama seperti dulu saat Smart Chat masih halaman penuh, muncul saat di-maximize */}
        {isMaximized && (
          <div className="hidden lg:flex w-64 shrink-0 flex-col gap-4 border-l border-stone-100 bg-stone-50 p-5 overflow-y-auto">
            {/* Konteks Aktif */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
              <h4 className="text-[12px] font-bold text-stone-500 uppercase tracking-wide mb-3">Konteks Aktif</h4>
              <div className="space-y-2.5">
                {[
                  { label: "Periode", value: new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" }) },
                  { label: "Proyek", value: SCOPE_LABEL[role] },
                  { label: "Model", value: "Llama 3.1 (GROQ)" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-[12px]">
                    <span className="text-stone-400 font-medium">{label}</span>
                    <span className="text-stone-800 font-semibold text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Yang Bisa Ditanyakan */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
              <h4 className="text-[12px] font-bold text-stone-500 uppercase tracking-wide mb-3">Yang Bisa Ditanyakan</h4>
              <ul className="space-y-2">
                {SCOPE_TOPICS[role].map((item) => (
                  <li
                    key={item}
                    onClick={() => sendMessage(item)}
                    className="text-[12px] text-stone-600 flex items-center gap-2 cursor-pointer hover:text-stone-900 transition"
                  >
                    <span className="w-1 h-1 bg-stone-300 rounded-full shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* AI Badge */}
            <div className="bg-[#f0faf5] border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
              <Sparkles size={16} className="text-emerald-600 shrink-0" />
              <p className="text-[11px] text-emerald-700 font-medium leading-snug">
                Didukung GROQ Cloud dengan data real-time dari database
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onPointerDown={handleBtnPointerDown}
      onClick={handleOpen}
      className="group fixed z-50 w-14 h-14 rounded-full bg-[#2d6a4f] hover:bg-[#1e5038] text-white shadow-xl flex items-center justify-center transition cursor-grab active:cursor-grabbing"
      style={{ left: btnPos.x, top: btnPos.y, touchAction: "none" }}
      aria-label="Buka Smart Chat (bisa digeser)"
    >
      <MessageCircle size={24} />
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center border-2 border-white pointer-events-none">
        <Sparkles size={10} className="text-white" />
      </span>
      <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-800 px-2 py-1 text-[10px] font-medium text-white opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150">
        Klik untuk buka • seret untuk pindah
      </span>
    </button>
  );
}
