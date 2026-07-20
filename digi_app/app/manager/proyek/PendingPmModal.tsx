import React from "react";
import { X } from "lucide-react";

type Props = {
  showPendingPmModal: boolean;
  onClose: () => void;
  detailedProjectInfo: any;
  pendingPengajuan: any[];
  selectedPendingIds: Record<number, boolean>;
  setSelectedPendingIds: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  expandedSub: Record<string, boolean>;
  setExpandedSub: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  rejectingPengajuan: any;
  setRejectingPengajuan: (v: any) => void;
  rejectionReason: string;
  setRejectionReason: (v: string) => void;
  handleBulkReview: (action: 'APPROVE' | 'REJECT', catatan?: string) => Promise<void>;
};

export default function PendingPmModal({
  showPendingPmModal,
  onClose,
  detailedProjectInfo,
  pendingPengajuan,
  selectedPendingIds,
  setSelectedPendingIds,
  expandedSub,
  setExpandedSub,
  rejectingPengajuan,
  setRejectingPengajuan,
  rejectionReason,
  setRejectionReason,
  handleBulkReview,
}: Props) {
  if (!showPendingPmModal) return null;

  const mainAnggaranList = detailedProjectInfo?.budget?.mainAnggaran || [];

  const submissions: any[] = [];
  (pendingPengajuan || []).forEach((prop: any) => {
    (prop.items || []).forEach((it: any) => {
      const isSub = it.tipe === 'SUB_ANGGARAN';
      submissions.push({
        id: it.id,
        pengajuanId: prop.id,
        judul: prop.judul,
        deskripsi: prop.deskripsi,
        user: prop.pengaju,
        createdAt: prop.createdAt,
        nominal: it.nominalAlokasi != null ? Number(it.nominalAlokasi) : 0,
        tipe: it.tipe,
        aksi: it.aksi,
        nama: it.nama,
        parentId: it.parentId,
        targetId: it.targetId,
        subAnggaran: isSub ? {
          namaSub: it.nama,
          mainAnggaran: { id: it.parentId }
        } : null,
        keteranganAnggaran: !isSub ? {
          keterangan: it.nama,
          subAnggaranId: it.parentId
        } : null,
      });
    });
  });

  const anySelected = submissions.some((r: any) => selectedPendingIds[r.id]);
  const selectedCount = submissions.filter((r: any) => selectedPendingIds[r.id]).length;

  const handleToggleAllSelect = () => {
    const next: Record<number, boolean> = {};
    const setTo = !anySelected;
    submissions.forEach((r: any) => {
      next[r.id] = setTo;
    });
    setSelectedPendingIds(next);
  };

  const handleBulkApprove = async () => {
    await handleBulkReview('APPROVE');
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: 'rgba(20, 18, 14, 0.60)' }}>
      <div style={{
        width: 820,
        height: 680,
        maxHeight: '85vh',
        background: 'white',
        boxShadow: '0px 24px 64px rgba(20, 18, 14, 0.30)',
        borderRadius: 22,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
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
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 17, color: '#14130F', lineHeight: '25.50px' }}>Pengajuan Pos PM</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: 12.5, color: '#6A6660', lineHeight: '18.75px' }}>{detailedProjectInfo?.nama || 'Nama Proyek'}</div>
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

        {/* Body */}
        <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {submissions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                <button
                  type="button"
                  onClick={handleToggleAllSelect}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 7,
                    border: '1px solid #009162',
                    background: anySelected ? 'rgba(0, 145, 98, 0.05)' : 'white',
                    display: 'inline-flex',
                    cursor: 'pointer',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: 11.5,
                    color: '#005836'
                  }}
                  className="hover:opacity-80 transition"
                >
                  {anySelected ? `Batalkan Semua (${selectedCount})` : `Pilih Semua (${submissions.length})`}
                </button>
              </div>

              <div style={{ borderRadius: 10, border: '1px solid #E6E1D4', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {mainAnggaranList.map((main: any, gi: number) => {
                  const mainPending = submissions.filter((r: any) => {
                    if (r.tipe === 'SUB_ANGGARAN') {
                      return Number(r.parentId) === Number(main.id);
                    } else {
                      const isChildOfExistingSub = (main.subAnggaran || []).some((s: any) => Number(s.id) === Number(r.parentId));
                      if (isChildOfExistingSub) return true;

                      const parentPendingSub = submissions.find((sub: any) => sub.tipe === 'SUB_ANGGARAN' && Number(sub.targetId) === Number(r.parentId));
                      if (parentPendingSub && Number(parentPendingSub.parentId) === Number(main.id)) return true;

                      return false;
                    }
                  });

                  const subAnggarans = main.subAnggaran || [];
                  if (subAnggarans.length === 0 && mainPending.length === 0) return null;

                  return (
                    <div key={main.id} style={{ borderBottom: gi < mainAnggaranList.length - 1 ? '1px solid #E6E1D4' : 'none' }}>
                      <div style={{
                        padding: '9px 12px',
                        background: 'white',
                        borderBottom: '1px solid #E6E1D4',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 700,
                        fontSize: 12.5,
                        color: '#14130F',
                      }}>
                        {main.namaMain}
                      </div>

                      {subAnggarans.map((sub: any) => {
                        const childPendingKets = mainPending.filter((r: any) => {
                          return r.tipe === 'KETERANGAN' && Number(r.parentId) === Number(sub.id);
                        });

                        const subKey = `modal-sub-${sub.id}`;
                        const isSubOpen = expandedSub[subKey] !== false;
                        const hasChildren = (sub.keterangan?.length > 0) || (childPendingKets.length > 0);

                        return (
                          <div key={sub.id} style={{ display: 'flex', flexDirection: 'column' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '7px 12px 7px 14px',
                                borderBottom: (hasChildren && isSubOpen) ? '1px solid #E6E1D4' : 'none',
                                background: 'white',
                                cursor: 'pointer',
                                userSelect: 'none',
                              }}
                              onClick={() => setExpandedSub(prev => ({ ...prev, [subKey]: !isSubOpen }))}
                              className="hover:bg-stone-50 transition"
                            >
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 10 10"
                                fill="none"
                                style={{
                                  marginRight: 8,
                                  flexShrink: 0,
                                  transition: 'transform 0.15s ease',
                                  transform: isSubOpen ? 'rotate(0deg)' : 'rotate(-90deg)'
                                }}
                              >
                                <path d="M2 3.5L5 6.5L8 3.5" stroke="#14130F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <span style={{ flex: 1, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 12, color: '#14130F' }}>
                                {sub.namaSub}
                              </span>
                              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 400, fontSize: 11, color: '#9A948B' }}>
                                Rp {Number(sub.nominalAlokasi).toLocaleString('id-ID')}
                              </span>
                            </div>

                            {isSubOpen && (
                              <>
                                {(sub.keterangan || []).map((ket: any) => {
                                  const alokasi = Number(ket.nominalAlokasi) || 0;
                                  return (
                                    <div key={`existing-ket-${ket.id}`} style={{
                                      background: 'white',
                                      borderBottom: '1px solid #E6E1D4',
                                      padding: '7px 12px 7px 34px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                    }}>
                                      <div style={{ width: 22 }} />
                                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ color: '#9A948B', fontSize: 10, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
                                          KET
                                        </span>
                                        <span style={{ color: '#6A6660', fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                          {ket.keterangan}
                                        </span>
                                      </div>
                                      <div style={{ color: '#6A6660', fontSize: 11.50, fontFamily: "'IBM Plex Mono', monospace" }}>
                                        Rp {alokasi.toLocaleString('id-ID')}
                                      </div>
                                    </div>
                                  );
                                })}

                                {childPendingKets.map((r: any) => {
                                  const isChecked = !!selectedPendingIds[r.id];
                                  const itemDate = r.createdAt || new Date();
                                  const formattedDate = new Date(itemDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                                  const submitterName = r.user?.nama || 'Project Manager';
                                  const nominal = r.nominal || 0;

                                  return (
                                    <div key={`pending-ket-${r.id}`} style={{
                                      background: isChecked ? '#D5F4E3' : 'white',
                                      borderBottom: '1px solid #E6E1D4',
                                      padding: '7px 12px 7px 34px',
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      gap: 8,
                                      transition: 'background-color 0.2s ease',
                                    }}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedPendingIds(prev => ({ ...prev, [r.id]: !prev[r.id] }));
                                        }}
                                        style={{ background: 'transparent', border: 'none', padding: '3px 4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                      >
                                        <div style={{
                                          width: 14,
                                          height: 14,
                                          borderRadius: 4,
                                          background: isChecked ? '#009162' : 'white',
                                          border: isChecked ? 'none' : '1.20px solid #E6E1D4',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                        }}>
                                          {isChecked && (
                                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                              <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                          )}
                                        </div>
                                      </button>

                                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                          <span style={{ color: '#005D8D', fontSize: 9.50, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
                                            KETERANGAN BARU
                                          </span>
                                          <span style={{ color: '#14130F', fontSize: 12.50, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
                                            {r.nama}
                                          </span>
                                          <span style={{ padding: '2px 6px', background: 'rgba(216, 149, 61, 0.15)', borderRadius: 5, color: '#894C06', fontSize: 9.50, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
                                            MENUNGGU
                                          </span>
                                        </div>
                                        {r.deskripsi && r.deskripsi !== 'N/A' && (
                                          <div style={{ color: '#9A948B', fontSize: 11, fontFamily: "'Plus Jakarta Sans', sans-serif", fontStyle: 'italic' }}>
                                            &ldquo;{r.deskripsi}&rdquo;
                                          </div>
                                        )}
                                        <div style={{ color: '#9A948B', fontSize: 10.50, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                          Diajukan oleh <span style={{ color: '#2C2A24', fontWeight: 700 }}>{submitterName}</span> · {formattedDate}
                                        </div>
                                      </div>

                                      <div style={{ color: '#14130F', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, whiteSpace: 'nowrap' }}>
                                        Rp {Number(nominal).toLocaleString('id-ID')}
                                      </div>
                                    </div>
                                  );
                                })}
                              </>
                            )}
                          </div>
                        );
                      })}

                      {mainPending.filter((r: any) => r.tipe === 'SUB_ANGGARAN' && Number(r.parentId) === Number(main.id)).map((r: any) => {
                        const isChecked = !!selectedPendingIds[r.id];
                        const subName = r.nama || 'Sub Baru';
                        const itemDate = r.createdAt || new Date();
                        const formattedDate = new Date(itemDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                        const submitterName = r.user?.nama || 'Project Manager';
                        const nominal = r.nominal || 0;

                        const subKey = `modal-sub-pending-${r.id}`;
                        const isSubOpen = expandedSub[subKey] !== false;

                        const childPendingKets = mainPending.filter((c: any) => {
                          return c.tipe === 'KETERANGAN' && Number(c.parentId) === Number(r.targetId);
                        });

                        const hasChildren = childPendingKets.length > 0;

                        return (
                          <div key={r.id} style={{ display: 'flex', flexDirection: 'column' }}>
                            <div
                              style={{
                                background: isChecked ? '#D5F4E3' : 'white',
                                borderTop: '1px solid #E6E1D4',
                                padding: '7px 12px 7px 14px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 6,
                                transition: 'background-color 0.2s ease',
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => setExpandedSub(prev => ({ ...prev, [subKey]: !isSubOpen }))}
                                style={{ background: 'transparent', border: 'none', padding: '4px 2px', cursor: hasChildren ? 'pointer' : 'default', display: 'flex', alignItems: 'center', flexShrink: 0, marginTop: 1 }}
                              >
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 10 10"
                                  fill="none"
                                  style={{
                                    transition: 'transform 0.15s ease',
                                    transform: isSubOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                                    opacity: hasChildren ? 1 : 0,
                                  }}
                                >
                                  <path d="M2 3.5L5 6.5L8 3.5" stroke="#6A6660" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedPendingIds(prev => ({ ...prev, [r.id]: !prev[r.id] }))
                                }
                                style={{ background: 'transparent', border: 'none', padding: '3px 2px', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0, marginTop: 1 }}
                              >
                                <div style={{
                                  width: 14,
                                  height: 14,
                                  borderRadius: 4,
                                  background: isChecked ? '#009162' : 'white',
                                  border: isChecked ? 'none' : '1px solid #6A6660',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}>
                                  {isChecked && (
                                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                      <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </div>
                              </button>

                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <span style={{ color: '#005836', fontSize: 9.50, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, letterSpacing: 0.28 }}>
                                    SUB BARU
                                  </span>
                                  <span style={{ color: '#14130F', fontSize: 12.50, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
                                    {subName}
                                  </span>
                                  <span style={{ padding: '2px 6px', background: 'rgba(216, 149, 61, 0.15)', borderRadius: 5, color: '#894C06', fontSize: 9.50, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
                                    MENUNGGU
                                  </span>
                                </div>
                                <div style={{ color: '#9A948B', fontSize: 10.50, fontFamily: "'Plus Jakarta Sans', sans-serif", paddingTop: 2 }}>
                                  Diajukan oleh <span style={{ color: '#2C2A24', fontWeight: 700 }}>{submitterName}</span> · {formattedDate}
                                </div>
                              </div>

                              <div style={{ color: '#14130F', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, whiteSpace: 'nowrap' }}>
                                Rp {Number(nominal).toLocaleString('id-ID')}
                              </div>
                            </div>

                            {isSubOpen && childPendingKets.map((c: any) => {
                              const isChildChecked = !!selectedPendingIds[c.id];
                              const cDate = c.createdAt || new Date();
                              const cFormattedDate = new Date(cDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                              const cSubmitterName = c.user?.nama || 'Project Manager';
                              const cNominal = c.nominal || 0;

                              return (
                                <div key={c.id} style={{
                                  background: isChildChecked ? '#D5F4E3' : 'white',
                                  borderTop: '1px solid #E6E1D4',
                                  padding: '7px 12px 7px 44px',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 8,
                                  transition: 'background-color 0.2s ease',
                                }}>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedPendingIds(prev => ({ ...prev, [c.id]: !prev[c.id] }))
                                    }
                                    style={{ background: 'transparent', border: 'none', padding: '3px 4px', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                                  >
                                    <div style={{
                                      width: 14,
                                      height: 14,
                                      borderRadius: 4,
                                      background: isChildChecked ? '#009162' : 'white',
                                      border: isChildChecked ? 'none' : '1px solid #6A6660',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}>
                                      {isChildChecked && (
                                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                          <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                      )}
                                    </div>
                                  </button>

                                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                      <span style={{ color: '#005D8D', fontSize: 9.50, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, letterSpacing: 0.28 }}>
                                        KETERANGAN BARU
                                      </span>
                                      <span style={{ color: '#14130F', fontSize: 12.50, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
                                        {c.nama}
                                      </span>
                                      <span style={{ padding: '2px 6px', background: 'rgba(216, 149, 61, 0.15)', borderRadius: 5, color: '#894C06', fontSize: 9.50, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
                                        MENUNGGU
                                      </span>
                                    </div>
                                    <div style={{ color: '#9A948B', fontSize: 10.50, fontFamily: "'Plus Jakarta Sans', sans-serif", paddingTop: 2 }}>
                                      Diajukan oleh <span style={{ color: '#2C2A24', fontWeight: 700 }}>{cSubmitterName}</span> · {cFormattedDate}
                                    </div>
                                  </div>

                                  <div style={{ color: '#14130F', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, whiteSpace: 'nowrap' }}>
                                    Rp {Number(cNominal).toLocaleString('id-ID')}
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
            </div>
          ) : (
            <div style={{ padding: '48px 24px', textAlign: 'center', border: '1px solid #E6E1D4', borderRadius: 12, background: 'white' }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: '#14130F', marginBottom: 6 }}>Tidak Ada Pengajuan PM Pending</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: 12.5, color: '#9A948B' }}>Saat ini tidak ada pengajuan pos anggaran yang menunggu persetujuan Direktur.</div>
            </div>
          )}
        </div>

        {/* Bottom bulk selected summary bar */}
        {selectedCount > 0 && (
          <div style={{
            alignSelf: 'stretch',
            background: '#D5F4E3',
            padding: '12px 24px',
            borderTop: '0.80px #E6E1D4 solid',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}>
            <div style={{ color: '#005836', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
              {selectedCount} pos dipilih
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  const itemsToReject = submissions.filter((r: any) => selectedPendingIds[r.id]);
                  setRejectingPengajuan(itemsToReject);
                  setRejectionReason("");
                }}
                style={{
                  padding: '9px 14px',
                  background: 'white',
                  border: '0.80px solid #E6E1D4',
                  borderRadius: 12,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  color: '#14130F',
                  cursor: 'pointer'
                }}
                className="hover:bg-stone-50 transition"
              >
                Tolak Terpilih ({selectedCount})
              </button>
              <button
                type="button"
                onClick={handleBulkApprove}
                style={{
                  padding: '9px 14px',
                  background: 'black',
                  border: 'none',
                  borderRadius: 12,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  color: 'white',
                  cursor: 'pointer'
                }}
                className="hover:opacity-80 transition"
              >
                Setujui Terpilih ({selectedCount})
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
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
              padding: '9px 14px',
              background: 'white',
              borderRadius: 12,
              border: '1px solid #E6E1D4',
              cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              fontSize: 13,
              color: '#14130F',
              textAlign: 'center',
            }}
            className="hover:bg-stone-50 transition"
          >
            Tutup
          </button>
        </div>

        {/* Overlay Modal Tolak */}
        {rejectingPengajuan && (() => {
          const isArray = Array.isArray(rejectingPengajuan);
          const itemsList = isArray ? rejectingPengajuan : [rejectingPengajuan];

          let subtitle = "";
          if (itemsList.length === 1) {
            subtitle = itemsList[0]?.nama || '1 pengajuan';
          } else {
            subtitle = `${itemsList.length} pengajuan terpilih`;
          }

          return (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ background: 'rgba(20, 18, 14, 0.60)' }}>
              <div style={{
                width: 560,
                background: 'white',
                boxShadow: '0px 24px 64px rgba(20, 18, 14, 0.30)',
                borderRadius: 22,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                animation: 'fadeIn 0.2s ease',
                textAlign: 'left'
              }}>
                <div style={{
                  padding: '20px 24px',
                  borderBottom: '0.80px #E6E1D4 solid',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 17, color: '#14130F', lineHeight: '25.50px' }}>Tolak Pengajuan</div>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: 12.5, color: '#6A6660', lineHeight: '18.75px' }}>{subtitle}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRejectingPengajuan(null)}
                    style={{ padding: '6px 10px', borderRadius: 12, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    className="hover:bg-stone-100 transition"
                  >
                    <X size={16} color="#2C2A24" />
                  </button>
                </div>

                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 13, color: '#14130F' }}>
                    Alasan <span style={{ color: '#D36C66' }}>*</span>
                  </label>
                  <textarea
                    placeholder="Jelaskan alasan penolakan..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    style={{
                      width: '100%',
                      height: 120,
                      padding: 12,
                      border: '1.20px solid #E6E1D4',
                      borderRadius: 12,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 13,
                      color: '#14130F',
                      resize: 'none',
                      outline: 'none',
                    }}
                    className="focus:border-stone-500 transition"
                  />
                </div>

                <div style={{
                  padding: '14px 24px',
                  borderTop: '0.80px #E6E1D4 solid',
                  display: 'flex',
                  gap: 8,
                }}>
                  <button
                    type="button"
                    onClick={() => setRejectingPengajuan(null)}
                    style={{
                      flex: 1,
                      padding: '9px 14px',
                      background: 'white',
                      borderRadius: 12,
                      border: '0.80px solid #E6E1D4',
                      cursor: 'pointer',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: 600,
                      fontSize: 13,
                      color: '#14130F',
                      textAlign: 'center',
                    }}
                    className="hover:bg-stone-50 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!rejectionReason.trim()) {
                        alert("Alasan penolakan wajib diisi");
                        return;
                      }
                      await handleBulkReview('REJECT', rejectionReason);
                    }}
                    style={{
                      flex: 1,
                      padding: '9px 14px',
                      background: 'black',
                      borderRadius: 12,
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: 600,
                      fontSize: 13,
                      color: 'white',
                      textAlign: 'center',
                    }}
                    className="hover:opacity-80 transition"
                  >
                    Kirim Penolakan
                  </button>
                </div>

              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}