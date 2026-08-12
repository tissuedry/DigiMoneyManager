import React, { useState, useEffect } from 'react';
import { X, Check, Loader2, AlertCircle } from 'lucide-react';

type TerminItem = {
    id?: number;
    progress: number | string;
    nominal: string; // diubah ke string agar format titiknya mulus saat diketik
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    proyekId: number;
    proyekNama: string;
    terminList: any[];
};

// Helper untuk memformat angka dengan titik ribuan (contoh: 1000000 -> 1.000.000)
function formatRupiahInput(value: string | number): string {
    if (!value && value !== 0) return "";
    const cleanNum = String(value).replace(/[^0-9]/g, "");
    if (!cleanNum) return "";
    return parseInt(cleanNum, 10).toLocaleString("id-ID");
}

export default function EditTerminModal({ isOpen, onClose, proyekId, proyekNama, terminList }: Props) {
    const [jumlahTermin, setJumlahTermin] = useState<number>(terminList.length > 0 ? terminList.length : 1);
    
    const [terminData, setTerminData] = useState<TerminItem[]>(
        terminList.length > 0 
            ? terminList.map(t => ({ 
                id: t.id, 
                progress: t.persentaseProgress || '', 
                nominal: formatRupiahInput(t.nominal || '') 
              }))
            : [{ progress: '', nominal: '' }]
    );

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        setTerminData((prev) => {
            const updated = [...prev];
            if (jumlahTermin > updated.length) {
                for (let i = updated.length; i < jumlahTermin; i++) {
                    updated.push({ progress: '', nominal: '' });
                }
            } else {
                updated.length = jumlahTermin;
            }
            return updated;
        });
    }, [jumlahTermin]);

    if (!isOpen) return null;

    const handleInputChange = (index: number, field: 'progress' | 'nominal', value: string) => {
        const updated = [...terminData];
        if (field === 'nominal') {
            // Format otomatis dengan titik saat user mengetik angka
            updated[index] = { ...updated[index], nominal: formatRupiahInput(value) };
        } else {
            updated[index] = { ...updated[index], [field]: value };
        }
        setTerminData(updated);
    };

    const handleSimpanTermin = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
        // Petakan semua data termin termasuk ID aslinya jika ada
        const payload = terminData.map((t, idx) => ({
            id: t.id, // ID penting agar backend tahu ini data lama yang harus di-update
            namaTermin: `Termin ${idx + 1}`,
            nominal: parseFloat(String(t.nominal).replace(/\./g, '')),
            persentaseProgress: parseFloat(String(t.progress)),
        }));

        const res = await fetch(`/api/proyek/${proyekId}/termin`, {
            method: "POST", // Mengirim seluruh array sekaligus ke backend
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ terminData: payload }),
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Gagal menyimpan termin');
        }

        setSuccessMsg('Termin pembayaran berhasil diperbarui!');
        
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('terminUpdated'));
        }

        setTimeout(() => {
            onSuccess();
            onClose();
        }, 1200);

    } catch (err: any) {
        setErrorMsg(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col">
                
                {/* Header Modal */}
                <div className="px-6 py-5 border-b border-stone-100 flex justify-between items-start">
                    <div>
                        <h2 className="text-[18px] font-bold text-stone-900">Edit Termin Pembayaran</h2>
                        <p className="text-[12px] text-stone-500 mt-1">{proyekNama}</p>
                    </div>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-700 transition cursor-pointer">
                        <X size={18} />
                    </button>
                </div>

                {/* Konten Form */}
                <div className="p-6">
                    {errorMsg && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[13px] font-medium flex items-center gap-2">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}
                    {successMsg && (
                        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-[13px] font-medium flex items-center gap-2">
                            <Check size={16} className="shrink-0" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {/* Input Jumlah Termin */}
                    <div className="mb-6">
                        <label className="block text-[12px] font-bold text-stone-800 mb-2">
                            Jumlah Termin
                        </label>
                        <input 
                            type="number" 
                            value={jumlahTermin}
                            onChange={(e) => setJumlahTermin(Math.max(1, Number(e.target.value)))}
                            className="w-20 border border-[#e6e2d6] rounded-[12px] px-4 py-2 text-[14px] font-bold text-stone-900 outline-none focus:border-[#00966c]"
                            min={1}
                        />
                    </div>

                    {/* Header Kolom Tabel */}
                    <div className="grid grid-cols-12 gap-3 mb-2 px-3">
                        <div className="col-span-3 text-[10.5px] font-extrabold text-[#a69c8a] uppercase tracking-wider">
                            Termin
                        </div>
                        <div className="col-span-3 text-[10.5px] font-extrabold text-[#a69c8a] uppercase tracking-wider">
                            Progress (%)
                        </div>
                        <div className="col-span-6 text-[10.5px] font-extrabold text-[#a69c8a] uppercase tracking-wider pl-1">
                            Nominal Diturunkan (IDR)
                        </div>
                    </div>

                    {/* Baris Input Termin Dinamis */}
                    <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1">
                        {Array.from({ length: jumlahTermin }).map((_, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-[#f8f7f3] p-2 rounded-[14px]">
                                
                                <div className="col-span-3 text-[13px] font-bold text-stone-800 pl-2">
                                    Termin {idx + 1}
                                </div>
                                
                                {/* Input Progress (%) */}
                                <div className="col-span-3 relative">
                                    <input 
                                        type="number" 
                                        value={terminData[idx]?.progress ?? ''}
                                        onChange={(e) => handleInputChange(idx, 'progress', e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-white border border-[#e6e2d6] rounded-[10px] pl-3 pr-8 py-2.5 text-[13px] font-semibold text-stone-800 outline-none focus:border-[#00966c] text-center" 
                                    />
                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-extrabold text-[#a69c8a]">
                                        %
                                    </span>
                                </div>
                                
                                {/* Input Nominal (Rp) dengan Format Titik Ribuan */}
                                <div className="col-span-6 relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] font-extrabold text-[#a69c8a]">
                                        Rp
                                    </span>
                                    <input 
                                        type="text" 
                                        value={terminData[idx]?.nominal ?? ''}
                                        onChange={(e) => handleInputChange(idx, 'nominal', e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-white border border-[#e6e2d6] rounded-[10px] pl-9 pr-3 py-2.5 text-[13.5px] font-mono font-medium text-stone-800 outline-none focus:border-[#00966c]" 
                                    />
                                </div>

                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Modal */}
                <div className="px-6 py-4 border-t border-stone-100 flex justify-end gap-3 bg-stone-50/50">
                    <button 
                        onClick={onClose} 
                        disabled={loading}
                        className="px-6 py-2.5 bg-white border border-[#e2e2e0] text-stone-700 text-[12px] font-bold rounded-xl transition hover:bg-stone-50 shadow-sm cursor-pointer"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={handleSimpanTermin}
                        disabled={loading}
                        className="px-6 py-2.5 bg-[#1a1a1a] hover:bg-black text-white text-[12px] font-bold rounded-xl transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        {loading ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>

            </div>
        </div>
    );
}

function onSuccess() {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('terminUpdated'));
    }
}