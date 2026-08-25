import { useEffect, useState, SubmitEvent } from "react";
import { X, Loader2 } from "lucide-react";
import DatePicker from "@/components/date-picker";
import ConfirmDialog from "@/components/confirm-dialog";
import SuccessDialog from "@/components/success-dialog";
import { useMutate } from "@/lib/use-api";
import { formatRibuan, ribuanToNumber } from "@/lib/proyek-utils";

const emptyForm = {
  nama: "",
  deskripsi: "",
  nilaiKontrak: "",
  tanggalMulai: "",
  tanggalSelesai: "",
  status: "PLANNING",
};

type Props = {
  show: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export default function AddProjectForm({ show, onClose, onSaved }: Props) {
  const [projectForm, setProjectForm] = useState(emptyForm);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError] = useState("");
  const [savedName, setSavedName] = useState<string | null>(null);

  const createProyek = useMutate("/api/proyek", "POST");
  const submitting = createProyek.isPending;

  useEffect(() => {
    if (show) {
      setProjectForm(emptyForm);
      setFormError("");
      setShowConfirm(false);
    }
  }, [show]);

  if (!show && !savedName) return null;

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    setFormError("");

    if (!projectForm.nama || !projectForm.nama.trim()) {
      setFormError("Nama proyek wajib diisi.");
      return;
    }
    if (!projectForm.tanggalMulai) {
      setFormError("Tanggal mulai wajib diisi.");
      return;
    }
    if (!projectForm.tanggalSelesai) {
      setFormError("Tanggal selesai wajib diisi.");
      return;
    }
    if (projectForm.tanggalSelesai < projectForm.tanggalMulai) {
      setFormError("Tanggal selesai tidak boleh sebelum tanggal mulai.");
      return;
    }
    if (!projectForm.status) {
      setFormError("Status proyek wajib diisi.");
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirm = () => {
    createProyek.mutate(
      {
        nama: projectForm.nama,
        deskripsi: projectForm.deskripsi,
        nilaiKontrak: ribuanToNumber(projectForm.nilaiKontrak) || 0,
        tanggalMulai: projectForm.tanggalMulai,
        tanggalSelesai: projectForm.tanggalSelesai,
        status: projectForm.status,
      },
      {
        onSuccess: () => {
          setSavedName(projectForm.nama);
          setProjectForm(emptyForm);
          setShowConfirm(false);
          onSaved();
        },
        onError: (err) => {
          setFormError(err.message || "Gagal membuat proyek");
          setShowConfirm(false);
        },
      }
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
            <h3 className="font-bold text-[15px] text-stone-900">Buat Proyek Baru</h3>
            <button type="button" onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Nama Proyek <span className="text-red-500"> *</span></label>
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
            <div>
              <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Total Nilai Proyek (Rupiah)</label>
              <div className="relative flex items-center w-full">
                <span className="absolute left-3.5 text-stone-500 font-mono text-[13px] font-semibold select-none">
                  Rp
                </span>
                <input
                  type="text"
                  value={projectForm.nilaiKontrak || ""}
                  onChange={(e) => {
                    const { formatted, caret } = formatRibuan(e.target.value, e.target.selectionStart ?? 0);
                    setProjectForm({ ...projectForm, nilaiKontrak: formatted });
                    requestAnimationFrame(() => {
                      e.target.setSelectionRange(caret, caret);
                    });
                  }}
                  placeholder="0"
                  className="w-full border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 bg-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Tanggal Mulai <span className="text-red-500"> *</span></label>
                <DatePicker
                  value={projectForm.tanggalMulai}
                  onChange={(v) => setProjectForm({ ...projectForm, tanggalMulai: v })}
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-stone-600 mb-1.5">
                  Tanggal Selesai <span className="text-red-500"> *</span>
                </label>
                <DatePicker
                  value={projectForm.tanggalSelesai}
                  onChange={(v) => setProjectForm({ ...projectForm, tanggalSelesai: v })}
                  min={projectForm.tanggalMulai}
                  align="right"
                />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-stone-600 mb-1.5">
                Status Proyek <span className="text-red-500"> *</span>
              </label>
              <div className="flex flex-wrap gap-3 mt-1">
                {[
                  { value: "PLANNING", label: "Planning" },
                  { value: "AKTIF", label: "Active" }
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

      <ConfirmDialog
        open={showConfirm}
        title="Buat Proyek Baru"
        description={
          <>
            Apakah Anda yakin ingin membuat proyek <span className="font-semibold text-stone-900">{projectForm.nama}</span> ({projectForm.tanggalMulai} s/d {projectForm.tanggalSelesai}) dengan status <span className="font-semibold text-stone-900">{projectForm.status}</span>?
          </>
        }
        confirmLabel="Buat Proyek"
        isLoading={submitting}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
      />

      <SuccessDialog
        open={!!savedName}
        title="Proyek Berhasil Dibuat"
        description={<>Proyek <span className="font-semibold text-[#14130F]">{savedName}</span> berhasil dibuat.</>}
        onClose={() => { setSavedName(null); onClose(); }}
      />
    </>
  );
}
