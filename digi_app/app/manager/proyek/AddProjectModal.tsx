import React from "react";
import { X, Loader2 } from "lucide-react";

type Props = {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  projectForm: any;
  setProjectForm: React.Dispatch<React.SetStateAction<any>>;
  formError: string;
  submitting: boolean;
};

export default function AddProjectModal({
  show,
  onClose,
  onSubmit,
  projectForm,
  setProjectForm,
  formError,
  submitting,
}: Props) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="font-bold text-[15px] text-stone-900">Buat Proyek Baru</h3>
          <button type="button" onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Nama Proyek *</label>
            <input
              type="text"
              required
              value={projectForm.nama}
              onChange={(e) => setProjectForm({ ...projectForm, nama: e.target.value })}
              placeholder="e.g. Renovasi Kantor Cabang Bandung"
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 bg-white"
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Deskripsi Proyek</label>
            <textarea
              rows={3}
              value={projectForm.deskripsi}
              onChange={(e) => setProjectForm({ ...projectForm, deskripsi: e.target.value })}
              placeholder="Detail mengenai target..."
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] bg-white resize-none"
            />
          </div> 
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-stone-600 mb-1.5">
                Tanggal Mulai <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={projectForm.tanggalMulai}
                onChange={(e) => setProjectForm({ ...projectForm, tanggalMulai: e.target.value })}
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] bg-white"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-stone-600 mb-1.5">
                Tanggal Selesai <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={projectForm.tanggalSelesai}
                onChange={(e) => setProjectForm({ ...projectForm, tanggalSelesai: e.target.value })}
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Status Proyek *</label>
            <div className="flex flex-wrap gap-3 mt-1">
              {[
                { value: "ACTIVE", label: "Active" },
                { value: "PLANNING", label: "Planning" }
              ].map((statusItem) => {
                const isSelected = projectForm.status === statusItem.value;
                return (
                  <button
                    key={statusItem.value}
                    type="button"
                    onClick={() => setProjectForm({ ...projectForm, status: statusItem.value })}
                    className={`px-5 py-2 text-[13px] font-semibold rounded-xl border transition-all ${isSelected ? "border-[#2d6a4f] bg-[#e8f5e9] text-[#1b4332]" : "border-stone-200 bg-white text-stone-600"
                      }`}
                  >
                    {statusItem.label}
                  </button>
                );
              })}
            </div>
          </div>
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[12px] font-medium flex items-center gap-2">
              <X size={14} />
              {formError}
            </div>
          )}
          <div className="flex gap-3 pt-3 border-t border-stone-100">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-stone-200 rounded-xl text-[13px] font-semibold text-stone-600 hover:bg-stone-50 transition">Batal</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-[#2d6a4f] text-white text-[13px] font-bold rounded-xl transition flex items-center justify-center gap-2">
              {submitting && <Loader2 size={13} className="animate-spin" />}
              Buat Proyek
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}