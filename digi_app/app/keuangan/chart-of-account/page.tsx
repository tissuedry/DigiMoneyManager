'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';

export default function ChartOfAccountPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State untuk Modal Tambah Akun
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNomorAkun, setNewNomorAkun] = useState('');
  const [newNamaAkun, setNewNamaAkun] = useState('');
  const [newTipe, setNewTipe] = useState('Aset');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk Aksi Baris (Edit & Delete)
  const [activeMenuAccountId, setActiveMenuAccountId] = useState<string | null>(null);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [editNomorAkun, setEditNomorAkun] = useState('');
  const [editNamaAkun, setEditNamaAkun] = useState('');
  const [editTipe, setEditTipe] = useState('Aset');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Effect untuk Click Outside menutup menu aksi baris
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (activeMenuAccountId && !target.closest('.coa-actions-menu')) {
        setActiveMenuAccountId(null);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [activeMenuAccountId]);

  const handleEditAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    if (!editingAccount) return;

    if (!editNomorAkun || !editNamaAkun || !editTipe) {
      setErrorMessage('Nomor Akun, Nama Akun, dan Tipe wajib diisi.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/coa/${editingAccount.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nomorAkun: parseInt(editNomorAkun, 10),
          namaAkun: editNamaAkun,
          tipe: getDbTipe(editTipe),
          standar: 'PSAK',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengubah akun.');
      }

      setSuccessMessage('Akun berhasil diubah!');
      
      // Refresh list
      const fetchRes = await fetch('/api/coa');
      const fetchData = await fetchRes.json();
      if (fetchData.coa) {
        setAccounts(fetchData.coa);
      }

      setTimeout(() => {
        setShowEditModal(false);
        setEditingAccount(null);
        setSuccessMessage('');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletingAccount) return;
    setErrorMessage('');
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/coa/${deletingAccount.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal menghapus akun.');
      }

      // Refresh list
      const fetchRes = await fetch('/api/coa');
      const fetchData = await fetchRes.json();
      if (fetchData.coa) {
        setAccounts(fetchData.coa);
      }

      setShowDeleteModal(false);
      setDeletingAccount(null);
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem saat menghapus akun.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getDbTipe = (tipe: string) => {
    const t = tipe.toLowerCase();
    if (t === 'aset' || t === 'asset') return 'Asset';
    if (t === 'liabilitas' || t === 'liability') return 'Liability';
    if (t === 'ekuitas' || t === 'equity') return 'Equity';
    if (t === 'pendapatan' || t === 'revenue') return 'Revenue';
    if (t === 'beban' || t === 'expense') return 'Expense';
    return tipe;
  };

  const getNormalizedTipe = (tipe: string) => {
    const t = tipe.toLowerCase();
    if (t === 'asset' || t === 'aset') return 'Aset';
    if (t === 'liability' || t === 'liabilitas') return 'Liabilitas';
    if (t === 'equity' || t === 'ekuitas') return 'Ekuitas';
    if (t === 'revenue' || t === 'pendapatan') return 'Pendapatan';
    if (t === 'expense' || t === 'beban') return 'Beban';
    return tipe;
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    if (!newNomorAkun || !newNamaAkun || !newTipe) {
      setErrorMessage('Nomor Akun, Nama Akun, dan Tipe wajib diisi.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/coa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nomorAkun: parseInt(newNomorAkun, 10),
          namaAkun: newNamaAkun,
          tipe: getDbTipe(newTipe),
          standar: 'PSAK',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal menambahkan akun.');
      }

      setSuccessMessage('Akun berhasil ditambahkan!');
      setNewNomorAkun('');
      setNewNamaAkun('');
      setNewTipe('Aset');

      // Refresh list
      const fetchRes = await fetch('/api/coa');
      const fetchData = await fetchRes.json();
      if (fetchData.coa) {
        setAccounts(fetchData.coa);
      }

      setTimeout(() => {
        setShowAddModal(false);
        setSuccessMessage('');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) {
          alert("File CSV kosong atau tidak valid.");
          return;
        }

        // Parse header
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        let noAkunIdx = headers.findIndex(h => h.includes('nomor') || h.includes('no') || h.includes('code') || h.includes('number'));
        let namaAkunIdx = headers.findIndex(h => h.includes('nama') || h.includes('name'));
        let tipeIdx = headers.findIndex(h => h.includes('tipe') || h.includes('type'));

        // Fallback ke posisi kolom jika header tidak dikenali
        if (noAkunIdx === -1) noAkunIdx = 0;
        if (namaAkunIdx === -1) namaAkunIdx = 1;
        if (tipeIdx === -1) tipeIdx = 2;

        const parsedAccounts: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Memisahkan kolom dengan koma
          const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
          if (cols.length < 3) continue;

          const rawNo = cols[noAkunIdx];
          const rawNama = cols[namaAkunIdx];
          const rawTipe = cols[tipeIdx];

          const nomorAkun = parseInt(rawNo, 10);
          if (isNaN(nomorAkun) || !rawNama || !rawTipe) continue;

          parsedAccounts.push({
            nomorAkun,
            namaAkun: rawNama,
            tipe: getDbTipe(rawTipe),
            standar: 'PSAK'
          });
        }

        if (parsedAccounts.length === 0) {
          alert("Tidak ditemukan baris akun yang valid dalam file CSV.");
          return;
        }

        setIsLoading(true);
        const res = await fetch('/api/coa', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(parsedAccounts)
        });

        const data = await res.json();
        if (res.ok) {
          alert(`Berhasil mengimpor ${data.createdCount} akun.`);
          
          // Refresh list
          const fetchRes = await fetch('/api/coa');
          const fetchData = await fetchRes.json();
          if (fetchData.coa) {
            setAccounts(fetchData.coa);
          }
        } else {
          alert(`Gagal mengimpor akun: ${data.message}`);
        }
      } catch (err: any) {
        console.error("Error processing CSV:", err);
        alert(`Gagal memproses file CSV: ${err.message}`);
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
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
        String(account.nomorAkun).toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    <div className={`flex h-screen w-full bg-[#F6F4EF] overflow-hidden`}>
      
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

        <main className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 flex flex-col gap-6">
          
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

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleCSVUpload}
                accept=".csv"
                className="hidden"
              />
              
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-10 px-4 bg-white border border-[#E4E0D9] rounded-xl text-sm font-medium text-[#14130F] hover:bg-gray-50 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Import</span>
              </button>

              <button 
                type="button"
                onClick={() => setShowAddModal(true)}
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
                    <th className="px-6 py-4 w-1/5">Nomor Akun</th>
                    <th className="px-6 py-4 w-2/5">Nama Akun</th>
                    <th className="px-6 py-4 w-1/5">Tipe</th>
                    <th className="px-6 py-4 w-1/5 text-right">Saldo Normal</th>
                    <th className="px-6 py-4 w-12 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E1D4] text-sm text-[#14130F]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#9A948B]">
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
                          <td className="px-6 py-4 text-right font-mono text-gray-700">
                            {saldoNormal}
                          </td>
                          <td className="px-6 py-4 text-center relative coa-actions-menu">
                            <button 
                              type="button"
                              onClick={() => {
                                setActiveMenuAccountId(activeMenuAccountId === account.id ? null : account.id);
                              }}
                              className="w-8 h-8 rounded-lg border border-[#E4E0D9] hover:bg-gray-50 inline-flex items-center justify-center gap-0.5 transition-all cursor-pointer"
                              title="Menu Opsi"
                            >
                              <span className="w-1 h-1 rounded-full bg-[#14130F]"></span>
                              <span className="w-1 h-1 rounded-full bg-[#14130F]"></span>
                              <span className="w-1 h-1 rounded-full bg-[#14130F]"></span>
                            </button>

                            {activeMenuAccountId === account.id && (
                              <div className="absolute right-6 mt-1 z-35 w-28 bg-white border border-[#E4E0D9] rounded-xl shadow-lg py-1 flex flex-col">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAccount(account);
                                    setEditNomorAkun(String(account.nomorAkun));
                                    setEditNamaAkun(account.namaAkun);
                                    setEditTipe(normTipe);
                                    setShowEditModal(true);
                                    setActiveMenuAccountId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-stone-700 hover:bg-gray-50 hover:text-[#14130F] flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeletingAccount(account);
                                    setShowDeleteModal(true);
                                    setActiveMenuAccountId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-red-650 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span>Hapus</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#9A948B]">
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

      {/* Modal Tambah Akun */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#F6F4EF] rounded-2xl border border-[#E4E0D9] shadow-xl overflow-hidden p-6 relative">
            <button
              onClick={() => {
                setShowAddModal(false);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-650 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-[#14130F] mb-4">Tambah Akun Baru</h3>

            <form onSubmit={handleAddAccount} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl">
                  {successMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#6A6660] mb-1">Nomor Akun</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 10001"
                  value={newNomorAkun}
                  onChange={(e) => setNewNomorAkun(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E4E0D9] rounded-xl text-sm text-[#14130F] focus:outline-none focus:ring-2 focus:ring-[#009162]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6A6660] mb-1">Nama Akun</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kas Kecil"
                  value={newNamaAkun}
                  onChange={(e) => setNewNamaAkun(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E4E0D9] rounded-xl text-sm text-[#14130F] focus:outline-none focus:ring-2 focus:ring-[#009162]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6A6660] mb-1">Tipe Akun</label>
                <select
                  value={newTipe}
                  onChange={(e) => setNewTipe(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E4E0D9] rounded-xl text-sm text-[#14130F] focus:outline-none focus:ring-2 focus:ring-[#009162] appearance-none"
                >
                  <option value="Aset">Aset</option>
                  <option value="Liabilitas">Liabilitas</option>
                  <option value="Ekuitas">Ekuitas</option>
                  <option value="Pendapatan">Pendapatan</option>
                  <option value="Beban">Beban</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E6E1D4]">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="px-4 py-2 border border-[#E4E0D9] hover:bg-gray-50 text-sm font-semibold rounded-xl text-[#6A6660] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#009162] hover:bg-[#00734D] disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Akun */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#F6F4EF] rounded-2xl border border-[#E4E0D9] shadow-xl overflow-hidden p-6 relative">
            <button
              onClick={() => {
                setShowEditModal(false);
                setEditingAccount(null);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-650 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-[#14130F] mb-4">Edit Akun</h3>

            <form onSubmit={handleEditAccount} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl">
                  {successMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#6A6660] mb-1">Nomor Akun</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 10001"
                  value={editNomorAkun}
                  onChange={(e) => setEditNomorAkun(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E4E0D9] rounded-xl text-sm text-[#14130F] focus:outline-none focus:ring-2 focus:ring-[#009162]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6A6660] mb-1">Nama Akun</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kas Kecil"
                  value={editNamaAkun}
                  onChange={(e) => setEditNamaAkun(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E4E0D9] rounded-xl text-sm text-[#14130F] focus:outline-none focus:ring-2 focus:ring-[#009162]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6A6660] mb-1">Tipe Akun</label>
                <select
                  value={editTipe}
                  onChange={(e) => setEditTipe(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E4E0D9] rounded-xl text-sm text-[#14130F] focus:outline-none focus:ring-2 focus:ring-[#009162] appearance-none"
                >
                  <option value="Aset">Aset</option>
                  <option value="Liabilitas">Liabilitas</option>
                  <option value="Ekuitas">Ekuitas</option>
                  <option value="Pendapatan">Pendapatan</option>
                  <option value="Beban">Beban</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E6E1D4]">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingAccount(null);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="px-4 py-2 border border-[#E4E0D9] hover:bg-gray-50 text-sm font-semibold rounded-xl text-[#6A6660] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#009162] hover:bg-[#00734D] disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Akun */}
      {showDeleteModal && deletingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#F6F4EF] rounded-2xl border border-[#E4E0D9] shadow-xl overflow-hidden p-6 relative">
            <h3 className="text-lg font-bold text-[#14130F] mb-2">Hapus Akun</h3>
            <p className="text-sm text-stone-600 mb-6">
              Apakah Anda yakin ingin menghapus akun <span className="font-semibold text-[#14130F]">{deletingAccount.nomorAkun} - {deletingAccount.namaAkun}</span>? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingAccount(null);
                }}
                className="px-4 py-2 border border-[#E4E0D9] hover:bg-gray-50 text-sm font-semibold rounded-xl text-[#6A6660] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer"
              >
                {isDeleting ? 'Menghapus...' : 'Hapus Akun'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}