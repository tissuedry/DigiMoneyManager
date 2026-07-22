import React from "react";
import { X } from "lucide-react";
import { formatReimbursementDate } from "./utils";

type Props = {
  showDetailBudgetModal: boolean;
  onClose: () => void;
  detailedProjectInfo: any;
  expandedMain: Record<number, boolean>;
  setExpandedMain: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  expandedSub: Record<string, boolean>;
  setExpandedSub: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  expandedKet: Record<string, boolean>;
  setExpandedKet: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
};

export default function DetailBudgetModal({
  showDetailBudgetModal,
  onClose,
  detailedProjectInfo,
  expandedMain,
  setExpandedMain,
  expandedSub,
  setExpandedSub,
  expandedKet,
  setExpandedKet,
}: Props) {
  if (!showDetailBudgetModal) return null;

  const formatFullCurrency = (num: number) => {
    const n = Number(num) || 0;
    return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
  };

  const posAnggaran = detailedProjectInfo?.budget?.posAnggaran || [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div style={{
        width: 1080,
        background: 'white',
        boxShadow: '0px 24px 64px rgba(20, 18, 14, 0.30)',
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '85vh',
        animation: 'fadeIn 0.2s ease',
        textAlign: 'left'
      }}>
        {/* Header */}
        <div style={{
          padding: '22px 28px 18px 28px',
          borderBottom: '0.80px #E6E1D4 solid',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ color: '#14130F', fontSize: 19, fontFamily: 'Plus Jakarta Sans', fontWeight: '700', lineHeight: '28.50px' }}>Detail Anggaran</div>
            <div style={{ color: '#6A6660', fontSize: 13, fontFamily: 'Plus Jakarta Sans', fontWeight: '400', lineHeight: '19.50px' }}>{detailedProjectInfo?.nama || "Pembangunan Gudang Cikarang Fase 2"}</div>
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

        {/* Table Column Headers */}
        <div style={{
          alignSelf: 'stretch',
          padding: '14px 40px 10px 40px',
          borderBottom: '0.80px #E6E1D4 solid',
          display: 'grid',
          gridTemplateColumns: '380px 190px 215px 215px',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ color: '#9A948B', fontSize: 10.50, fontFamily: 'Plus Jakarta Sans', fontWeight: '700', letterSpacing: 0.63, textTransform: 'uppercase' }}>MAIN · SUB · KETERANGAN</div>
          <div style={{ color: '#9A948B', fontSize: 10.50, fontFamily: 'Plus Jakarta Sans', fontWeight: '700', letterSpacing: 0.63, textTransform: 'uppercase', textAlign: 'center' }}>PROGRESS</div>
          <div style={{ color: '#9A948B', fontSize: 10.50, fontFamily: 'Plus Jakarta Sans', fontWeight: '700', letterSpacing: 0.63, textTransform: 'uppercase', textAlign: 'center' }}>ALOKASI</div>
          <div style={{ color: '#9A948B', fontSize: 10.50, fontFamily: 'Plus Jakarta Sans', fontWeight: '700', letterSpacing: 0.63, textTransform: 'uppercase', textAlign: 'center' }}>REALISASI</div>
        </div>

        {/* Scrollable Content Area */}
        <div style={{
          flex: 1,
          padding: '10px 28px 28px 28px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}>
          {posAnggaran.length > 0 ? (
            posAnggaran.map((pos: any, idxPos: number) => {
              const hasSub = pos.subAnggaran && pos.subAnggaran.length > 0;
              const isMainOpen = hasSub && expandedMain[idxPos] !== false;

              // --- 1. KALKULASI PADA TINGKAT MAIN ---
              // Alokasi MAIN selalu pakai nominalAlokasi milik MAIN sendiri — Sub/Keterangan adalah
              // subdivisi dari alokasi ini, bukan penjumlahan yang menggantikannya.
              const alokasiPos = parseFloat(pos.nominalAlokasi) || 0;

              // Realisasi MAIN: Akumulasi seluruh realisasi dari anak-anaknya
              const terpakaiPos = hasSub
                ? pos.subAnggaran.reduce((accSub: number, sub: any) => {
                    const hasKet = sub.keterangan && sub.keterangan.length > 0;
                    const subRealisasi = hasKet
                      ? sub.keterangan.reduce((accKet: number, k: any) => {
                          const reimbs = (k.reimbursements || []).filter((r: any) =>
                            ['APPROVED'].includes(r.status)
                          );
                          const sumReimbs = reimbs.reduce((accR: number, r: any) => accR + (parseFloat(r.nominal) || 0), 0);
                          return accKet + (sumReimbs || parseFloat(k.nominalRealisasi) || 0);
                        }, 0)
                      : parseFloat(sub.nominalTerpakai) || 0;
                    return accSub + subRealisasi;
                  }, 0)
                : parseFloat(pos.nominalTerpakai) || 0;

              const pctPos = alokasiPos > 0 ? Math.min((terpakaiPos / alokasiPos) * 100, 100) : 0;
              // Ini bisa ubah toFixed buat ngubah angka dibelakang koma
              const pctPosText = alokasiPos > 0 ? ((terpakaiPos / alokasiPos) * 100).toFixed(1) : '0.0';
              const pctPosExact = alokasiPos > 0 ? ((terpakaiPos / alokasiPos) * 100).toFixed(5) : '0.00000';

              let mainBarColor = '#2F9E5E';
              if (pctPos >= 90) { mainBarColor = '#D36C66'; }
              else if (pctPos >= 75) { mainBarColor = '#D8953D'; }

              return (
                <div key={pos.id || idxPos} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {/* MAIN Row */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '380px 190px 215px 215px',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: '#F6F4EF',
                      borderRadius: 10,
                      cursor: hasSub ? 'pointer' : 'default',
                      userSelect: 'none'
                    }}
                    onClick={() => {
                      if (hasSub) {
                        setExpandedMain(prev => ({ ...prev, [idxPos]: !isMainOpen }));
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {hasSub ? (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                          style={{
                            flexShrink: 0,
                            transition: 'transform 0.15s ease',
                            transform: isMainOpen ? 'rotate(0deg)' : 'rotate(-90deg)'
                          }}
                        >
                          <path d="M2 3.5L5 6.5L8 3.5" stroke="#14130F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <div style={{ width: 10 }} />
                      )}
                      <span style={{ background: '#E6E1D4', color: '#14130F', fontSize: 9.50, fontFamily: 'Plus Jakarta Sans', fontWeight: '700', padding: '2px 6px', borderRadius: 4 }}>
                        MAIN
                      </span>
                      <span style={{ color: '#14130F', fontSize: 13, fontFamily: 'Plus Jakarta Sans', fontWeight: '700', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {pos.namaPos || pos.deskripsi}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 10 }}>
                      <div style={{ flex: 1, height: 8, background: '#E6E1D4', overflow: 'hidden', borderRadius: 99 }}>
                        <div style={{ width: `${pctPos}%`, height: '100%', background: mainBarColor, borderRadius: 99 }} />
                      </div>
                      <span
                        style={{ color: '#005836', fontSize: 11.50, fontFamily: 'IBM Plex Mono', fontWeight: '700', minWidth: 42, textAlign: 'left' }}
                        title={`${pctPosExact}%`}
                      >
                        {pctPosText}%
                      </span>
                    </div>

                    <div style={{ color: '#14130F', fontSize: 12.50, fontFamily: 'IBM Plex Mono', fontWeight: '700', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {formatFullCurrency(alokasiPos)}
                    </div>

                    <div style={{ color: '#14130F', fontSize: 12.50, fontFamily: 'IBM Plex Mono', fontWeight: '700', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {formatFullCurrency(terpakaiPos)}
                    </div>
                  </div>

                  {/* SUB Rows */}
                  {isMainOpen && pos.subAnggaran.map((sub: any, idxSub: number) => {
                    const hasKet = sub.keterangan && sub.keterangan.length > 0;
                    const subKey = `${idxPos}-${idxSub}`;
                    const isSubOpen = hasKet && expandedSub[subKey] !== false;

                    // --- 2. KALKULASI PADA TINGKAT SUB ---
                    // Alokasi Sub selalu pakai nominalAlokasi milik Sub sendiri — Keterangan adalah
                    // subdivisi dari alokasi ini, bukan penjumlahan yang menggantikannya.
                    const alokasiSub = parseFloat(sub.nominalAlokasi) || 0;

                    // Realisasi Sub = Sum Realisasi Keterangan
                    const terpakaiSub = hasKet
                      ? sub.keterangan.reduce((acc: number, k: any) => {
                          const reimbs = (k.reimbursements || []).filter((r: any) =>
                            ['APPROVED'].includes(r.status)
                          );
                          const sumReimbs = reimbs.reduce((accR: number, r: any) => accR + (parseFloat(r.nominal) || 0), 0);
                          return acc + (sumReimbs || parseFloat(k.nominalRealisasi) || 0);
                        }, 0)
                      : parseFloat(sub.nominalTerpakai) || 0;

                    const pctSub = alokasiSub > 0 ? Math.min((terpakaiSub / alokasiSub) * 100, 100) : 0;
                    const pctSubText = alokasiSub > 0 ? ((terpakaiSub / alokasiSub) * 100).toFixed(1) : '0.0';
                    const pctSubExact = alokasiSub > 0 ? ((terpakaiSub / alokasiSub) * 100).toFixed(5) : '0.00000';

                    let subBarColor = '#2F9E5E';
                    if (pctSub >= 90) { subBarColor = '#D36C66'; }
                    else if (pctSub >= 75) { subBarColor = '#D8953D'; }

                    return (
                      <div key={sub.id || idxSub} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '380px 190px 215px 215px',
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: 'white',
                            cursor: hasKet ? 'pointer' : 'default',
                            userSelect: 'none'
                          }}
                          onClick={() => {
                            if (hasKet) {
                              setExpandedSub(prev => ({ ...prev, [subKey]: !isSubOpen }));
                            }
                          }}
                          className="hover:bg-stone-50 transition"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 24 }}>
                            {hasKet ? (
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 10 10"
                                fill="none"
                                style={{
                                  flexShrink: 0,
                                  transition: 'transform 0.15s ease',
                                  transform: isSubOpen ? 'rotate(0deg)' : 'rotate(-90deg)'
                                }}
                              >
                                <path d="M2 3.5L5 6.5L8 3.5" stroke="#14130F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : (
                              <div style={{ width: 10 }} />
                            )}
                            <span style={{ color: '#9A948B', fontSize: 10.50, fontFamily: 'Plus Jakarta Sans', fontWeight: '700', textTransform: 'uppercase' }}>
                              Sub
                            </span>
                            <span style={{ color: '#14130F', fontSize: 12.50, fontFamily: 'Plus Jakarta Sans', fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              · {sub.namaSub}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 10 }}>
                            <div style={{ flex: 1, height: 8, background: '#E6E1D4', overflow: 'hidden', borderRadius: 99 }}>
                              <div style={{ width: `${pctSub}%`, height: '100%', background: subBarColor, borderRadius: 99 }} />
                            </div>
                            <span
                              style={{ color: '#005836', fontSize: 11.50, fontFamily: 'IBM Plex Mono', fontWeight: '700', minWidth: 42, textAlign: 'left' }}
                              title={`${pctSubExact}%`}
                            >
                              {pctSubText}%
                            </span>
                          </div>

                          <div style={{ color: '#14130F', fontSize: 12, fontFamily: 'IBM Plex Mono', fontWeight: '400', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            {formatFullCurrency(alokasiSub)}
                          </div>

                          <div style={{ color: '#14130F', fontSize: 12, fontFamily: 'IBM Plex Mono', fontWeight: '400', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            {formatFullCurrency(terpakaiSub)}
                          </div>
                        </div>

                        {/* KET Rows */}
                        {isSubOpen && sub.keterangan.map((ket: any, idxKet: number) => {
                          const alokasiKet = parseFloat(ket.nominalAlokasi) || 0;

                          const childReimbursements = ket.reimbursements || [];
                          const approvedReimbs = childReimbursements.filter((r: any) =>
                            ['APPROVED', 'APPROVED_BY_PM', 'SUBMITTED', 'PAID', 'DISBURSED'].includes(r.status)
                          );
                          const hasReimbs = approvedReimbs.length > 0;

                          // --- 3. KALKULASI PADA TINGKAT KETERANGAN (Ket sum) ---
                          // Realisasi Ket = Sum Reimbursement yang disetujui (atau fallback ke nominalRealisasi bawaan)
                          const disbursedReimbs = childReimbursements.filter((r: any) =>
                            ['APPROVED'].includes(r.status)
                          );
                          const realisasiKet = hasReimbs
                            ? disbursedReimbs.reduce((accR: number, r: any) => accR + (parseFloat(r.nominal) || 0), 0)
                            : parseFloat(ket.nominalRealisasi) || 0;

                          const ketKey = `${subKey}-${idxKet}`;
                          const isKetOpen = hasReimbs && expandedKet[ketKey] !== false;

                          return (
                            <div key={ket.id || idxKet} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: '380px 190px 215px 215px',
                                  alignItems: 'center',
                                  padding: '6px 12px',
                                  background: 'white',
                                  cursor: hasReimbs ? 'pointer' : 'default',
                                  userSelect: 'none'
                                }}
                                onClick={() => {
                                  if (hasReimbs) {
                                    setExpandedKet(prev => ({ ...prev, [ketKey]: !isKetOpen }));
                                  }
                                }}
                                className={hasReimbs ? "hover:bg-stone-50 transition" : ""}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 48 }}>
                                  {hasReimbs ? (
                                    <svg
                                      width="10"
                                      height="10"
                                      viewBox="0 0 10 10"
                                      fill="none"
                                      style={{
                                        flexShrink: 0,
                                        transition: 'transform 0.15s ease',
                                        transform: isKetOpen ? 'rotate(0deg)' : 'rotate(-90deg)'
                                      }}
                                    >
                                      <path d="M2 3.5L5 6.5L8 3.5" stroke="#6A6660" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  ) : (
                                    <div style={{ width: 10 }} />
                                  )}
                                  <span style={{ color: '#9A948B', fontSize: 10, fontFamily: 'Plus Jakarta Sans', fontWeight: '700', textTransform: 'uppercase' }}>
                                    Ket
                                  </span>
                                  <span style={{ color: '#6A6660', fontSize: 12, fontFamily: 'Plus Jakarta Sans', fontWeight: '400', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                    · {ket.keterangan}
                                  </span>
                                </div>

                                <div />

                                <div style={{ color: '#6A6660', fontSize: 11.50, fontFamily: 'IBM Plex Mono', fontWeight: '400', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                  {formatFullCurrency(alokasiKet)}
                                </div>

                                <div style={{ color: '#6A6660', fontSize: 11.50, fontFamily: 'IBM Plex Mono', fontWeight: '400', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                  {formatFullCurrency(realisasiKet)}
                                </div>
                              </div>

                              {/* Approved Reimbursements List */}
                              {isKetOpen && approvedReimbs.map((reimb: any) => {
                                const formattedDate = formatReimbursementDate(reimb);
                                const nominalReimb = reimb.nominal || 0;

                                const getStatusBadgeStyles = (status: string) => {
                                  if (status === 'APPROVED' || status === 'PAID' || status === 'DISBURSED') {
                                    return { background: 'rgba(0, 145, 98, 0.12)', color: '#005836' };
                                  }
                                  if (status === 'APPROVED_BY_PM') {
                                    return { background: 'rgba(29, 99, 184, 0.12)', color: '#1D63B8' };
                                  }
                                  return { background: 'rgba(216, 149, 61, 0.12)', color: '#894C06' };
                                };

                                const getStatusLabelText = (status: string) => {
                                  if (status === 'APPROVED' || status === 'PAID' || status === 'DISBURSED') {
                                    return 'Dicairkan';
                                  }
                                  if (status === 'APPROVED_BY_PM') {
                                    return 'Menunggu Keuangan';
                                  }
                                  return 'Menunggu PM';
                                };

                                const badgeStyle = getStatusBadgeStyles(reimb.status);
                                const statusLabel = getStatusLabelText(reimb.status);
                                const reimbName = (reimb.ocrData as any)?.merchant || (reimb.ocrData as any)?.keterangan || 'Reimbursement';

                                return (
                                  <div key={reimb.id} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '380px 190px 215px 215px',
                                    alignItems: 'center',
                                    padding: '4px 12px',
                                    background: 'rgba(0, 145, 98, 0.02)'
                                  }}>
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      paddingLeft: 72,
                                      overflow: 'hidden'
                                    }}>
                                      <span style={{ color: '#005D8D', fontSize: 9.50, fontFamily: 'Plus Jakarta Sans', fontWeight: '700', textTransform: 'uppercase', flexShrink: 0 }}>
                                        Reimb
                                      </span>
                                      <span style={{ color: '#9A948B', fontSize: 11.50, fontFamily: 'Plus Jakarta Sans', flexShrink: 0 }}>
                                        ·
                                      </span>
                                      <span style={{
                                        color: '#9A948B',
                                        fontSize: 11.50,
                                        fontFamily: 'Plus Jakarta Sans',
                                        fontWeight: '400',
                                        textOverflow: 'ellipsis',
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap',
                                        maxWidth: 140,
                                        flexShrink: 1
                                      }} title={reimbName}>
                                        {reimbName}
                                      </span>
                                      <span style={{ color: '#9A948B', fontSize: 11.50, fontFamily: 'Plus Jakarta Sans', flexShrink: 0 }}>
                                        ·
                                      </span>
                                      <span style={{
                                        color: '#9A948B',
                                        fontSize: 11.50,
                                        fontFamily: 'Plus Jakarta Sans',
                                        fontWeight: '400',
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0
                                      }}>
                                        {formattedDate}
                                      </span>
                                      <span style={{
                                        padding: '2px 8px',
                                        borderRadius: 999,
                                        fontSize: 10,
                                        fontFamily: 'Plus Jakarta Sans',
                                        fontWeight: '600',
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0,
                                        ...badgeStyle
                                      }}>
                                        {statusLabel}
                                      </span>
                                    </div>

                                    <div />
                                    <div />

                                    <div style={{ color: '#6A6660', fontSize: 11, fontFamily: 'IBM Plex Mono', fontWeight: '400', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                      {formatFullCurrency(nominalReimb)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })
          ) : (
            <div style={{ padding: '60px 24px', textAlign: 'center', border: '1px solid #E6E1D4', borderRadius: 12 }}>
              <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 14, color: '#14130F', marginBottom: 6 }}>Data Anggaran Kosong</div>
              <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 400, fontSize: 12.5, color: '#9A948B' }}>Belum ada data nilai proyek atau pos anggaran yang diinisialisasi.</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 28px',
          borderTop: '0.80px #E6E1D4 solid',
          display: 'flex',
          justifyContent: 'flex-end',
          flexShrink: 0,
          background: 'white'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 24px',
              background: 'black',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Plus Jakarta Sans',
              fontWeight: 600,
              fontSize: 13,
              color: 'white',
              textAlign: 'center',
            }}
            className="hover:opacity-80 transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}