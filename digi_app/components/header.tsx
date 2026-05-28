import React from "react";
import { Bell } from "lucide-react";

export default function Header() {
  return (
    // Menggunakan bg-[#eeeae1] (krem hangat yang sedikit lebih deep/gelap dibanding sebelumnya)
    // Border menggunakan #dfd9cc agar garis pembatasnya terlihat tegas
    <header className="h-16 border-b border-[#dfd9cc] bg-[#eeeae1] flex items-center justify-end px-8 gap-6 shrink-0">
      
      {/* Tombol Notifikasi Bell */}
      <button className="relative p-1 text-stone-600 hover:text-stone-900 transition">
        <Bell size={20} className="stroke-[2]" />
        {/* Badge angka notifikasi merah bata gelap */}
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#8c2e2e] text-white text-[9px] flex items-center justify-center rounded-full font-bold shadow-sm">
          3
        </span>
      </button>
      
      {/* Profil Pengguna */}
      <div className="flex items-center gap-3 border-l pl-6 border-[#dfd9cc]">
        {/* Avatar Inisial - Hijau Tua Khas Elemen Aktif Digi Money */}
        <div className="w-8 h-8 rounded-full bg-[#005c3e] flex items-center justify-center text-xs font-bold text-white shadow-sm">
          MZ
        </div>
        
        {/* Identitas Nama */}
        <div className="flex flex-col text-left">
          <span className="text-sm font-bold text-stone-900 leading-none">
            Muhammad Zaini
          </span>
          <span className="text-[11px] text-stone-600 mt-1 font-medium">
            Tim Keuangan
          </span>
        </div>
      </div>
      
    </header>
  );
}