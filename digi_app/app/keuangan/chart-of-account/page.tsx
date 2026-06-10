'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';

// Inisialisasi konfigurasi font Plus Jakarta Sans
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export default function ChartOfAccountPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const filterTabs = ['Semua', 'Aset', 'Liabilitas', 'Ekuitas', 'Pendapatan', 'Beban'];

  useEffect(() => {
    fetch('/api/coa')
      .then((res) => res.json())
      .then((data) => {
        if (data.coa) {
          setAccounts(data.coa);
        }
      })
      .catch((err) => console.error("Error fetching CoA:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const getNormalizedTipe = (tipe: string) => {
    const t = tipe.toLowerCase();
    if (t === 'asset' || t === 'aset') return 'Aset';
    if (t === 'liability' || t === 'liabilitas') return 'Liabilitas';
    if (t === 'equity' || t === 'ekuitas') return 'Ekuitas';
    if (t === 'revenue' || t === 'pendapatan') return 'Pendapatan';
    if (t === 'expense' || t === 'beban') return 'Beban';
    return tipe;
  };

  const getSaldoNormal = (tipe: string) => {
    const norm = getNormalizedTipe(tipe);
    if (norm === 'Aset' || norm === 'Beban') return 'Debit';
    return 'Kredit';
  };

  // Memastikan filter berjalan sinkron antara tab aktif dan kata kunci pencarian
  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const normTipe = getNormalizedTipe(account.tipe);
      const matchesTab = selectedTab === 'Semua' || normTipe === selectedTab;
      const matchesSearch = 
        account.nomorAkun.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.namaAkun.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [accounts, selectedTab, searchQuery]);

  const getBadgeStyles = (tipe: string) => {
    const norm = getNormalizedTipe(tipe);
    switch (norm) {
      case 'Aset': return { bg: 'bg-[#EEF6F2]', text: 'text-[#005836]' };
      case 'Liabilitas': return { bg: 'bg-[#FDF3F2]', text: 'text-[#902F33]' };
      case 'Ekuitas': return { bg: 'bg-[#E9E8F4]', text: 'text-[#483E90]' };
      case 'Pendapatan': return { bg: 'bg-[#F0F7FB]', text: 'text-[#005D8D]' };
      case 'Beban': return { bg: 'bg-[#FCF7F0]', text: 'text-[#894C06]' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-800' };
    }
  };

  return (
    <div className={`flex min-h-screen w-full bg-[#F6F4EF] overflow-hidden`}>
      
      {/* Sidebar Keuangan Kelompok */}
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        userRole='Tim Keuangan'
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        
        {/* Header Keuangan Kelompok */}
        <Header />
        
        <div className="w-full h-0 border-b border-[#E6E1D4]"></div>

        <main className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
          
          {/* Title Section */}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-[#14130F]">Chart of Accounts</h1>
            <p className="text-sm text-[#6A6660]">
              Daftar akun yang menjadi referensi seluruh jurnal sistem. Sesuai standar PSAK / IFRS.
            </p>
          </div>

          {/* Action Bar (Filters, Search, Buttons) */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Filter Tabs - Fokus visual diperbaiki dengan latar belakang putih kontras */}
            <div className="p-1 bg-[#F1EEE6] rounded-xl border border-[#E6E1D4] inline-flex items-center gap-1 overflow-x-auto z-10 relative">
              {filterTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSelectedTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                    selectedTab === tab
                      ? 'bg-white text-[#14130F] shadow-sm font-semibold border border-[#E4E0D9]/40'
                      : 'text-[#6A6660] hover:text-[#14130F] hover:bg-white/20'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Input & Action Buttons */}
            <div className="flex items-center gap-3 self-end lg:self-auto w-full lg:w-auto justify-end">
              <input
                type="text"
                placeholder="Cari kode atau nama akun..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 bg-white border border-[#E4E0D9] rounded-xl text-sm text-[#14130F] placeholder-[#9A948B] focus:outline-none focus:ring-2 focus:ring-[#009162] w-full max-w-xs transition-all"
              />
              
              <button 
                type="button"
                className="h-10 px-4 bg-white border border-[#E4E0D9] rounded-xl text-sm font-medium text-[#14130F] hover:bg-gray-50 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Import</span>
              </button>

              <button 
                type="button"
                className="h-10 px-4 bg-[#009162] hover:bg-[#00734D] active:bg-[#005836] text-white text-sm font-medium rounded-xl flex items-center gap-2 transition-all shadow-sm whitespace-nowrap cursor-pointer"
              >
                <span>+ Tambah Akun</span>
              </button>
            </div>

          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-[#E4E0D9] shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[#F1EEE6] border-b border-[#E6E1D4] text-xs font-semibold text-[#9A948B] uppercase tracking-wider">
                    <th className="px-6 py-4 w-1/6">Nomor Akun</th>
                    <th className="px-6 py-4 w-2/5">Nama Akun</th>
                    <th className="px-6 py-4 w-1/6">Tipe</th>
                    <th className="px-6 py-4 w-1/6">Standar</th>
                    <th className="px-6 py-4 w-1/6 text-right">Saldo Normal</th>
                    <th className="px-6 py-4 w-12 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E1D4] text-sm text-[#14130F]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-[#9A948B]">
                        Memuat data Chart of Accounts...
                      </td>
                    </tr>
                  ) : filteredAccounts.length > 0 ? (
                    filteredAccounts.map((account, index) => {
                      const badge = getBadgeStyles(account.tipe);
                      const normTipe = getNormalizedTipe(account.tipe);
                      const saldoNormal = getSaldoNormal(account.tipe);
                      return (
                        <tr key={`${account.nomorAkun}-${index}`} className="hover:bg-[#FDFDFD] transition-colors duration-150">
                          <td className="px-6 py-4 font-mono font-medium text-gray-900 tracking-wide">
                            {account.nomorAkun}
                          </td>
                          <td className="px-6 py-4 font-medium">
                            {account.namaAkun}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${badge.bg} ${badge.text}`}>
                              {normTipe}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {account.standar}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-gray-700">
                            {saldoNormal}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              type="button"
                              className="w-8 h-8 rounded-lg border border-[#E4E0D9] hover:bg-gray-50 inline-flex items-center justify-center gap-0.5 transition-all cursor-pointer"
                              title="Menu Opsi"
                            >
                              <span className="w-1 h-1 rounded-full bg-[#14130F]"></span>
                              <span className="w-1 h-1 rounded-full bg-[#14130F]"></span>
                              <span className="w-1 h-1 rounded-full bg-[#14130F]"></span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-[#9A948B]">
                        Tidak ada pos akun yang cocok dengan pencarian atau filter aktif Anda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}