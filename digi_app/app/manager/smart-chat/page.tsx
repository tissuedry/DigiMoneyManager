"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Sparkles } from "lucide-react";

type Message = {
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
};

const POPULAR_QUESTIONS = [
  "Berapa sisa budget proyek Cikarang minggu ini?",
  "Tim mana yang paling banyak ajukan reimbursement bulan ini?",
  "Tampilkan 3 proyek dengan margin tertinggi",
  "Pengeluaran terbesar minggu lalu",
];

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br/>");
}

export default function SmartChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Halo COMPIEK. Saya asisten keuangan AI-mu. Tanyakan apa saja seputar arus kas, sisa budget, profitabilitas, atau performa tim. Saya akan jawab dengan data real-time.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: msg, timestamp: new Date() },
    ]);
    setLoading(true);

    try {
      const res = await fetch("/api/smart-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: messages.map((m) => ({ role: m.role, content: m.content }))
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "Maaf, tidak ada respon dari asisten.",
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
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

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <main className="flex-1 flex flex-col p-6 lg:p-8 overflow-hidden">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900 leading-tight">Smart Chat</h1>
        <p className="text-sm text-stone-500 mt-1">
          Tanyakan apa pun seputar keuangan proyek dalam bahasa natural. AI menjawab dengan data real-time.
        </p>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden min-h-0">
          {/* Chat Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100">
            <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center">
              <Bot size={18} className="text-stone-600" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-stone-900">Digi Money Assistant</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-[11px] text-stone-400">Online</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "user"
                      ? "bg-[#2d6a4f] text-white"
                      : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#2d6a4f] text-white rounded-tr-sm"
                      : "bg-stone-100 text-stone-800 rounded-tl-sm"
                  }`}
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                />
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-stone-500" />
                </div>
                <div className="bg-stone-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-stone-400" />
                  <span className="text-[12px] text-stone-400">Sedang memproses...</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Popular Questions */}
          {messages.length <= 1 && (
            <div className="px-5 pb-3">
              <p className="text-[11px] text-stone-400 font-semibold uppercase tracking-wide mb-2">Pertanyaan Populer</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="text-[12px] px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition font-medium cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-stone-100 p-4">
            <div className="flex items-end gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                placeholder="Tanya apa saja... misalnya 'Berapa sisa budget Cikarang?'"
                className="flex-1 resize-none bg-stone-100 rounded-xl px-4 py-3 text-[13px] text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 transition max-h-32 overflow-y-auto"
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="w-10 h-10 bg-[#2d6a4f] hover:bg-[#1e5038] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar — Context */}
        <div className="w-64 shrink-0 space-y-4 hidden lg:flex lg:flex-col">
          {/* Konteks Aktif */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
            <h4 className="text-[12px] font-bold text-stone-500 uppercase tracking-wide mb-3">Konteks Aktif</h4>
            <div className="space-y-2.5">
              {[
                { label: "Periode", value: new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" }) },
                { label: "Proyek", value: "Semua aktif" },
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
              {[
                "Sisa budget per proyek",
                "Pengeluaran terbesar",
                "Profitabilitas & margin",
                "Performa tim",
                "Tren cash flow",
                "Anomali transaksi",
              ].map((item) => (
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
      </div>
    </main>
  );
}
