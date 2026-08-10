import React, { useState } from "react";
import { X } from "lucide-react";
import ConfirmDialog from "@/components/confirm-dialog";
import { formatSummaryRupiah } from "./utils";

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
  if (Math.abs(n) >= 100_000_000_000_000) return formatSummaryRupiah(n);
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

  const totalRAB = parseFloat(detailedProjectInfo?.budget?.rabTotal) || 0;
  const teralokasiProyek = (detailedProjectInfo?.budget?.posAnggaran || []).reduce(
    (sum: number, pos: any) => sum + (parseFloat(pos.nominalAlokasi) || 0),
    0
  );

  const selectedDelta = (pendingPengajuan || [])
    .filter((p: any) => selectedIds[p.id])
    .reduce((sum: number, p: any) => sum + (Number(p.alokasiBaru) - Number(p.alokasiLama)), 0);

  // Nilai proyektif jika semua seleksi disetujui
  const teraProyektif = teralokasiProyek + selectedDelta;
  const sisaProyektif = totalRAB - teraProyektif; // boleh negatif (over budget)
  const isOver = sisaProyektif < 0;
  const progressPct = totalRAB > 0 ? Math.min(Math.max((teraProyektif / totalRAB) * 100, 0), 100) : 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(20,18,14,0.6)] p-4">
      <div className="flex h-[680px] max-h-[85vh] w-[820px] flex-col overflow-hidden rounded-[22px] bg-white shadow-[0px_24px_64px_rgba(20,18,14,0.3)]">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b-[0.8px] border-[#E6E1D4] px-6 py-5">
          <div className="flex flex-col gap-0.5">
            <div className="font-sans text-[17px] font-bold leading-[25.5px] text-[#14130F]">Pengajuan Perubahan Alokasi Anggaran</div>
            <div className="font-sans text-[12.5px] font-normal leading-[18.75px] text-[#6A6660]">{detailedProjectInfo?.nama || 'Nama Proyek'}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex cursor-pointer items-center justify-center rounded-xl bg-transparent p-[6px_10px] transition hover:bg-stone-100"
          >
            <X size={16} className="text-[#2C2A24]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col overflow-y-auto p-5">
          {(pendingPengajuan || []).length > 0 ? (
            <div className="flex flex-col">

              <div className="bg-white border border-[#e6e1d4] rounded-[16px] p-4 space-y-2.5 shadow-[0px_0px_0px_1px_rgba(20,18,14,0.04),0px_1px_2px_0px_rgba(20,18,14,0.05)]">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-semibold text-[#14130f]">Realisasi Anggaran</span>
                  <span className={`font-bold font-mono ${isOver ? 'text-[#d36c66]' : 'text-[#14130f]'}`}>{progressPct.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-[#f3f0e9] h-2 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-[#d36c66]' : 'bg-[#009162]'}`} style={{ width: `${progressPct}%` }} />
                </div>
                <div className="flex justify-between items-center text-[12px] pt-1">
                  <div className="flex items-baseline gap-1">
                    <span className="font-medium text-[#000000]">Nilai Proyek</span>
                    <span className="text-[10.2px] font-medium text-[#9a948b] font-mono">Rp</span>
                    <span title={formatRp(totalRAB)} className="font-medium text-[#14130f] font-mono cursor-pointer">{formatRp(totalRAB)}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-medium text-[#000000]">Teralokasi</span>
                    <span className="text-[10.2px] font-medium text-[#9a948b] font-mono">Rp</span>
                    <span title={formatRp(teraProyektif)} className={`font-medium font-mono cursor-pointer ${isOver ? 'text-[#d36c66]' : 'text-[#14130f]'}`}>{formatRp(teraProyektif)}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-normal text-[#9a948b]">Sisa</span>
                    {isOver ? (
                      <span className={`font-bold font-mono cursor-pointer text-[#d36c66]`}>
                        Over Rp {Math.abs(sisaProyektif).toLocaleString('id-ID')}
                      </span>
                    ) : (
                      <>
                        <span className="text-[10.2px] font-bold text-[#9a948b] font-mono">Rp</span>
                        <span title={formatRp(sisaProyektif)} className="font-bold text-[#14130f] font-mono cursor-pointer">{formatRp(sisaProyektif)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {isOver && (
                <div className="mt-2.5 rounded-[10px] border border-[#d36c66] bg-[#fdf3f2] px-3.5 py-2.5 font-sans text-[12px] font-semibold text-[#902f33]">
                  Seleksi melebihi sisa Nilai Proyek — batalkan sebagian pengajuan sebelum menyetujui.
                </div>
              )}

              <div className="mt-2.5 mb-2.5 flex justify-end">
                <button
                  type="button"
                  onClick={handleToggleAll}
                  className={`inline-flex cursor-pointer items-center rounded-[7px] border border-[#009162] px-[10px] py-[5px] font-sans text-[11.5px] font-semibold text-[#005836] transition hover:opacity-80 ${anySelected ? 'bg-[rgba(0,145,98,0.05)]' : 'bg-white'}`}
                >
                  {anySelected ? `Batalkan Semua (${selectedCount})` : `Pilih Semua (${(pendingPengajuan || []).length})`}
                </button>
              </div>

              <div className="flex flex-col overflow-hidden rounded-[10px] border border-[#E6E1D4]">
                {(pendingPengajuan || []).map((p: any, idx: number) => {
                  const isChecked = !!selectedIds[p.id];
                  const isExpanded = expandedId === p.id;
                  const itemDate = p.createdAt || new Date();
                  const formattedDate = new Date(itemDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                  const submitterName = p.pengaju?.nama || 'Project Manager';
                  const mainName = p.mainAnggaran?.namaMain || 'Pos Anggaran';
                  const alokasiLama = Number(p.alokasiLama) || 0;
                  const alokasiBaru = Number(p.alokasiBaru) || 0;
                  const delta = alokasiBaru - alokasiLama;

                  return (
                    <div
                      key={p.id}
                      className={`flex flex-col ${idx < (pendingPengajuan || []).length - 1 ? 'border-b border-[#E6E1D4]' : ''}`}
                    >
                      
                      {/* Row */}
                      <div
                        className={`flex cursor-pointer items-start gap-1.5 px-3.5 py-2.5 transition hover:bg-stone-50 ${isChecked ? 'bg-[#D5F4E3]' : 'bg-white'}`}
                        onClick={() => setExpandedId(isExpanded ? null : p.id)}
                      >
                        {/* Chevron toggle */}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : p.id); }}
                          className="mt-1 flex shrink-0 cursor-pointer items-center border-none bg-transparent p-[4px_2px]"
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 10 10"
                            fill="none"
                            className={`transition-transform duration-150 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                          >
                            <path d="M2 3.5L5 6.5L8 3.5" stroke="#6A6660" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>

                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleToggle(p.id); }}
                          className="mt-1 flex shrink-0 cursor-pointer items-center border-none bg-transparent p-[3px_2px]"
                        >
                          <div className={`flex h-[14px] w-[14px] items-center justify-center rounded ${isChecked ? 'bg-[#009162]' : 'border border-[#6A6660] bg-white'}`}>
                            {isChecked && (
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </button>

                        <div className="flex flex-1 flex-col gap-0.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-sans text-[9.5px] font-bold tracking-[0.28px] text-[#c2410c]">
                              MAIN
                            </span>
                            <span className="font-sans text-[13px] font-bold text-[#14130F]">
                              {mainName}
                            </span>
                            <span className="rounded-[5px] bg-[rgba(216,149,61,0.15)] px-[6px] py-[2px] font-sans text-[9.5px] font-bold text-[#894C06]">
                              MENUNGGU
                            </span>
                          </div>
                          <div className="pt-0.5 font-sans text-[10.5px] text-[#9A948B]">
                            Diajukan oleh <span className="font-bold text-[#2C2A24]">{submitterName}</span> · {formattedDate}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded px-1.5 py-0.5 font-mono text-[9.5px] font-bold ${
                              isChecked
                                ? delta >= 0
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-red-100 text-red-700'
                                : 'bg-stone-100 text-stone-400'
                            }`}
                          >
                            {isChecked ? `${delta >= 0 ? '+' : '−'}${Math.abs(delta).toLocaleString('id-ID')}` : '—'}
                          </span>
                          <span className="whitespace-nowrap font-mono text-[12px] font-bold text-[#14130F]">
                            {formatRp(alokasiBaru)}
                          </span>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="flex flex-col gap-2 bg-white p-[12px_14px_12px_40px]">
                          <div className="flex gap-2.5">
                            <div className="flex-1 rounded-[10px] border border-[#E6E1D4] bg-[#F5F4F0] p-[10px_12px]">
                              <div className="mb-1 font-sans text-[10.5px] font-bold text-[#9A948B]">ANGGARAN Saat Ini</div>
                              <div className="font-mono text-[13px] font-bold text-[#6A6660]">
                                {formatRp(alokasiLama)}
                              </div>
                            </div>
                            <div className="flex-1 rounded-[10px] border border-[#009162] bg-[rgba(0,145,98,0.06)] p-[10px_12px]">
                              <div className="mb-1 font-sans text-[10.5px] font-bold text-[#005836]">ANGGARAN Baru</div>
                              <div className="font-mono text-[13px] font-bold text-[#005836]">
                                {formatRp(alokasiBaru)}
                              </div>
                            </div>
                          </div>
                          {p.deskripsi && (
                            <div className="font-sans text-[11.5px] italic text-[#6A6660]">
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
            <div className="rounded-xl bg-white p-[48px_24px] text-center">
              <div className="mb-1.5 font-sans text-[14px] font-bold text-[#14130F]">Tidak Ada Pengajuan PM Pending</div>
              <div className="font-sans text-[12.5px] font-normal text-[#9A948B]">Saat ini tidak ada pengajuan perubahan alokasi yang menunggu persetujuan Direktur.</div>
            </div>
          )}
        </div>

        {/* Bottom bulk selected summary bar */}
        {(pendingPengajuan || []).length > 0 && (
          <div className={`flex shrink-0 items-center justify-between self-stretch border-t-[0.8px] border-[#E6E1D4] px-6 py-3 ${selectedCount > 0 ? 'bg-[#D5F4E3]' : 'bg-[#F5F4F0]'}`}>
            <div className={`font-sans text-[13px] font-bold ${selectedCount > 0 ? 'text-[#005836]' : 'text-[#6A6660]'}`}>
              {selectedCount > 0 ? `${selectedCount} pengajuan dipilih` : 'Pilih pengajuan untuk disetujui/ditolak'}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={() => {
                  const itemsToReject = (pendingPengajuan || []).filter((p: any) => selectedIds[p.id]);
                  setRejectingPengajuan(itemsToReject);
                  setRejectionReason("");
                }}
                className={`rounded-xl border border-[#E6E1D4] bg-white px-[14px] py-[9px] font-sans text-[13px] font-semibold ${selectedCount > 0 ? 'cursor-pointer text-[#14130F] transition hover:bg-stone-50' : 'cursor-not-allowed text-[#9A948B] opacity-60'}`}
              >
                Tolak Terpilih ({selectedCount})
              </button>
              <button
                type="button"
                disabled={selectedCount === 0 || isOver}
                onClick={() => setShowApproveConfirm(true)}
                className={`rounded-xl border-none px-[14px] py-[9px] font-sans text-[13px] font-semibold text-white transition hover:opacity-80 ${selectedCount > 0 && !isOver ? 'cursor-pointer bg-[#009162]' : 'cursor-not-allowed bg-[#9A948B]'}`}
              >
                Setujui Terpilih ({selectedCount})
              </button>
            </div>
          </div>
        )}

        {/* Reject reason panel */}
        {rejectingPengajuan && (
          <div className="flex shrink-0 flex-col gap-2.5 self-stretch border-t-[0.8px] border-[#E6E1D4] bg-[#FDF3F2] px-6 py-[14px]">
            <div className="font-sans text-[13px] font-bold text-[#902F33]">
              Tolak {rejectingPengajuan.length} pengajuan — berikan alasan
            </div>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={2}
              placeholder="Alasan penolakan (opsional)…"
              className="w-full resize-none rounded-[10px] border border-[#E6E1D4] p-[8px_10px] font-sans text-[12.5px] outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingPengajuan(null)}
                className="cursor-pointer rounded-[10px] border border-[#E6E1D4] bg-white px-[14px] py-2 font-sans text-[12.5px] font-semibold text-[#14130F] transition hover:bg-stone-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleBulkReview('REJECT', rejectionReason)}
                className="cursor-pointer rounded-[10px] border-none bg-[#c2410c] px-[14px] py-2 font-sans text-[12.5px] font-bold text-white transition hover:opacity-80"
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
