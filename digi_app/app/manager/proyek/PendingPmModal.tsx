import { useEffect, useState } from "react";
import { X } from "lucide-react";
import ConfirmDialog from "@/components/confirm-dialog";
import SuccessDialog from "@/components/success-dialog";
import Toast from "@/components/toast";
import CompactNominal from "@/components/compact-nominal";
import { useApi } from "@/lib/use-api";

type Props = {
  open: boolean;
  project: any;
  onClose: () => void;
  onChanged: () => void;
};

export default function PendingPmModal({ open, project, onClose, onChanged }: Props) {
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Record<number, boolean>>({});
  const [rejecting, setRejecting] = useState<any[] | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectToastCount, setRejectToastCount] = useState<number | null>(null);
  const [approveSuccessCount, setApproveSuccessCount] = useState<number | null>(null);
  const [errorText, setErrorText] = useState("");

  const pengajuanUrl = project?.id ? `/api/proyek/${project.id}/pengajuan-anggaran?status=PENDING` : null;
  const pengajuanQuery = useApi<{ pengajuan: any[] }>(pengajuanUrl, { enabled: open && !!pengajuanUrl });
  const pendingPengajuan: any[] = pengajuanQuery.data?.pengajuan || [];

  useEffect(() => {
    const initial: Record<number, boolean> = {};
    (pendingPengajuan as any[]).forEach((p) => {
      initial[p.id] = true;
    });
    setSelectedIds(initial);
  }, [pengajuanQuery.data]);

  if (!open && !rejectToastCount && !approveSuccessCount) return null;

  const anySelected = pendingPengajuan.some((p: any) => selectedIds[p.id]);
  const selectedCount = pendingPengajuan.filter((p: any) => selectedIds[p.id]).length;

  const totalRAB = parseFloat(project?.budget?.nilaiKontrak) || 0;
  const teralokasiProyek = (project?.budget?.posAnggaran || []).reduce(
    (sum: number, pos: any) => sum + (parseFloat(pos.nominalAlokasi) || 0),
    0
  );

  const selectedDelta = pendingPengajuan
    .filter((p: any) => selectedIds[p.id])
    .reduce((sum: number, p: any) => sum + (Number(p.alokasiBaru) - Number(p.alokasiLama)), 0);

  const teraProyektif = teralokasiProyek + selectedDelta;
  const sisaProyektif = totalRAB - teraProyektif; 
  const isOver = sisaProyektif < 0;
  const progressPct = totalRAB > 0 ? Math.min(Math.max((teraProyektif / totalRAB) * 100, 0), 100) : 0;

  const handleToggleAll = () => {
    const setTo = !anySelected;
    const next: Record<number, boolean> = {};
    pendingPengajuan.forEach((p: any) => {
      next[p.id] = setTo;
    });
    setSelectedIds(next);
  };

  const handleToggle = (id: number) => {
    setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleBulkReview = async (action: 'APPROVE' | 'REJECT', catatan?: string) => {
    const selectedIdsList = pendingPengajuan
      .filter((p: any) => selectedIds[p.id])
      .map((p: any) => p.id);
    if (selectedIdsList.length === 0 || processing) return;

    setProcessing(true);
    setErrorText("");

    try {
      const results = await Promise.all(
        selectedIdsList.map((id: number) =>
          fetch(`/api/pengajuan-anggaran/${id}/review`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: action, catatan }),
          })
        )
      );

      const allOk = results.every(res => res.ok);
      if (allOk) {
        if (action === 'REJECT') {
          setRejectToastCount(selectedIdsList.length);
        } else {
          setApproveSuccessCount(selectedIdsList.length);
        }
        setRejecting(null);
        setRejectionReason("");
        onChanged();
        onClose();
      } else {
        const failedBodies = await Promise.all(
          results.filter(res => !res.ok).map(res => res.json().catch(() => ({})))
        );
        const messages = failedBodies.map((b: any) => b.message).filter(Boolean);
        setErrorText(messages.length > 0 ? messages.join(' ') : "Beberapa pengajuan gagal diproses.");
      }
    } catch {
      setErrorText("Terjadi kesalahan koneksi saat memproses pengajuan");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(20,18,14,0.6)] p-4">
        <div className="flex h-[680px] max-h-[85vh] w-[820px] flex-col overflow-hidden rounded-[22px] bg-white shadow-[0px_24px_64px_rgba(20,18,14,0.3)]">
          <div className="flex shrink-0 items-center justify-between border-b-[0.8px] border-[#E6E1D4] px-6 py-5">
            <div className="flex flex-col gap-0.5">
              <div className="font-sans text-[17px] font-bold leading-[25.5px] text-[#14130F]">Pengajuan Perubahan Alokasi Biaya</div>
              <div className="font-sans text-[12.5px] font-normal leading-[18.75px] text-[#6A6660]">{project?.nama || 'Nama Proyek'}</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex cursor-pointer items-center justify-center rounded-xl bg-transparent p-[6px_10px] transition hover:bg-stone-100"
            >
              <X size={16} className="text-[#2C2A24]" />
            </button>
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto p-5">
            {pengajuanQuery.isLoading ? (
              <div className="rounded-xl bg-white p-[48px_24px] text-center font-sans text-[12.5px] text-[#9A948B]">
                Memuat pengajuan...
              </div>
            ) : pendingPengajuan.length > 0 ? (
            <div className="flex flex-col">

              <div className="bg-white border border-[#e6e1d4] rounded-[16px] p-4 space-y-2.5 shadow-[0px_0px_0px_1px_rgba(20,18,14,0.04),0px_1px_2px_0px_rgba(20,18,14,0.05)]">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-semibold text-[#14130f]">Overview Alokasi Biaya</span>
                  <span className={`font-bold  ${isOver ? 'text-[#d36c66]' : 'text-[#14130f]'}`}>{progressPct.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-[#f3f0e9] h-2 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-[#d36c66]' : 'bg-[#009162]'}`} style={{ width: `${progressPct}%` }} />
                </div>
                <div className="flex justify-between items-center text-[12px] pt-1">
                  <div className="flex items-baseline gap-1">
                    <span className="font-medium text-[#000000]">Nilai Proyek</span>
                    <CompactNominal value={totalRAB} compactThreshold={100_000_000_000_000} className="font-medium text-[#14130f]"
                       />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-medium text-[#000000]">Teralokasi</span>
                    <CompactNominal value={teraProyektif} compactThreshold={100_000_000_000_000} className={`font-medium ${isOver ? 'text-[#d36c66]' : 'text-[#14130f]'}`} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-normal text-[#9a948b]">Sisa</span>
                    {isOver ? (
                      <span className={`font-bold  cursor-pointer text-[#d36c66]`}>
                        Over Rp {Math.abs(sisaProyektif).toLocaleString('id-ID')}
                      </span>
                    ) : (
                      <>
                        <CompactNominal value={sisaProyektif} compactThreshold={100_000_000_000_000} className="font-bold text-[#14130f]" />
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
                  {anySelected ? `Batalkan Semua (${selectedCount})` : `Pilih Semua (${pendingPengajuan.length})`}
                </button>
              </div>

              <div className="flex flex-col overflow-hidden rounded-[10px] border border-[#E6E1D4]">
                {pendingPengajuan.map((p: any, idx: number) => {
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
                      className={`flex flex-col ${idx < pendingPengajuan.length - 1 ? 'border-b border-[#E6E1D4]' : ''}`}
                    >

                      <div
                        className={`flex cursor-pointer items-start gap-1.5 px-3.5 py-2.5 transition hover:bg-stone-50 ${isChecked ? 'bg-[#D5F4E3]' : 'bg-white'}`}
                        onClick={() => setExpandedId(isExpanded ? null : p.id)}
                      >
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
                            className={`rounded px-1.5 py-0.5  text-[9.5px] font-bold ${isChecked
                              ? delta >= 0
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                              : 'bg-stone-100 text-stone-400'
                              }`}
                          >
                            {isChecked ? `${delta >= 0 ? '+' : '−'}${Math.abs(delta).toLocaleString('id-ID')}` : '—'}
                          </span>
                          <CompactNominal value={alokasiBaru} compactThreshold={100_000_000_000_000} className="whitespace-nowrap text-[12px] font-bold text-[#14130F]" />
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="flex flex-col gap-2 bg-white p-[12px_14px_12px_40px]">
                          <div className="flex gap-2.5">
                            <div className="flex-1 rounded-[10px] border border-[#E6E1D4] bg-[#F5F4F0] p-[10px_12px]">
                              <div className="mb-1 font-sans text-[10.5px] font-bold text-[#9A948B]">Alokasi Saat Ini</div>
                              <div className=" text-[13px] font-bold text-[#6A6660]">
                                <CompactNominal value={alokasiLama} compactThreshold={100_000_000_000_000} />
                              </div>
                            </div>
                            <div className="flex-1 rounded-[10px] border border-[#009162] bg-[rgba(0,145,98,0.06)] p-[10px_12px]">
                              <div className="mb-1 font-sans text-[10.5px] font-bold text-[#005836]">Alokasi Baru</div>
                              <div className=" text-[13px] font-bold text-[#005836]">
                                <CompactNominal value={alokasiBaru} compactThreshold={100_000_000_000_000} />
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

          {pendingPengajuan.length > 0 && (
            <div className={`flex shrink-0 items-center justify-between self-stretch border-t-[0.8px] border-[#E6E1D4] px-6 py-3 ${selectedCount > 0 ? 'bg-[#D5F4E3]' : 'bg-[#F5F4F0]'}`}>
              <div className={`font-sans text-[13px] font-bold ${selectedCount > 0 ? 'text-[#005836]' : 'text-[#6A6660]'}`}>
                {selectedCount > 0 ? `${selectedCount} pengajuan dipilih` : 'Pilih pengajuan untuk disetujui/ditolak'}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={selectedCount === 0}
                  onClick={() => {
                    const itemsToReject = pendingPengajuan.filter((p: any) => selectedIds[p.id]);
                    setRejecting(itemsToReject);
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

          {rejecting && (
            <div className="flex shrink-0 flex-col gap-2.5 self-stretch border-t-[0.8px] border-[#E6E1D4] bg-[#FDF3F2] px-6 py-[14px]">
              <div className="font-sans text-[13px] font-bold text-[#902F33]">
                Tolak {rejecting.length} pengajuan — berikan alasan
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
                  onClick={() => setRejecting(null)}
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
        isLoading={processing}
        onCancel={() => setShowApproveConfirm(false)}
        onConfirm={async () => {
          await handleBulkReview('APPROVE');
          setShowApproveConfirm(false);
        }}
      />

      <Toast
        open={!!errorText}
        variant="error"
        message={errorText}
        onClose={() => setErrorText("")}
      />

      <Toast
        open={rejectToastCount !== null}
        message={`Berhasil menolak ${rejectToastCount ?? 0} item pengajuan.`}
        onClose={() => setRejectToastCount(null)}
      />

      <SuccessDialog
        open={approveSuccessCount !== null}
        title="Pengajuan Disetujui"
        description={<>Berhasil menyetujui <span className="font-semibold text-[#14130F]">{approveSuccessCount}</span> item pengajuan.</>}
        onClose={() => setApproveSuccessCount(null)}
      />
    </>
  );
}
