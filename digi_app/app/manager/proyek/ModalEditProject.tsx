import React from "react";
import { X, Loader2 } from "lucide-react";

type ModalEditProjectProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  form: { nama: string; deskripsi: string; tanggalMulai: string; tanggalSelesai: string; status: string };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  submitting: boolean;
  error: string;
};

export default function ModalEditProject({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  submitting,
  error,
}: ModalEditProjectProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="font-bold text-[15px] text-stone-900">Edit Proyek</h3>
          <button type="button" onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4 text-left">
          <div>
            <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Nama Proyek *</label>
            <input type="text" required value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30" />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Deskripsi Proyek</label>
            <textarea rows={3} value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] bg-white resize-none focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Tanggal Mulai *</label>
              <input type="date" required value={form.tanggalMulai} onChange={(e) => setForm({ ...form, tanggalMulai: e.target.value })} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] bg-white" />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Tanggal Selesai</label>
              <input type="date" value={form.tanggalSelesai} onChange={(e) => setForm({ ...form, tanggalSelesai: e.target.value })} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] bg-white" />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Status Proyek *</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {[{ value: "AKTIF", label: "Active" }, { value: "PLANNING", label: "Planning" }, { value: "DONE", label: "Done" }, { value: "CANCELED", label: "Canceled" }].map((statusItem) => {
                const isSelected = form.status === statusItem.value;
                return (
                  <button key={statusItem.value} type="button" onClick={() => setForm({ ...form, status: statusItem.value })}
                    className={`px-3.5 py-1.5 text-[12px] font-semibold rounded-xl border transition-all ${isSelected ? "border-[#2d6a4f] bg-[#e8f5e9] text-[#1b4332]" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"}`}
                  >
                    {statusItem.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[12px] font-medium flex items-center gap-2">
              <X size={14} />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-3 border-t border-stone-100">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-stone-200 rounded-xl text-[13px] font-semibold text-stone-600 hover:bg-stone-50 transition">Batal</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-stone-900 text-white text-[13px] font-bold rounded-xl transition flex items-center justify-center gap-2">
              {submitting && <Loader2 size={13} className="animate-spin" />}
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}