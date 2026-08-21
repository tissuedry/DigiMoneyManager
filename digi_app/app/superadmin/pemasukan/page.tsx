"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FolderOpen,
  AlertCircle,
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import ProyekPemasukanCard, { ProyekItem } from "@/app/keuangan/pemasukan/ProyekPemasukanCard";
import RealisasiPemasukanModal from "@/app/keuangan/pemasukan/RealisasiPemasukanModal";

export default function PemasukanSuperadminPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [proyekList, setProyekList] = useState<ProyekItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [selectedProyekForRealisasi, setSelectedProyekForRealisasi] = useState<ProyekItem | null>(null);

  const fetchProyek = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/proyek?limit=1000");
      if (!res.ok) throw new Error("Gagal memuat data proyek.");
      const data = await res.json();
      setProyekList(data.projects || []);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data proyek.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProyek();
  }, [fetchProyek]);

  const handleOpenRealisasi = (p: ProyekItem) => {
    setSelectedProyekForRealisasi(p);
  };

  const handleCloseRealisasi = () => {
    setSelectedProyekForRealisasi(null);
  };

  const handleRealisasiSuccess = () => {
    fetchProyek();
  };

  return (
    <div className="flex h-screen w-full bg-[#f9f8f4] text-stone-800 overflow-hidden font-sans">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userRole="Superadmin"
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f6f4f0]">
        <Header
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userRole="Superadmin"
        />

        <main className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 w-full mx-auto space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-stone-900 leading-tight">
                Pemasukan Proyek
              </h1>
              <p className="text-sm text-stone-500 mt-1">
                Pantau target dan realisasi pemasukan per proyek, serta catat realisasi pemasukan secara langsung.
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </span>
              <button
                onClick={fetchProyek}
                className="shrink-0 text-[12px] font-bold px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-100 transition cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Project Cards Grid */}
          {!loading && proyekList.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proyekList.map((p) => (
                <ProyekPemasukanCard
                  key={p.id}
                  proyek={p}
                  onOpenRealisasi={handleOpenRealisasi}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && proyekList.length === 0 && (
            <div className="text-center py-20 text-stone-400 bg-white border border-stone-200/80 rounded-2xl p-8">
              <FolderOpen size={36} className="mx-auto mb-3 opacity-40 text-stone-400" />
              <p className="text-sm font-semibold text-stone-600">
                Belum ada data proyek di sistem.
              </p>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-stone-200 rounded-2xl p-5 h-48"
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {selectedProyekForRealisasi && (
        <RealisasiPemasukanModal
          proyekId={selectedProyekForRealisasi.id}
          proyekNama={selectedProyekForRealisasi.nama}
          onClose={handleCloseRealisasi}
          onRefresh={handleRealisasiSuccess}
        />
      )}
    </div>
  );
}
