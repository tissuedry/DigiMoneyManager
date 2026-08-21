import React from "react";
import { X, Loader2, AlertTriangle } from "lucide-react";
import DatePicker from "@/components/date-picker";
import { formatRibuan, ribuanToNumber } from "./utils";

type Props = {
  editMode: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editForm: any;
  setEditForm: React.Dispatch<React.SetStateAction<any>>;
  formError: string;
  submitting: boolean;
  projectDetail?: any;
};

export default function EditProjectModal({
  editMode,
  onClose,
  onSubmit,
  editForm,
  setEditForm,
  formError,
  submitting,
  projectDetail,
}: Props) {
  if (!editMode) return null;

  const totalPengeluaran = Number(projectDetail?.budget?.rabTotal) || 0;
  const totalPemasukan = Number(projectDetail?.budget?.targetPemasukan) || 0;
  const totalAlokasi = totalPengeluaran + totalPemasukan;
  const inputNilai = ribuanToNumber(editForm.rabTotal) || 0;
  const isUnderAlokasi = totalAlokasi > 0 && inputNilai < totalAlokasi;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50 flex-shrink-0">
          <h3 className="font-bold text-[15px] text-stone-900">Edit Proyek</h3>
          <button type="button" onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4 text-left overflow-y-auto flex-1">
          <div>
            <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Nama Proyek <span className="text-red-500"> *</span></label>
            <input type="text" required value={editForm.nama} onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30" />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Deskripsi Proyek</label>
            <textarea rows={3} value={editForm.deskripsi} onChange={(e) => setEditForm({ ...editForm, deskripsi: e.target.value })} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] bg-white resize-none focus:outline-none" />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Total Nilai Proyek (Rupiah)</label>
            <div className="relative flex items-center w-full">
              <span className="absolute left-3.5 text-stone-500 font-mono text-[13px] font-semibold select-none">
                Rp
              </span>
              <input
                type="text"
                value={editForm.rabTotal || ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    rabTotal: formatRibuan(e.target.value),
                  })
                }
                placeholder="0"
                className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-[13px] font-mono focus:outline-none focus:ring-2 bg-white ${
                  isUnderAlokasi ? "border-amber-400 focus:ring-amber-400/30 text-amber-900" : "border-stone-200 focus:ring-[#2d6a4f]/30"
                }`}
              />
            </div>
          </div>

          {/* Warning Jika Nilai Proyek Lebih Kecil dari Total Alokasi */}
          {isUnderAlokasi && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-2.5 rounded-xl text-[12px] font-medium flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-left leading-relaxed">
                <span className="font-bold text-amber-950 block mb-0.5">Total Nilai Proyek Terlalu Kecil</span>
                Total Nilai Proyek (Rp {inputNilai.toLocaleString("id-ID")}) lebih kecil dari total alokasi yang sudah ada:
                <div className="mt-1 flex flex-col gap-0.5 text-[11px] text-amber-800">
                  <span>• Pengeluaran (RAB): Rp {totalPengeluaran.toLocaleString("id-ID")}</span>
                  <span>• Pemasukan (COA): Rp {totalPemasukan.toLocaleString("id-ID")}</span>
                  <span>• Total Alokasi: <strong>Rp {totalAlokasi.toLocaleString("id-ID")}</strong></span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Tanggal Mulai <span className="text-red-500"> *</span></label>
              <DatePicker 
              value={editForm.tanggalMulai} 
              onChange={(v) => setEditForm({ ...editForm, tanggalMulai: v })} 
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Tanggal Selesai <span className="text-red-500"> *</span></label>
              <DatePicker
                value={editForm.tanggalSelesai}
                onChange={(v) => setEditForm({ ...editForm, tanggalSelesai: v })}
                min={editForm.tanggalMulai}
                align="right"
              />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Status Proyek <span className="text-red-500"> *</span></label>
            <div className="flex flex-wrap gap-2 mt-1">
              {[{ value: "PLANNING", label: "Planning" }, { value: "AKTIF", label: "Active" }, { value: "DONE", label: "Done" }, { value: "CANCELED", label: "Canceled" }].map((statusItem) => {
                const isSelected = editForm.status === statusItem.value;
                return (
                  <button key={statusItem.value} type="button" onClick={() => setEditForm({ ...editForm, status: statusItem.value })}
                    className={`px-3.5 py-1.5 text-[12px] font-semibold rounded-xl border transition-all ${isSelected ? "border-[#2d6a4f] bg-[#e8f5e9] text-[#1b4332]" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"}`}
                  >
                    {statusItem.label}
                  </button>
                );
              })}
            </div>
          </div>

          {editForm.status === "DONE" && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 px-3.5 py-3 rounded-xl text-[12px] font-medium flex items-start gap-2.5 animate-in fade-in duration-150">
              <div className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                ✓
              </div>
              <div className="text-left leading-relaxed">
                <span className="font-bold text-emerald-900 block mb-0.5">Informasi Penyelesaian Proyek (Done)</span>
                Pemasukan bersih proyek akan otomatis direalisasikan dan statusnya berubah menjadi <strong>Cair</strong>:
                <div className="mt-1 flex flex-col gap-0.5 text-[11px] text-emerald-800 font-mono">
                  <span>• Total Nilai Proyek: Rp {(inputNilai || totalAlokasi).toLocaleString("id-ID")}</span>
                  <span>• Realisasi Pengeluaran: Rp {Number(projectDetail?.budget?.totalPengeluaran || 0).toLocaleString("id-ID")}</span>
                  <span>• Realisasi Pemasukan Bersih: <strong>Rp {Math.max(0, (inputNilai || totalAlokasi) - Number(projectDetail?.budget?.totalPengeluaran || 0)).toLocaleString("id-ID")}</strong></span>
                </div>
              </div>
            </div>
          )}

          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[12px] font-medium flex items-center gap-2">
              <X size={14} />
              {formError}
            </div>
          )}

          <div className="flex gap-3 pt-3 border-t border-stone-100">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-stone-200 rounded-xl text-[13px] font-semibold text-stone-600 hover:bg-stone-50 transition">Batal</button>
            <button
              type="submit"
              disabled={submitting || isUnderAlokasi}
              className={`flex-1 py-2.5 text-white text-[13px] font-bold rounded-xl transition flex items-center justify-center gap-2 ${
                isUnderAlokasi ? "bg-stone-300 cursor-not-allowed" : "bg-stone-900 hover:bg-black cursor-pointer"
              }`}
            >
              {submitting && <Loader2 size={13} className="animate-spin" />}
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}