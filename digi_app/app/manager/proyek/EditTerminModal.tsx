import React, { useState, useEffect } from 'react';
import { X, Check, Loader2, AlertCircle } from 'lucide-react';

type TerminItem = {
    id?: number;
    progress: number | string;
    nominal: string;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    proyekId: number;
    proyekNama: string;
    rabTotal?: number | string;
    terminList: any[];
};

// Helper untuk memformat angka dengan titik ribuan (contoh: 1000000 -> 1.000.000)
function formatRupiahInput(value: string | number): string {
    if (!value && value !== 0) return "";
    const cleanNum = String(value).replace(/[^0-9]/g, "");
    if (!cleanNum) return "";
    return parseInt(cleanNum, 10).toLocaleString("id-ID");
}

export default function EditTerminModal({ isOpen, onClose, proyekId, proyekNama, rabTotal, terminList }: Props) {
    const [termin0, setTermin0] = useState<{ id?: number; nominal: string }>({ nominal: '' });
    const [terminData, setTerminData] = useState<TerminItem[]>([{ progress: '', nominal: '' }]);
    const [jumlahTerminInput, setJumlahTerminInput] = useState<string>('1');

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        const existingT0 = terminList.find((t: any) =>
            t.namaTermin?.includes("Termin 0") ||
            t.namaTermin?.toLowerCase().includes("down payment") ||
            t.namaTermin?.toLowerCase().includes("dp") ||
            (Number(t.persentaseProgress) === 0 && Number(t.urutan) === 1 && terminList.some((other: any) => Number(other.persentaseProgress) > 0))
        );

        if (existingT0) {
            setTermin0({ id: existingT0.id, nominal: formatRupiahInput(existingT0.nominal || '') });
        } else {
            setTermin0({ nominal: '' });
        }

        const regularList = terminList.filter((t: any) =>
            t !== existingT0 &&
            !t.namaTermin?.includes("Termin 0") &&
            !t.namaTermin?.toLowerCase().includes("down payment") &&
            !t.namaTermin?.toLowerCase().includes("dp")
        );

        if (regularList.length > 0) {
            setTerminData(regularList.map((t: any) => ({
                id: t.id,
                progress: t.persentaseProgress || '',
                nominal: formatRupiahInput(t.nominal || ''),
            })));
            setJumlahTerminInput(String(regularList.length));
        } else {
            setTerminData([{ progress: '', nominal: '' }]);
            setJumlahTerminInput('1');
        }
        setErrorMsg('');
        setSuccessMsg('');
    }, [isOpen, terminList]);

    if (!isOpen) return null;

    const handleInputChange = (index: number, field: 'progress' | 'nominal', value: string) => {
        const updated = [...terminData];
        if (field === 'nominal') {
            updated[index] = { ...updated[index], nominal: formatRupiahInput(value) };
        } else if (field === 'progress') {
            let cleanVal = value.replace(/[^0-9.]/g, '');
            const parts = cleanVal.split('.');
            if (parts.length > 2) {
                cleanVal = parts[0] + '.' + parts.slice(1).join('');
            }
            const num = parseFloat(cleanVal);
            if (!isNaN(num) && num > 100) {
                cleanVal = '100';
            }
            updated[index] = { ...updated[index], progress: cleanVal };
        }
        setTerminData(updated);
    };

    const handleJumlahTerminChange = (value: string) => {
        const cleanVal = value.replace(/\D/g, "");
        setJumlahTerminInput(cleanVal);

        if (cleanVal === "") {
            return;
        }

        const num = parseInt(cleanVal, 10);
        if (!isNaN(num)) {
            setTerminData((prev) => {
                const updated = [...prev];
                if (num > updated.length) {
                    for (let i = updated.length; i < num; i++) {
                        updated.push({ progress: '', nominal: '' });
                    }
                } else if (num < updated.length) {
                    updated.length = num;
                }
                return updated;
            });
        }
    };

    const handleSimpanTermin = async () => {
        setErrorMsg('');
        setSuccessMsg('');

        const nom0Clean = String(termin0.nominal).replace(/\./g, '');
        const hasT0 = nom0Clean !== '' && !isNaN(Number(nom0Clean)) && Number(nom0Clean) > 0;

        // Validasi input progress & nominal untuk setiap termin reguler
        for (let i = 0; i < terminData.length; i++) {
            const t = terminData[i];
            if (t.progress === '' || t.progress === null || t.progress === undefined) {
                setErrorMsg(`Progress untuk Termin ${i + 1} harus diisi!`);
                return;
            }
            const progNum = parseFloat(String(t.progress));
            if (isNaN(progNum) || progNum <= 0 || progNum > 100) {
                setErrorMsg(`Progress Termin ${i + 1} harus lebih dari 0% dan maksimal 100%!`);
                return;
            }

            const nomClean = String(t.nominal).replace(/\./g, '');
            if (!nomClean || isNaN(Number(nomClean)) || Number(nomClean) <= 0) {
                setErrorMsg(`Nominal untuk Termin ${i + 1} harus diisi dengan benar!`);
                return;
            }
        }

        // Validasi progress bertahap naik: Termin 1 < Termin 2 < Termin 3 ...
        for (let i = 0; i < terminData.length - 1; i++) {
            const currentProg = parseFloat(String(terminData[i].progress));
            const nextProg = parseFloat(String(terminData[i + 1].progress));
            if (currentProg >= nextProg) {
                setErrorMsg(`Progress Termin ${i + 1} (${currentProg}%) harus lebih kecil dari Termin ${i + 2} (${nextProg}%)!`);
                return;
            }
        }

        setLoading(true);
        try {
            const payload: any[] = [];

            // Jika Termin 0 diisi nominalnya, masukkan ke payload pertama
            if (hasT0) {
                payload.push({
                    id: termin0.id,
                    namaTermin: 'Termin 0',
                    nominal: parseFloat(nom0Clean),
                    persentaseProgress: 0,
                });
            }

            // Masukkan termin reguler
            terminData.forEach((t, idx) => {
                payload.push({
                    id: t.id,
                    namaTermin: `Termin ${idx + 1}`,
                    nominal: parseFloat(String(t.nominal).replace(/\./g, '')),
                    persentaseProgress: parseFloat(String(t.progress)),
                });
            });

            const res = await fetch(`/api/proyek/${proyekId}/termin`, {
                method: "POST",
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

                    {/* Total Nilai Proyek (Rupiah) - Read-only Information */}
                    <div className="mb-5">
                        <label className="block text-[12px] font-bold text-stone-800 mb-1.5">
                            Total Nilai Proyek (Rupiah)
                        </label>
                        <div className="flex items-center w-full h-10 bg-[#F8F7F4] border border-[#e6e2d6] rounded-xl px-3.5">
                            <span className="text-[13.5px] font-mono font-medium text-[#78716C] mr-1.5">Rp</span>
                            <span className="text-[13.5px] font-mono font-bold text-stone-900">
                                {formatRupiahInput(rabTotal || 0) || "0"}
                            </span>
                        </div>
                    </div>

                    {/* Input Jumlah Termin */}
                    <div className="mb-5">
                        <label className="block text-[12px] font-bold text-stone-800 mb-1.5">
                            Jumlah Termin
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={jumlahTerminInput}
                            onChange={(e) => handleJumlahTerminChange(e.target.value)}
                            onBlur={() => {
                                if (jumlahTerminInput === "" || parseInt(jumlahTerminInput, 10) === 0) {
                                    setJumlahTerminInput(String(terminData.length));
                                }
                            }}
                            placeholder="0"
                            className="w-20 border border-[#e6e2d6] rounded-[12px] px-4 py-2 text-[14px] font-bold text-stone-900 outline-none focus:border-[#00966c] text-center bg-white"
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
                    <div className="space-y-2.5 max-h-[42vh] overflow-y-auto pr-1">

                        {/* Baris Khusus: Termin 0 (Down Payment) - Lock at 0% */}
                        <div className="grid grid-cols-12 gap-3 items-center bg-[#f8f7f3] p-2 rounded-[14px]">
                            <div className="col-span-3 text-[13px] font-bold text-stone-800 pl-2">
                                Termin 0 <span className="text-[11px] font-normal text-stone-500">(DP)</span>
                            </div>

                            {/* Progress (%) Lock 0% */}
                            <div className="col-span-3 relative">
                                <input
                                    type="text"
                                    disabled
                                    value="0"
                                    className="w-full bg-[#eeebe2] border border-[#dedad0] text-stone-600 rounded-[10px] pl-3 pr-8 py-2.5 text-[13px] font-bold text-center cursor-not-allowed select-none"
                                />
                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-extrabold text-[#a69c8a]">
                                    %
                                </span>
                            </div>

                            {/* Input Nominal DP */}
                            <div className="col-span-6 relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] font-extrabold text-[#a69c8a]">
                                    Rp
                                </span>
                                <input
                                    type="text"
                                    value={termin0.nominal}
                                    onChange={(e) => setTermin0({ ...termin0, nominal: formatRupiahInput(e.target.value) })}
                                    placeholder="0"
                                    className="w-full bg-white border border-[#e6e2d6] rounded-[10px] pl-9 pr-3 py-2.5 text-[13.5px] font-mono font-medium text-stone-800 outline-none focus:border-[#00966c]"
                                />
                            </div>
                        </div>

                        {/* Baris Termin Reguler */}
                        {terminData.map((_, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-[#f8f7f3] p-2 rounded-[14px]">

                                <div className="col-span-3 text-[13px] font-bold text-stone-800 pl-2">
                                    Termin {idx + 1}
                                </div>

                                {/* Input Progress (%) */}
                                <div className="col-span-3 relative">
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={terminData[idx]?.progress ?? ''}
                                        onChange={(e) => handleInputChange(idx, 'progress', e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-white border border-[#e6e2d6] rounded-[10px] pl-3 pr-8 py-2.5 text-[13px] font-semibold text-stone-800 outline-none focus:border-[#00966c] text-center"
                                    />
                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-extrabold text-[#a69c8a]">
                                        %
                                    </span>
                                </div>

                                {/* Input Nominal (Rp) */}
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