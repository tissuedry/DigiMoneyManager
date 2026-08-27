import React, { useState, useEffect } from 'react';
import { X, Check, Loader2, AlertCircle, Coins } from 'lucide-react';
import { formatRibuan, ribuanToNumber } from '@/lib/proyek-utils';
import { TerminItem } from './types';
import Toast from '@/components/toast';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    proyekId: number;
    proyekNama: string;
    NilaiKontrak?: number | string;
    terminList: any[];
    onSuccess?: () => void;
};

export default function EditTerminForm({
    isOpen,
    onClose,
    proyekId,
    proyekNama,
    NilaiKontrak = 0,
    terminList,
    onSuccess,
}: Props) {
    const [termin0, setTermin0] = useState<{ id?: number; progress?: string; nominal: string; isDiterima?: boolean }>({ progress: '', nominal: '', isDiterima: false });
    const [terminData, setTerminData] = useState<TerminItem[]>([{ progress: '', nominal: '', isDiterima: false }]);
    const [jumlahTerminInput, setJumlahTerminInput] = useState<string>('1');

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [showSuccessToast, setShowSuccessToast] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const existingT0 = terminList.find((t: any) =>
            t.namaTermin?.includes("Termin 0") ||
            t.namaTermin?.toLowerCase().includes("down payment") ||
            t.namaTermin?.toLowerCase().includes("dp") ||
            (Number(t.persentaseProgress) === 0 && Number(t.urutan) === 1 && terminList.some((other: any) => Number(other.persentaseProgress) > 0))
        );

        if (existingT0) {
            const isT0Diterima = existingT0.status === 'DITERIMA' || Boolean(existingT0.tanggalPencairan);
            const rawProg = existingT0.persentaseProgress !== undefined && existingT0.persentaseProgress !== null
                ? String(existingT0.persentaseProgress)
                : '';
            setTermin0({
                id: existingT0.id,
                progress: rawProg,
                nominal: formatRibuan(String(existingT0.nominal || '')),
                isDiterima: isT0Diterima,
            });
        } else {
            setTermin0({ progress: '', nominal: '', isDiterima: false });
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
                nominal: formatRibuan(String(t.nominal || '')),
                status: t.status,
                isDiterima: t.status === 'DITERIMA' || Boolean(t.tanggalPencairan),
            })));
            setJumlahTerminInput(String(regularList.length));
        } else {
            setTerminData([{ progress: '', nominal: '', isDiterima: false }]);
            setJumlahTerminInput('1');
        }
        setShowSuccessToast(false);
        setErrorMsg('');
        setSuccessMsg('');
    }, [isOpen, terminList]);

    if (!isOpen && !showSuccessToast) return null;

    const totalNilaiProyekVal = typeof NilaiKontrak === 'number'
        ? NilaiKontrak
        : (parseFloat(String(NilaiKontrak || 0).replace(/[^0-9.-]+/g, '')) || 0);

    const nom0Val = ribuanToNumber(termin0.nominal);
    const nomRegulerVal = terminData.reduce((acc, t) => acc + ribuanToNumber(t.nominal), 0);
    const totalTeralokasi = nom0Val + nomRegulerVal;
    const sisaAlokasi = totalNilaiProyekVal - totalTeralokasi;
    const isOverallocated = totalTeralokasi > totalNilaiProyekVal && totalNilaiProyekVal > 0;
    const isMatched = totalNilaiProyekVal > 0 && totalTeralokasi === totalNilaiProyekVal;
    const pctTeralokasi = totalNilaiProyekVal > 0 ? (totalTeralokasi / totalNilaiProyekVal) * 100 : 0;

    const handleInputChange = (index: number, field: 'progress' | 'nominal', value: string, e?: React.ChangeEvent<HTMLInputElement>) => {
        if (terminData[index]?.isDiterima) return;

        const updated = [...terminData];
        if (field === 'nominal') {
            const cleanNominal = ribuanToNumber(value);
            let calculatedPct = '';
            if (totalNilaiProyekVal > 0 && cleanNominal > 0) {
                const pct = (cleanNominal / totalNilaiProyekVal) * 100;
                calculatedPct = String(parseFloat(pct.toFixed(2)));
            }

            if (e) {
                const caretPos = e.target.selectionStart ?? 0;
                const { formatted, caret } = formatRibuan(value, caretPos);
                updated[index] = { ...updated[index], nominal: formatted, progress: calculatedPct };
                setTerminData(updated);
                requestAnimationFrame(() => {
                    e.target.setSelectionRange(caret, caret);
                });
                return;
            }
            updated[index] = { ...updated[index], nominal: formatRibuan(value), progress: calculatedPct };
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

            let calculatedNominal = '';
            if (cleanVal !== '' && !isNaN(parseFloat(cleanVal)) && totalNilaiProyekVal > 0) {
                const nom = Math.round((parseFloat(cleanVal) / 100) * totalNilaiProyekVal);
                calculatedNominal = formatRibuan(String(nom));
            }

            updated[index] = { ...updated[index], progress: cleanVal, nominal: calculatedNominal };
        }
        setTerminData(updated);
    };

    const handleTermin0ProgressChange = (value: string) => {
        if (termin0.isDiterima) return;
        let cleanVal = value.replace(/[^0-9.]/g, '');
        const parts = cleanVal.split('.');
        if (parts.length > 2) {
            cleanVal = parts[0] + '.' + parts.slice(1).join('');
        }
        const num = parseFloat(cleanVal);
        if (!isNaN(num) && num > 100) {
            cleanVal = '100';
        }

        let calculatedNominal = termin0.nominal;
        if (cleanVal !== '' && !isNaN(parseFloat(cleanVal)) && totalNilaiProyekVal > 0) {
            const nom = Math.round((parseFloat(cleanVal) / 100) * totalNilaiProyekVal);
            calculatedNominal = formatRibuan(String(nom));
        } else if (cleanVal === '') {
            calculatedNominal = '';
        }

        setTermin0((prev) => ({ ...prev, progress: cleanVal, nominal: calculatedNominal }));
    };

    const handleTermin0Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (termin0.isDiterima) return;
        const caretPos = e.target.selectionStart ?? 0;
        const { formatted, caret } = formatRibuan(e.target.value, caretPos);
        const cleanNominal = ribuanToNumber(e.target.value);
        let calculatedPct = '';
        if (totalNilaiProyekVal > 0 && cleanNominal > 0) {
            const pct = (cleanNominal / totalNilaiProyekVal) * 100;
            calculatedPct = String(parseFloat(pct.toFixed(2)));
        }

        setTermin0((prev) => ({ ...prev, nominal: formatted, progress: calculatedPct }));
        requestAnimationFrame(() => {
            e.target.setSelectionRange(caret, caret);
        });
    };

    const handleJumlahTerminChange = (value: string) => {
        const cleanVal = value.replace(/\D/g, "");
        setJumlahTerminInput(cleanVal);

        if (cleanVal === "") {
            return;
        }

        const num = parseInt(cleanVal, 10);
        if (!isNaN(num)) {
            const minAllowed = terminData.filter(t => t.isDiterima).length;
            const targetCount = Math.max(num, minAllowed);

            setTerminData((prev) => {
                const updated = [...prev];
                if (targetCount > updated.length) {
                    for (let i = updated.length; i < targetCount; i++) {
                        updated.push({ progress: '', nominal: '', isDiterima: false });
                    }
                } else if (targetCount < updated.length) {
                    while (updated.length > targetCount && !updated[updated.length - 1].isDiterima) {
                        updated.pop();
                    }
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

        for (let i = 0; i < terminData.length; i++) {
            const t = terminData[i];
            if (t.progress === '' || t.progress === null || t.progress === undefined) {
                setErrorMsg(`Persen untuk Termin ${i + 1} harus diisi!`);
                return;
            }
            const progNum = parseFloat(String(t.progress));
            if (isNaN(progNum) || progNum <= 0 || progNum > 100) {
                setErrorMsg(`Persen Termin ${i + 1} harus lebih dari 0% dan maksimal 100%!`);
                return;
            }

            const nomClean = String(t.nominal).replace(/\./g, '');
            if (!nomClean || isNaN(Number(nomClean)) || Number(nomClean) <= 0) {
                setErrorMsg(`Nominal untuk Termin ${i + 1} harus diisi dengan benar!`);
                return;
            }
        }

        if (isOverallocated) {
            setErrorMsg(`Total alokasi termin (Rp ${totalTeralokasi.toLocaleString('id-ID')}) melebihi Total Nilai Proyek (Rp ${totalNilaiProyekVal.toLocaleString('id-ID')})!`);
            return;
        }

        setLoading(true);
        try {
            const payload: any[] = [];

            if (hasT0) {
                const prog0 = termin0.progress !== '' && termin0.progress !== undefined && termin0.progress !== null
                    ? parseFloat(String(termin0.progress))
                    : 0;
                payload.push({
                    id: termin0.id,
                    namaTermin: 'Termin 0',
                    nominal: parseFloat(nom0Clean),
                    persentaseProgress: isNaN(prog0) ? 0 : prog0,
                });
            }

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
            setShowSuccessToast(true);

            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('terminUpdated'));
            }

            onSuccess?.();
            onClose();

        } catch (err: any) {
            setErrorMsg(err.message || 'Terjadi kesalahan jaringan.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

          <div className="px-6 py-5 border-b border-stone-100 flex justify-between items-start shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Coins size={13} className="text-emerald-700" strokeWidth={2.5} />
                </div>
                <h2 className="text-[17px] font-bold text-stone-900">Edit Termin Pembayaran</h2>
              </div>
              <p className="text-[12px] text-stone-500 mt-1 pl-8">{proyekNama}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-100 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-[12.5px] font-medium flex items-center gap-2 animate-in fade-in">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-[12.5px] font-medium flex items-center gap-2 animate-in fade-in">
                <Check size={16} className="shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-[12px] font-bold text-stone-800 mb-1.5">
                Total Nilai Proyek (Rupiah)
              </label>
              <div className="flex items-center w-full h-10 bg-[#F8F7F4] border border-[#e6e2d6] rounded-xl px-3.5 shadow-xs">
                <span className="text-[13.5px]  font-medium text-[#78716C] mr-1.5">Rp</span>
                <span className="text-[14px]  font-bold text-stone-900">
                  {totalNilaiProyekVal > 0 ? formatRibuan(String(Math.round(totalNilaiProyekVal))) : "0"}
                </span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-[#e6e2d6] shadow-xs space-y-2.5">
              <div className="flex justify-between items-center text-[12px] font-bold text-stone-700">
                <span>Distribusi Alokasi Termin</span>
                <span className=" text-[12.5px] font-extrabold text-stone-900">
                  Rp {totalTeralokasi.toLocaleString("id-ID")} <span className="text-stone-400 font-normal">/ {totalNilaiProyekVal.toLocaleString("id-ID")}</span>
                </span>
              </div>

              <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-300 ${isOverallocated
                      ? "bg-rose-500"
                      : isMatched
                        ? "bg-[#00966c]"
                        : "bg-emerald-500"}`}
                  style={{ width: `${Math.min(pctTeralokasi, 100)}%` }} />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="flex flex-col">
                  <span className="text-stone-400 text-[11px] font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
                    Teralokasi
                  </span>
                  <span className=" font-bold text-stone-800 text-[12.5px] mt-0.5">
                    Rp {totalTeralokasi.toLocaleString("id-ID")}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                    {Math.round(pctTeralokasi)}% dari nilai proyek
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-stone-400 text-[11px] font-medium flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full inline-block shrink-0 ${isOverallocated ? 'bg-rose-500' : 'bg-amber-500'}`} />
                    {isOverallocated ? "Kelebihan" : "Sisa Alokasi"}
                  </span>
                  <span className={` font-bold text-[12.5px] mt-0.5 ${isOverallocated ? 'text-rose-600' : 'text-stone-800'}`}>
                    Rp {Math.abs(sisaAlokasi).toLocaleString("id-ID")}
                  </span>
                  <span className={`text-[10px] font-medium mt-0.5 ${isOverallocated ? 'text-rose-500 font-semibold' : 'text-stone-400'}`}>
                    {isOverallocated ? "Melebihi nilai" : isMatched ? "Selesai dialokasi" : "Belum dialokasi"}
                  </span>
                </div>

                <div className="flex flex-col text-right items-end justify-start">
                  <span className="text-stone-400 text-[11px] font-medium">Status</span>
                  <div className="mt-1">
                    {isOverallocated ? (
                      <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-800 font-bold text-[10.5px] rounded-lg">
                        Overbudget
                      </span>
                    ) : isMatched ? (
                      <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10.5px] rounded-lg">
                        Sesuai (100%)
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[10.5px] rounded-lg">
                        Sisa {Math.max(0, 100 - Math.round(pctTeralokasi))}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
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
                } }
                placeholder="0"
                className="w-20 border border-[#e6e2d6] rounded-[12px] px-4 py-2 text-[14px] font-bold text-stone-900 outline-none focus:border-[#00966c] text-center bg-white shadow-xs" />
            </div>

            <div className="grid grid-cols-12 gap-3 px-3 pt-1">
              <div className="col-span-3 text-[10.5px] font-extrabold text-[#a69c8a] uppercase tracking-wider">
                Termin
              </div>
              <div className="col-span-3 text-[10.5px] font-extrabold text-[#a69c8a] uppercase tracking-wider text-center">
                Persen (%)
              </div>
              <div className="col-span-6 text-[10.5px] font-extrabold text-[#a69c8a] uppercase tracking-wider pl-1">
                Nominal Diturunkan (IDR)
              </div>
            </div>

            <div className="space-y-2.5 max-h-[38vh] overflow-y-auto pr-1">

              <div className="grid grid-cols-12 gap-3 items-center bg-[#f8f7f3] p-2 rounded-[14px]">
                <div className="col-span-3 text-[13px] font-bold text-stone-800 pl-2">
                  Termin 0 <span className="text-[11px] font-normal text-stone-500">(DP)</span>
                  {termin0.isDiterima && (
                    <span className="block text-[9.5px] font-bold text-emerald-700 leading-tight mt-0.5">Dicairkan</span>
                  )}
                </div>

                <div className="col-span-3 relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={termin0.isDiterima}
                    value={termin0.progress ?? ''}
                    onChange={(e) => handleTermin0ProgressChange(e.target.value)}
                    placeholder="0"
                    className={`w-full border rounded-[10px] pl-3 pr-8 py-2.5 text-[13px] font-semibold text-center ${termin0.isDiterima
                        ? 'bg-[#eeebe2] border-[#dedad0] text-stone-500 cursor-not-allowed select-none'
                        : 'bg-white border-[#e6e2d6] text-stone-800 outline-none focus:border-[#00966c]'}`} />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-extrabold text-[#a69c8a]">
                    %
                  </span>
                </div>

                <div className="col-span-6 relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] font-extrabold text-[#a69c8a]">
                    Rp
                  </span>
                  <input
                    type="text"
                    disabled={termin0.isDiterima}
                    value={termin0.nominal}
                    onChange={handleTermin0Change}
                    placeholder="0"
                    className={`w-full border rounded-[10px] pl-9 pr-3 py-2.5 text-[13.5px] font-medium ${termin0.isDiterima
                        ? 'bg-[#eeebe2] border-[#dedad0] text-stone-500 cursor-not-allowed select-none'
                        : 'bg-white border-[#e6e2d6] text-stone-800 outline-none focus:border-[#00966c]'}`} />
                </div>
              </div>

              {terminData.map((t, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-[#f8f7f3] p-2 rounded-[14px]">

                  <div className="col-span-3 text-[13px] font-bold text-stone-800 pl-2">
                    Termin {idx + 1}
                    {t.isDiterima && (
                      <span className="block text-[9.5px] font-bold text-emerald-700 leading-tight mt-0.5">Dicairkan</span>
                    )}
                  </div>

                  <div className="col-span-3 relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      disabled={t.isDiterima}
                      value={t.progress ?? ''}
                      onChange={(e) => handleInputChange(idx, 'progress', e.target.value)}
                      placeholder="0"
                      className={`w-full border rounded-[10px] pl-3 pr-8 py-2.5 text-[13px] font-semibold text-center ${t.isDiterima
                          ? 'bg-[#eeebe2] border-[#dedad0] text-stone-500 cursor-not-allowed select-none'
                          : 'bg-white border-[#e6e2d6] text-stone-800 outline-none focus:border-[#00966c]'}`} />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-extrabold text-[#a69c8a]">
                      %
                    </span>
                  </div>

                  <div className="col-span-6 relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] font-extrabold text-[#a69c8a]">
                      Rp
                    </span>
                    <input
                      type="text"
                      disabled={t.isDiterima}
                      value={t.nominal ?? ''}
                      onChange={(e) => handleInputChange(idx, 'nominal', e.target.value, e)}
                      placeholder="0"
                      className={`w-full border rounded-[10px] pl-9 pr-3 py-2.5 text-[13.5px] font-medium ${t.isDiterima
                          ? 'bg-[#eeebe2] border-[#dedad0] text-stone-500 cursor-not-allowed select-none'
                          : 'bg-white border-[#e6e2d6] text-stone-800 outline-none focus:border-[#00966c]'}`} />
                  </div>

                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-stone-100 flex justify-end gap-3 bg-stone-50/50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 bg-white border border-[#e2e2e0] text-stone-700 text-[12px] font-bold rounded-xl transition hover:bg-stone-100 shadow-xs cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSimpanTermin}
              disabled={loading || isOverallocated}
              className={`px-6 py-2.5 text-white text-[12px] font-bold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer ${isOverallocated
                  ? 'bg-stone-300 cursor-not-allowed text-stone-500'
                  : 'bg-[#1a1a1a] hover:bg-black'} disabled:opacity-50`}
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>
      )}
        <Toast
          open={showSuccessToast}
          message="Termin pembayaran berhasil diperbarui!"
          onClose={() => setShowSuccessToast(false)} 
        />
      </>
    );
}