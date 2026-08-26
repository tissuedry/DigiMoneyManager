"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Check,
  AlertCircle,
  FolderOpen,
  FileSpreadsheet,
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import Pagination from "@/components/pagination";
import { useApi } from "@/lib/use-api";
import ProyekCard from "./ProyekCard";
import BudgetSkeleton from "./BudgetSkeleton";
import type { Proyek } from "./types";

const LaporanTahunanModal = dynamic(() => import("./LaporanTahunanModal"), {
  ssr: false,
});

const LIMIT = 4;
const PROYEK_STATUSES = ["Semua", "Planning", "Active", "Done", "Canceled"];
const STATUS_MAP: Record<string, string[]> = {
  Semua: [],
  Planning: ["PLANNING"],
  Active: ["AKTIF"],
  Done: ["DONE"],
  Canceled: ["CANCELED"],
};

export default function KeuanganBudgetPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const [isLaporanModalOpen, setIsLaporanModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"none" | "has">("has");
  const [activeStatus, setActiveStatus] = useState("Semua");
  const [pageNoBudget, setPageNoBudget] = useState(1);
  const [pageHasBudget, setPageHasBudget] = useState(1);

  const hasQuery = useApi<any>(`/api/proyek?limit=${LIMIT}&budgetStatus=has&page=${pageHasBudget}`);
  const noneQuery = useApi<any>(`/api/proyek?limit=${LIMIT}&budgetStatus=none&page=${pageNoBudget}`);

  const isFiltering = activeStatus !== "Semua";
  const allHasQuery = useApi<any>("/api/proyek?limit=1000&budgetStatus=has", { enabled: isFiltering });
  const allNoneQuery = useApi<any>("/api/proyek?limit=1000&budgetStatus=none", { enabled: isFiltering });

  const loading =
    hasQuery.isLoading ||
    noneQuery.isLoading ||
    (isFiltering && (allHasQuery.isLoading || allNoneQuery.isLoading));
  const error = hasQuery.error || noneQuery.error || allHasQuery.error || allNoneQuery.error;
  const retry = () => {
    hasQuery.refetch();
    noneQuery.refetch();
    allHasQuery.refetch();
    allNoneQuery.refetch();
  };

  const hasBudgetList: Proyek[] = hasQuery.data?.projects ?? [];
  const hasBudgetTotal: number = hasQuery.data?.pagination?.totalItems ?? 0;
  const noBudgetList: Proyek[] = noneQuery.data?.projects ?? [];
  const noBudgetTotal: number = noneQuery.data?.pagination?.totalItems ?? 0;
  const hasBudgetAll: Proyek[] = allHasQuery.data?.projects ?? [];
  const noBudgetAll: Proyek[] = allNoneQuery.data?.projects ?? [];

  useEffect(() => {
    setPageNoBudget(1);
    setPageHasBudget(1);
  }, [activeStatus]);

  const switchTab = (tab: "none" | "has") => {
    setActiveTab(tab);
    if (tab === "none") setPageNoBudget(1);
    else setPageHasBudget(1);
  };

  const totalProjects = noBudgetTotal + hasBudgetTotal;

  const activeTabAll = activeTab === "has" ? hasBudgetAll : noBudgetAll;
  const activeTabList = activeTab === "has" ? hasBudgetList : noBudgetList;
  const activeTabTotal = activeTab === "has" ? hasBudgetTotal : noBudgetTotal;

  let activeTotal: number;
  let activeList: Proyek[];
  if (isFiltering) {
    const filtered = activeTabAll.filter(
      (p) => STATUS_MAP[activeStatus].includes(p.status)
    );
    activeTotal = filtered.length;
    activeList = filtered.slice(
      ((activeTab === "has" ? pageHasBudget : pageNoBudget) - 1) * LIMIT,
      (activeTab === "has" ? pageHasBudget : pageNoBudget) * LIMIT
    );
  } else {
    activeTotal = activeTabTotal;
    activeList = activeTabList;
  }
  const activePages = Math.ceil(activeTotal / LIMIT);
  const setActivePage = activeTab === "has" ? setPageHasBudget : setPageNoBudget;

  return (
    <div className="flex h-screen w-full bg-[#f9f8f4] text-stone-800 overflow-hidden">
      <Sidebar isSidebarOpen={isSidebarOpen} onClose={closeSidebar} userRole="Tim Keuangan" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onOpenSidebar={openSidebar} userRole="Tim Keuangan" />

        <main className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 w-full mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Laporan Anggaran Proyek</h1>
              <p className="text-sm text-stone-500 mt-1">
                Pantau realisasi anggaran per proyek dan pos anggaran, lalu unduh laporannya dalam format Excel.
              </p>
            </div>

            <button
              onClick={() => setIsLaporanModalOpen(true)}
              className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-stone-200 hover:border-[#2d6a4f] hover:text-[#2d6a4f] text-stone-700 text-[13px] font-bold rounded-xl shadow-sm transition cursor-pointer"
            >
              <FileSpreadsheet size={16} />
              Buat Laporan Tahunan
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <AlertCircle size={16} />
                {error.message}
              </span>
              <button
                onClick={retry}
                className="shrink-0 text-[12px] font-bold px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-100 transition cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {!loading && (
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-1.5 p-1 bg-stone-200/40 rounded-full border border-stone-200/60 w-fit">
                <button
                  onClick={() => switchTab("has")}
                  className={`flex items-center gap-1.5 px-4 py-1.5 text-[13px] rounded-full transition-all duration-200 cursor-pointer ${
                    activeTab === "has"
                      ? "bg-white text-stone-900 font-semibold shadow-sm"
                      : "text-stone-500 font-medium hover:text-stone-700 hover:bg-stone-200/50"
                  }`}
                >
                  <Check size={14} className={activeTab === "has" ? "text-emerald-600" : "text-stone-400"} />
                  Budget Aktif ({hasBudgetTotal})
                </button>
                <button
                  onClick={() => switchTab("none")}
                  className={`flex items-center gap-1.5 px-4 py-1.5 text-[13px] rounded-full transition-all duration-200 cursor-pointer ${
                    activeTab === "none"
                      ? "bg-white text-stone-900 font-semibold shadow-sm"
                      : "text-stone-500 font-medium hover:text-stone-700 hover:bg-stone-200/50"
                  }`}
                >
                  <AlertCircle size={14} className={activeTab === "none" ? "text-amber-600" : "text-stone-400"} />
                  Perlu Diinisialisasi ({noBudgetTotal})
                </button>
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-stone-200/40 rounded-full border border-stone-200/60 w-fit">
                {PROYEK_STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => setActiveStatus(status)}
                    className={`px-4 py-1.5 text-[13px] rounded-full transition-all duration-200 cursor-pointer ${
                      activeStatus === status
                        ? "bg-white text-stone-900 font-semibold shadow-sm"
                        : "text-stone-500 font-medium hover:text-stone-700 hover:bg-stone-200/50"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && activeList.length > 0 && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeList.map((p) => (
                  <ProyekCard key={p.id} proyek={p} />
                ))}
              </div>
              <Pagination
                page={activeTab === "has" ? pageHasBudget : pageNoBudget}
                totalPages={activePages}
                onChange={setActivePage}
              />
            </div>
          )}

          {!loading && totalProjects === 0 && activeStatus === "Semua" && (
            <div className="text-center py-20 text-stone-400">
              <FolderOpen size={36} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">Belum ada proyek di sistem.</p>
            </div>
          )}

          {!loading && activeList.length === 0 && !(totalProjects === 0 && activeStatus === "Semua") && (
            <div className="text-center py-20 text-stone-400">
              <FolderOpen size={36} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">
                Tidak ada proyek dengan status &quot;{activeStatus}&quot; pada halaman ini.
              </p>
            </div>
          )}

          {loading && <BudgetSkeleton />}
        </main>
      </div>

      {isLaporanModalOpen && (
        <LaporanTahunanModal onClose={() => setIsLaporanModalOpen(false)} />
      )}
    </div>
  );
}
