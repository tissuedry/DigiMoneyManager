import React, { useState } from "react";
import { X } from "lucide-react";
import ConfirmDialog from "@/components/confirm-dialog";

type Props = {
  showPendingPmModal: boolean;
  onClose: () => void;
  detailedProjectInfo: any;
  pendingPengajuan: any[];
  selectedIds: Record<number, boolean>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  rejectingPengajuan: any;
  setRejectingPengajuan: (v: any) => void;
  rejectionReason: string;
  setRejectionReason: (v: string) => void;
  handleBulkReview: (action: 'APPROVE' | 'REJECT', catatan?: string) => Promise<void>;
};

function formatRp(n: number): string {
  return `Rp ${Math.round(Number(n) || 0).toLocaleString('id-ID')}`;
}

export default function PendingPmModal({
  showPendingPmModal,
  onClose,
  detailedProjectInfo,
  pendingPengajuan,
  selectedIds,
  setSelectedIds,
  rejectingPengajuan,
  setRejectingPengajuan,
  rejectionReason,
  setRejectionReason,
  handleBulkReview,
}: Props) {
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [isApprovingBulk, setIsApprovingBulk] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (!showPendingPmModal) return null;

  const anySelected = (pendingPengajuan || []).some((p: any) => selectedIds[p.id]);
  const selectedCount = (pendingPengajuan || []).filter((p: any) => selectedIds[p.id]).length;

  const handleToggleAll = () => {
    const setTo = !anySelected;
    const next: Record<number, boolean> = {};
    (pendingPengajuan || []).forEach((p: any) => {
      next[p.id] = setTo;
    });
    setSelectedIds(next);
  };

  const handleToggle = (id: number) => {
    setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleBulkApprove = async () => {
    setIsApprovingBulk(true);
    try {
      await handleBulkReview('APPROVE');
      setShowApproveConfirm(false);
    } finally {
      setIsApprovingBulk(false);
    }
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
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 17, color: '#14130F', lineHeight: '25.50px' }}>Pengajuan dari Project Manager</div>
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
          {(pendingPengajuan || []).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                <button
                  type="button"
                  onClick={handleToggleAll}
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
                  {anySelected ? `Batalkan Semua (${selectedCount})` : `Pilih Semua (${(pendingPengajuan || []).length})`}
                </button>
              </div>

              <div style={{ borderRadius: 10, border: '1px solid #E6E1D4', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {(pendingPengajuan || []).map((p: any, idx: number) => {
                  const isChecked = !!selectedIds[p.id];
                  const isExpanded = expandedId === p.id;
                  const itemDate = p.createdAt || new Date();
                  const formattedDate = new Date(itemDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                  const submitterName = p.pengaju?.nama || 'Project Manager';
                  const mainName = p.mainAnggaran?.namaMain || 'Pos Anggaran';
                  const alokasiLama = Number(p.alokasiLama) || 0;
                  const alokasiBaru = Number(p.alokasiBaru) || 0;

                  return (
                    <div key={p.id} style={{ borderBottom: idx < (pendingPengajuan || []).length - 1 ? '1px solid #E6E1D4' : 'none', display: 'flex', flexDirection: 'column' }}>
                      {/* Row */}
                      <div
                        style={{
                          background: isChecked ? '#D5F4E3' : 'white',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 6,
                          transition: 'background-color 0.2s ease',
                          cursor: 'pointer',
                        }}
                        onClick={() => setExpandedId(isExpanded ? null : p.id)}
                        className="hover:bg-stone-50 transition"
                      >
                        {/* Chevron toggle */}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : p.id); }}
                          style={{ background: 'transparent', border: 'none', padding: '4px 2px', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0, marginTop: 1 }}
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 10 10"
                            fill="none"
                            style={{ transition: 'transform 0.15s ease', transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                          >
                            <path d="M2 3.5L5 6.5L8 3.5" stroke="#6A6660" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>

                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleToggle(p.id); }}
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
                            <span style={{ color: '#c2410c', fontSize: 9.50, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, letterSpacing: 0.28 }}>
                              MAIN
                            </span>
                            <span style={{ color: '#14130F', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
                              {mainName}
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
                          {formatRp(alokasiBaru)}
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div style={{ background: 'white', padding: '12px 14px 12px 40px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <div style={{ flex: 1, border: '1px solid #E6E1D4', borderRadius: 10, padding: '10px 12px', background: '#F5F4F0' }}>
                              <div style={{ fontSize: 10.5, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: '#9A948B', marginBottom: 4 }}>ANGGARAN Saat Ini</div>
                              <div style={{ fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: '#6A6660' }}>
                                {formatRp(alokasiLama)}
                              </div>
                            </div>
                            <div style={{ flex: 1, border: '1px solid #009162', borderRadius: 10, padding: '10px 12px', background: 'rgba(0, 145, 98, 0.06)' }}>
                              <div style={{ fontSize: 10.5, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: '#005836', marginBottom: 4 }}>ANGGARAN Baru</div>
                              <div style={{ fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: '#005836' }}>
                                {formatRp(alokasiBaru)}
                              </div>
                            </div>
                          </div>
                          {p.deskripsi && (
                            <div style={{ fontSize: 11.5, fontFamily: "'Plus Jakarta Sans', sans-serif", fontStyle: 'italic', color: '#6A6660' }}>
                              &ldquo;{p.deskripsi}&rdquo;
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ padding: '48px 24px', textAlign: 'center', border: '1px solid #E6E1D4', borderRadius: 12, background: 'white' }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: '#14130F', marginBottom: 6 }}>Tidak Ada Pengajuan PM Pending</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: 12.5, color: '#9A948B' }}>Saat ini tidak ada pengajuan perubahan alokasi yang menunggu persetujuan Direktur.</div>
            </div>
          )}
        </div>

        {/* Bottom bulk selected summary bar */}
        {(pendingPengajuan || []).length > 0 && (
          <div style={{
            alignSelf: 'stretch',
            background: selectedCount > 0 ? '#D5F4E3' : '#F5F4F0',
            padding: '12px 24px',
            borderTop: '0.80px #E6E1D4 solid',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}>
            <div style={{
              color: selectedCount > 0 ? '#005836' : '#6A6660',
              fontSize: 13,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700
            }}>
              {selectedCount > 0 ? `${selectedCount} pengajuan dipilih` : 'Pilih pengajuan untuk disetujui/ditolak'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={() => {
                  const itemsToReject = (pendingPengajuan || []).filter((p: any) => selectedIds[p.id]);
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
                  color: selectedCount > 0 ? '#14130F' : '#9A948B',
                  cursor: selectedCount > 0 ? 'pointer' : 'not-allowed',
                  opacity: selectedCount > 0 ? 1 : 0.6
                }}
                className={selectedCount > 0 ? "hover:bg-stone-50 transition" : ""}
              >
                Tolak Terpilih ({selectedCount})
              </button>
              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={() => setShowApproveConfirm(true)}
                style={{
                  padding: '9px 14px',
                  background: selectedCount > 0 ? '#009162' : '#9A948B',
                  border: 'none',
                  borderRadius: 12,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  color: 'white',
                  cursor: selectedCount > 0 ? 'pointer' : 'not-allowed'
                }}
                className="hover:opacity-80 transition"
              >
                Setujui Terpilih ({selectedCount})
              </button>
            </div>
          </div>
        )}

        {/* Reject reason panel */}
        {rejectingPengajuan && (
          <div style={{
            alignSelf: 'stretch',
            background: '#FDF3F2',
            padding: '14px 24px',
            borderTop: '0.80px #E6E1D4 solid',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            flexShrink: 0
          }}>
            <div style={{ fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: '#902F33' }}>
              Tolak {rejectingPengajuan.length} pengajuan — berikan alasan
            </div>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={2}
              placeholder="Alasan penolakan (opsional)…"
              style={{
                width: '100%',
                border: '1px solid #E6E1D4',
                borderRadius: 10,
                padding: '8px 10px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 12.5,
                resize: 'none',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setRejectingPengajuan(null)}
                style={{ padding: '8px 14px', background: 'white', border: '0.80px solid #E6E1D4', borderRadius: 10, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 12.5, color: '#14130F', cursor: 'pointer' }}
                className="hover:bg-stone-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleBulkReview('REJECT', rejectionReason)}
                style={{ padding: '8px 14px', background: '#c2410c', border: 'none', borderRadius: 10, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12.5, color: 'white', cursor: 'pointer' }}
                className="hover:opacity-80 transition"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showApproveConfirm}
        title="Setujui Pengajuan"
        description={
          <>
            Apakah Anda yakin ingin menyetujui{" "}
            <span className="font-semibold text-stone-900">{selectedCount}</span> pengajuan
            perubahan alokasi? Alokasi MainAnggaran akan langsung diperbarui.
          </>
        }
        confirmLabel="Setujui"
        isLoading={isApprovingBulk}
        onCancel={() => setShowApproveConfirm(false)}
        onConfirm={handleBulkApprove}
      />
    </div>
  );
}
