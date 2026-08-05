"use client";

import React, { useState } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";

interface Message {
  id: number;
  sender: "assistant" | "user";
  text: string;
  time: string;
}

const POPULAR_QUESTIONS = [
  "Berapa sisa budget proyek Cikarang minggu ini?",
  "Tim mana yang paling banyak ajukan reimbursement bulan ini?",
  "Tampilkan 3 proyek dengan margin tertinggi",
  "Pengeluaran terbesar minggu lalu",
];

export default function SmartChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "assistant",
      text: "Halo COMPIEK. Saya asisten keuangan AI-mu. Tanyakan apa saja seputar arus kas, sisa budget, profitabilitas, atau performa tim. Saya akan jawab dengan data real-time.",
      time: "Baru saja",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const newUserMessage: Message = {
      id: Date.now(),
      sender: "user",
      text: query,
      time: "Baru saja",
    };

    setMessages((prev) => [...prev, newUserMessage]);
    if (!textToSend) setInputQuery("");

    // Simulasi respons AI
    setTimeout(() => {
      const newAssistantMessage: Message = {
        id: Date.now() + 1,
        sender: "assistant",
        text: `Baik, saya sedang menganalisis data untuk pertanyaan: "${query}". Berdasarkan database real-time saat ini, seluruh laporan keuangan dan alokasi pos anggaran termonitor aman dengan sisa net cash positif.`,
        time: "Baru saja",
      };
      setMessages((prev) => [...prev, newUserMessage, newAssistantMessage]);
    }, 1000);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-full flex flex-col bg-[#f9f8f4]">
      
      {/* Header Halaman */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-[28px] font-bold text-stone-900 leading-tight">Smart Chat</h1>
          <span className="px-2.5 py-0.5 bg-stone-200 text-stone-700 text-[11px] font-bold rounded-md">Direktur</span>
        </div>
        <p className="text-stone-500 mt-1 text-[14px]">
          Tanyakan apa pun seputar keuangan proyek dalam bahasa nasional. AI menjawab dengan data real-time.
        </p>
      </div>

      {/* Layout Grid Utama (Kiri: Chat Area, Kanan: Sidebar Konteks & Bantuan) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        
        {/* Kolom Kiri: Ruang Percakapan Chat (Span 3) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between overflow-hidden">
          
          {/* Chat Box Header Info / Status AI */}
          <div className="px-6 py-4 border-b border-stone-100 bg-[#fdfcf9] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#008f5d] shadow-xs">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-stone-900 leading-tight">Digi Money Assistant</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] text-stone-400 font-medium">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Area Riwayat Pesan */}
          <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[500px]">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex items-start gap-3 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.sender === "user" ? "bg-[#1a1a1a] text-white" : "bg-emerald-50 text-[#008f5d] border border-emerald-100"
                }`}>
                  {msg.sender === "user" ? <User size={14} /> : <Bot size={15} />}
                </div>

                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-xs ${
                  msg.sender === "user" 
                    ? "bg-[#1a1a1a] text-white rounded-tr-none" 
                    : "bg-[#f5f4ef] text-stone-800 rounded-tl-none border border-stone-200/60"
                }`}>
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Kotak Pertanyaan Populer & Input Chat */}
          <div className="p-4 border-t border-stone-100 bg-[#fdfcf9] space-y-3">
            
            {/* Daftar Pertanyaan Populer */}
            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">Pertanyaan Populer</span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_QUESTIONS.map((pq, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(pq)}
                    className="px-3 py-1.5 bg-white border border-stone-200 hover:border-[#008f5d] hover:text-[#008f5d] text-stone-600 rounded-xl text-[11px] font-bold transition shadow-xs cursor-pointer text-left"
                  >
                    {pq}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <div className="relative flex items-center pt-1">
              <input 
                type="text" 
                placeholder="Tanya apa saja... misalnya 'Berapa sisa budget Cikarang?'"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="w-full bg-white border border-stone-200 rounded-2xl pl-4 pr-12 py-3 text-[13px] outline-none focus:border-[#008f5d] transition shadow-xs"
              />
              <button 
                onClick={() => handleSendMessage()}
                className="absolute right-2.5 p-2 bg-[#008f5d] hover:bg-[#007a4f] text-white rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center"
              >
                <Send size={15} />
              </button>
            </div>

          </div>

        </div>

        {/* Kolom Kanan: Panel Samping Konteks & Bantuan (Span 1) */}
        <div className="space-y-5">
          
          {/* Konteks Aktif Card */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-3">
            <h3 className="text-[13px] font-bold text-stone-900 border-b border-stone-100 pb-2.5">KONTEKS AKTIF</h3>
            <div className="space-y-2.5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-stone-400 font-medium">Periode</span>
                <span className="font-bold text-stone-800">Agustus 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400 font-medium">Proyek</span>
                <span className="font-bold text-stone-800">Semua aktif</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400 font-medium">Model</span>
                <span className="font-bold text-[#008f5d]">Llama 3.1 (GROQ)</span>
              </div>
            </div>
          </div>

          {/* Yang Bisa Ditanyakan Card */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-3">
            <h3 className="text-[13px] font-bold text-stone-900 border-b border-stone-100 pb-2.5">YANG BISA DITANYAKAN</h3>
            <ul className="space-y-2 text-[12px] text-stone-600 font-medium list-disc list-inside">
              <li>Sisa budget per proyek</li>
              <li>Pengeluaran terbesar</li>
              <li>Profitabilitas & margin</li>
              <li>Performa tim</li>
              <li>Tren cash flow</li>
              <li>Anomali transaksi</li>
            </ul>
          </div>

          {/* Cloud Status Badge Info */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-start gap-2.5">
            <Sparkles size={16} className="text-[#008f5d] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#117a5b] font-medium leading-relaxed">
              Didukung GROQ Cloud dengan data real-time dari database
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}