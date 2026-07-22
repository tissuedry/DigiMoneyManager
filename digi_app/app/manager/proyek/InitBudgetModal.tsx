import React, { useState, useEffect } from "react";
import { X, Trash2, Loader2 } from "lucide-react";
import { Project } from "./types";
import { formatRibuan, ribuanToNumber } from "./utils";

type MainOption = {
  id: number; 
  nama: string;
};

type Props = {
  showInitBudget: Project | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  detailedProjectInfo: any;
  rabTotal: string;
  setRabTotal: (v: string) => void;
  posAnggaranList: { deskripsi: string; nominalAlokasi: string }[];
  setPosAnggaranList: React.Dispatch<React.SetStateAction<{ deskripsi: string; nominalAlokasi: string }[]>>;
  formError: string;
  submitting: boolean;
};

export default function InitBudgetModal({
  showInitBudget,
  onClose,
  onSubmit,
  detailedProjectInfo,
  rabTotal,
  setRabTotal,
  posAnggaranList,
  setPosAnggaranList,
  formError,
  submitting,
}: Props) {
  // Declare hooks FIRST
  const [mainOptions, setMainOptions] = useState<MainOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchMasterMain() {
      setLoadingOptions(true);
      try {
        const res = await fetch("/api/master");
        if (res.ok && isMounted) {
          const data = await res.json();
          setMainOptions(data);
        }
      } catch (err) {
        if (isMounted) console.error("Gagal memuat master main budget:", err);
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    }
    fetchMasterMain();
    return () => {
      isMounted = false;
    };
  }, [showInitBudget?.id]);

  // THEN do the early return
  if (!showInitBudget) return null;

  // Cek jika ada opsi/deskripsi pos anggaran yang duplikat
  const selectedDeskripsi = posAnggaranList
    .map((item) => item.deskripsi)
    .filter((desk) => desk !== "");
  const hasDuplicateOptions = new Set(selectedDeskripsi).size !== selectedDeskripsi.length;

  const totalVal = ribuanToNumber(rabTotal) || 0;
  const terpakaiVal = parseFloat(detailedProjectInfo?.budget?.totalPengeluaran) || 0;
  const pctVal = totalVal > 0 ? Math.round((terpakaiVal / totalVal) * 100) : 0;
  const sisaVal = Math.max(0, totalVal - terpakaiVal);

  const totalPosAllocated = posAnggaranList.reduce((acc, pos) => acc + (ribuanToNumber(pos.nominalAlokasi) || 0), 0);
  const isOverbudget = totalPosAllocated > totalVal;

  const formatMillions = (val: number) => {
    if (val >= 1_000_000_000) {
      return `${(val / 1_000_000_000).toFixed(1)} M`;
    }
    return `${(val / 1_000_000).toFixed(1)} jt`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasDuplicateOptions) return; // Mencegah submit jika ada opsi duplikat
    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div style={{
        width: 520,
        background: 'white',
        boxShadow: '0px 24px 64px rgba(20, 18, 14, 0.28)',
        overflow: 'hidden',
        borderRadius: 22,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
        animation: 'fadeIn 0.2s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '0.80px #E6E1D4 solid',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 17, color: '#14130F', lineHeight: '25.50px' }}>Edit Nilai Proyek</div>
            <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 400, fontSize: 12, color: '#9A948B', lineHeight: '18px' }}>{showInitBudget.nama}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '6px 10px', borderRadius: 12, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            className="hover:bg-stone-100 transition"
          >
            <X size={16} color="#2C2A24" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Total Nilai Proyek (Rupiah) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
              <div>
                <span style={{ color: '#14130F', fontSize: 12.50, fontFamily: 'Plus Jakarta Sans', fontWeight: '600' }}>
                  Total Nilai Proyek (Rupiah) <span style={{ color: '#902F33' }}>*</span>
                </span>
              </div>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                height: 40,
                background: 'white',
                borderRadius: 12,
                border: '1px solid #E6E1D4',
                paddingLeft: 12,
                paddingRight: 12,
              }}>
                <span style={{ fontSize: 13.50, fontFamily: 'IBM Plex Mono', fontWeight: '400', color: '#14130F', marginRight: 4 }}>Rp</span>
                <input
                  type="text"
                  required
                  value={rabTotal}
                  onChange={(e) => setRabTotal(formatRibuan(e.target.value))}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontFamily: 'IBM Plex Mono',
                    fontSize: 13.50,
                    fontWeight: '400',
                    color: '#14130F',
                  }}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Progress Card: Realisasi Anggaran */}
            <div style={{
              alignSelf: 'stretch',
              padding: 16,
              background: 'white',
              boxShadow: '0px 0px 0px 1px rgba(20, 18, 14, 0.04), 0px 1px 2px rgba(20, 18, 14, 0.05)',
              borderRadius: 16,
              border: '1.20px #E6E1D4 solid',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#14130F', fontSize: 13, fontFamily: 'Plus Jakarta Sans', fontWeight: '600' }}>Realisasi Anggaran</span>
                <span style={{ color: '#14130F', fontSize: 13, fontFamily: 'IBM Plex Mono', fontWeight: '700' }}>{pctVal}%</span>
              </div>
              <div style={{ height: 8, background: '#F3F0E9', overflow: 'hidden', borderRadius: 999 }}>
                <div style={{ width: `${Math.min(pctVal, 100)}%`, height: '100%', background: '#009162', borderRadius: 999 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
                  <span style={{ color: 'black', fontSize: 11.5, fontFamily: 'Plus Jakarta Sans', fontWeight: '500' }}>Nilai Proyek</span>
                  <span style={{ color: '#9A948B', fontSize: 10, fontFamily: 'IBM Plex Mono', fontWeight: '500' }}>Rp</span>
                  <span style={{ color: '#14130F', fontSize: 11.5, fontFamily: 'IBM Plex Mono', fontWeight: '500' }}>{formatMillions(totalVal)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
                  <span style={{ color: 'black', fontSize: 11.5, fontFamily: 'Plus Jakarta Sans', fontWeight: '500' }}>Realisasi</span>
                  <span style={{ color: '#9A948B', fontSize: 10, fontFamily: 'IBM Plex Mono', fontWeight: '500' }}>Rp</span>
                  <span style={{ color: '#14130F', fontSize: 11.5, fontFamily: 'IBM Plex Mono', fontWeight: '500' }}>{formatMillions(terpakaiVal)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                  <span style={{ color: '#9A948B', fontSize: 11.5, fontFamily: 'Plus Jakarta Sans', fontWeight: '400' }}>Sisa</span>
                  <span style={{ color: '#9A948B', fontSize: 10, fontFamily: 'IBM Plex Mono', fontWeight: '700' }}>Rp</span>
                  <span style={{ color: '#14130F', fontSize: 11.5, fontFamily: 'IBM Plex Mono', fontWeight: '700' }}>{formatMillions(sisaVal)}</span>
                </div>
              </div>
            </div>

            {/* Breakdown Main Budget List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span style={{ color: '#14130F', fontSize: 12.50, fontFamily: 'Plus Jakarta Sans', fontWeight: '600' }}>
                  Breakdown Pos Anggaran Main
                </span>
                <button
                  type="button"
                  onClick={() => setPosAnggaranList([...posAnggaranList, { deskripsi: "", nominalAlokasi: "" }])}
                  style={{
                    padding: '4px 10px',
                    background: '#D5F4E3',
                    borderRadius: 6,
                    border: 'none',
                    color: '#005836',
                    fontSize: 11.50,
                    fontFamily: 'Plus Jakarta Sans',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                  className="hover:opacity-80 transition"
                >
                  + Tambah Main
                </button>
              </div>

              {/* Real-time Summary Cards */}
              <div style={{
                alignSelf: 'stretch',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16
              }}>
                <div style={{
                  padding: '10px 12px',
                  background: 'white',
                  borderRadius: 12,
                  outline: '0.80px #E6E1D4 solid',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  gap: 2
                }}>
                  <div style={{ color: '#14130F', fontSize: 11.5, fontFamily: 'Plus Jakarta Sans', fontWeight: '600' }}>
                    Total Pos Teralokasi
                  </div>
                  <div style={{ color: 'black', fontSize: 13, fontFamily: 'IBM Plex Mono', fontWeight: '500' }}>
                    Rp {totalPosAllocated.toLocaleString("id-ID")}
                  </div>
                </div>

                <div style={{
                  padding: '10px 12px',
                  background: isOverbudget ? 'rgba(211, 108, 102, 0.05)' : 'white',
                  borderRadius: 12,
                  outline: isOverbudget ? '0.80px #D36C66 solid' : '0.80px #E6E1D4 solid',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  gap: 2
                }}>
                  <div style={{ color: isOverbudget ? '#D36C66' : '#14130F', fontSize: 11.5, fontFamily: 'Plus Jakarta Sans', fontWeight: '600' }}>
                    {isOverbudget ? 'Kelebihan Alokasi (Overbudget)' : 'Sisa Pos Belum Dialokasikan'}
                  </div>
                  <div style={{ color: isOverbudget ? '#D36C66' : 'black', fontSize: 13, fontFamily: 'IBM Plex Mono', fontWeight: '700' }}>
                    Rp {isOverbudget ? '-' : ''}{Math.abs(totalVal - totalPosAllocated).toLocaleString("id-ID")}
                  </div>
                </div>
              </div>

              {/* Scrollable list */}
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {posAnggaranList.map((pos, idx) => (
                  <div key={idx} className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <select
                      required
                      value={pos.deskripsi}
                      onChange={(e) => {
                        const newList = [...posAnggaranList];
                        newList[idx].deskripsi = e.target.value;
                        setPosAnggaranList(newList);
                      }}
                      className="flex-1 border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] font-medium bg-white focus:outline-none focus:border-stone-400 text-stone-700"
                    >
                      <option value="" disabled hidden>
                        {loadingOptions ? "Memuat data..." : "-- Pilih Nama Budget/Pos --"}
                      </option>
                      {mainOptions.map((opt) => (
                        <option key={opt.id} value={opt.nama}>
                          {opt.nama}
                        </option>
                      ))}
                    </select>

                    <div className="relative flex items-center w-44">
                      <span className="absolute left-3 text-[12px] font-bold text-stone-400 font-mono">Rp</span>
                      <input
                        type="text"
                        required
                        value={pos.nominalAlokasi}
                        onChange={(e) => {
                          const newList = [...posAnggaranList];
                          newList[idx].nominalAlokasi = formatRibuan(e.target.value);
                          setPosAnggaranList(newList);
                        }}
                        placeholder="Alokasi (Rp)"
                        className="w-full border border-stone-200 rounded-xl pl-8 pr-3 py-2.5 text-[13px] bg-white font-mono text-stone-900 font-bold text-left focus:outline-none focus:border-stone-400 placeholder-stone-300"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setPosAnggaranList(posAnggaranList.filter((_, i) => i !== idx))}
                      className="p-2 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-stone-50 transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {hasDuplicateOptions && (
              <div 
                style={{
                  background: '#FDF2F2',
                  border: '1px solid #FCD3D3',
                  borderRadius: 16,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: '#9E2A2B',
                  fontSize: 13,
                  fontFamily: 'Plus Jakarta Sans',
                  fontWeight: 600,
                }}
              >
                <X size={15} color="#9E2A2B" />
                <span>Pos Anggaran tidak boleh ada yang sama</span>
              </div>
            )}

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[12px] font-medium flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                <X size={14} />
                {formError}
              </div>
            )}

          </div>

          {/* Footer Buttons */}
          <div style={{
            alignSelf: 'stretch',
            padding: '14px 24px',
            borderTop: '0.80px #E6E1D4 solid',
            display: 'flex',
            gap: 8,
            background: 'white',
            flexShrink: 0
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '9px 14px',
                background: 'white',
                border: '0.80px solid #E6E1D4',
                borderRadius: 12,
                fontFamily: 'Plus Jakarta Sans',
                fontWeight: '600',
                fontSize: 13,
                color: '#14130F',
                cursor: 'pointer'
              }}
              className="hover:bg-stone-50 transition"
            >
              Batalkan
            </button>
            <button
              type="submit"
              disabled={submitting || hasDuplicateOptions}
              style={{
                flex: 1,
                padding: '9px 14px',
                background: hasDuplicateOptions ? '#A1A1AA' : 'black',
                border: 'none',
                borderRadius: 12,
                fontFamily: 'Plus Jakarta Sans',
                fontWeight: '600',
                fontSize: 13,
                color: 'white',
                cursor: hasDuplicateOptions ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
              className="hover:opacity-80 transition"
            >
              {submitting && <Loader2 size={13} className="animate-spin" />}
              Simpan Nilai Proyek
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}