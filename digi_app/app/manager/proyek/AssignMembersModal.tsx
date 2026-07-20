import React from "react";
import { X, Loader2 } from "lucide-react";
import { Project, Member } from "./types";

type Props = {
  showAssignMembers: Project | null;
  onClose: () => void;
  members: Member[];
  selectedProjectMembers: { userId: number; role: string }[];
  setSelectedProjectMembers: React.Dispatch<React.SetStateAction<{ userId: number; role: string }[]>>;
  formError: string;
  submitting: boolean;
  onSave: (e: React.FormEvent) => void;
};

export default function AssignMembersModal({
  showAssignMembers,
  onClose,
  members,
  selectedProjectMembers,
  setSelectedProjectMembers,
  formError,
  submitting,
  onSave,
}: Props) {
  if (!showAssignMembers) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="font-bold text-[15px] text-stone-900">Atur Anggota Proyek</h3>
          <button type="button" onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">PROYEK</h4>
            <p className="font-bold text-stone-850 text-sm">{showAssignMembers.nama}</p>
          </div>
          <div>
            <label className="block text-[12px] font-bold text-stone-600 mb-2">Pilih Anggota Tim</label>
            <div className="border border-stone-200 rounded-xl max-h-[260px] overflow-y-auto divide-y divide-stone-100 p-1 bg-stone-50/20">
              {members.map((member) => {
                const isChecked = selectedProjectMembers.some((m) => m.userId === member.id);
                return (
                  <label key={member.id} className="flex items-center justify-between p-3 hover:bg-stone-50 rounded-lg cursor-pointer transition select-none">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProjectMembers([...selectedProjectMembers, {
                              userId: member.id,
                              role: member.role === 'Project Manager' ? 'Project Manager' : 'Anggota Lapangan'
                            }]);
                          } else {
                            setSelectedProjectMembers(selectedProjectMembers.filter((m) => m.userId !== member.id));
                          }
                        }}
                        className="accent-[#2d6a4f]"
                      />
                      <div className="min-w-0 text-left">
                        <p className="text-[13px] font-bold text-stone-800 leading-tight">{member.nama}</p>
                        <p className="text-[11px] text-stone-400 font-mono mt-0.5">{member.email}</p>
                      </div>
                    </div>
                    {isChecked ? (
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={selectedProjectMembers.find((m) => m.userId === member.id)?.role || 'Anggota Lapangan'}
                          onChange={(e) => {
                            setSelectedProjectMembers(
                              selectedProjectMembers.map((m) =>
                                m.userId === member.id ? { ...m, role: e.target.value } : m
                              )
                            );
                          }}
                          className="border border-stone-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-stone-650 bg-white"
                        >
                          <option value="Anggota Lapangan">Anggota Lapangan</option>
                          <option value="Project Manager">Project Manager</option>
                        </select>
                      </div>
                    ) : (
                      <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                        {member.role}
                      </span>
                    )}
                  </label>
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
            <button type="button" onClick={onSave} disabled={submitting} className="flex-1 py-2.5 bg-[#2d6a4f] text-white text-[13px] font-bold rounded-xl transition flex items-center justify-center gap-2">
              {submitting && <Loader2 size={13} className="animate-spin" />}
              Simpan Penugasan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}