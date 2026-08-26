"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { UserPlus, Search, ChevronDown, Users, Edit2, Briefcase } from "lucide-react";
import ConfirmDialog from "@/components/confirm-dialog";
import SuccessDialog from "@/components/success-dialog";
import AnggotaModal from "./AnggotaModal";

type Proyek = { id: number; nama: string; status: string };
type Member = {
  id: number;
  nama: string;
  email: string;
  role: string;
  divisi: string | null;
  proyek: { id: number; nama: string; status: string; roleInProyek: string }[];
};

const ROLES = ["Karyawan", "Project Manager", "Tim Keuangan", "Direktur / Manajemen"];

const ROLE_BADGE: Record<string, string> = {
  "Karyawan": "bg-stone-100 text-stone-600",
  "Project Manager": "bg-blue-50 text-blue-700",
  "Tim Keuangan": "bg-emerald-50 text-emerald-700",
  "Direktur / Manajemen": "bg-purple-50 text-purple-700",
};

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-purple-100 text-purple-700",
  "bg-rose-100 text-rose-700",
];

function MemberRowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-stone-100">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-stone-200 shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 bg-stone-200 rounded w-28" />
            <div className="h-2.5 bg-stone-150 rounded w-36" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="h-5 bg-stone-200 rounded-lg w-20" />
      </td>
      <td className="px-4 py-3.5">
        <div className="h-3.5 bg-stone-200 rounded w-24" />
      </td>
      <td className="px-4 py-3.5">
        <div className="flex gap-1.5">
          <div className="h-5 bg-stone-150 rounded-md w-24" />
          <div className="h-5 bg-stone-150 rounded-md w-20" />
        </div>
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="h-7 bg-stone-200 rounded-lg w-28 ml-auto" />
      </td>
    </tr>
  );
}

export default function AnggotaPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [proyekList, setProyekList] = useState<Proyek[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalMembers, setTotalMembers] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("Semua");
  const [selectedProyekAssignments, setSelectedProyekAssignments] = useState<{ proyekId: number; role: string }[]>([]);

  const observerTarget = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  const [form, setForm] = useState({
    nama: "",
    email: "",
    password: "",
    userRole: "Karyawan",
    divisi: "",
  });

  const scrollToForm = () => {
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const fetchProyekList = async () => {
    try {
      const res = await fetch("/api/manager/proyek?limit=100");
      const data = await res.json();
      setProyekList(data.projects || data.proyek || []);
    } catch {
    }
  };

  const fetchMembers = async (pageNum: number, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "10",
        search: searchQuery,
        role: filterRole,
      });

      const res = await fetch(`/api/manager/members?${params.toString()}`);
      const data = await res.json();

      const newMembers: Member[] = data.members ?? [];
      if (isInitial) {
        setMembers(newMembers);
      } else {
        setMembers((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const filtered = newMembers.filter((m) => !existingIds.has(m.id));
          return [...prev, ...filtered];
        });
      }

      setTotalMembers(data.total ?? 0);
      setHasMore(data.hasMore ?? false);
      setPage(pageNum);
    } catch {
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchProyekList();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembers(1, true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, filterRole]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !loading && !loadingMore) {
        fetchMembers(page + 1, false);
      }
    },
    [hasMore, loading, loadingMore, page, searchQuery, filterRole]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  const handleStartAdd = () => {
    setEditingMember(null);
    setForm({ nama: "", email: "", password: "", userRole: "Karyawan", divisi: "" });
    setSelectedProyekAssignments([]);
    setShowForm(true);
    setFormError("");
    setSuccess("");
    scrollToForm();
  };

  const handleStartEdit = (m: Member) => {
    setEditingMember(m);
    setForm({
      nama: m.nama,
      email: m.email,
      password: "",
      userRole: m.role,
      divisi: m.divisi || "",
    });
    setSelectedProyekAssignments(m.proyek.map((p) => ({
      proyekId: p.id,
      role: p.roleInProyek || (m.role === 'Project Manager' ? 'Project Manager' : 'Anggota Lapangan'),
    })));
    setShowForm(true);
    setFormError("");
    setSuccess("");
    scrollToForm();
  };

  const isAssignmentsEqual = (
    initialProyek: { id: number; roleInProyek: string }[],
    currentAssignments: { proyekId: number; role: string }[]
  ) => {
    if (initialProyek.length !== currentAssignments.length) return false;
    const initialMap = new Map(initialProyek.map((p) => [p.id, p.roleInProyek]));
    for (const curr of currentAssignments) {
      if (!initialMap.has(curr.proyekId)) return false;
      if (initialMap.get(curr.proyekId) !== curr.role) return false;
    }
    return true;
  };

  const hasDataChanged = () => {
    if (!editingMember) return true;
    const namaChanged = form.nama.trim() !== editingMember.nama.trim();
    const emailChanged = form.email.trim().toLowerCase() !== editingMember.email.trim().toLowerCase();
    const roleChanged = form.userRole !== editingMember.role;
    const divisiChanged = (form.divisi || "").trim() !== (editingMember.divisi || "").trim();
    const assignmentsChanged = !isAssignmentsEqual(editingMember.proyek, selectedProyekAssignments);

    return namaChanged || emailChanged || roleChanged || divisiChanged || assignmentsChanged;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccess("");

    if (editingMember && !hasDataChanged()) {
      setFormError("Tidak ada perubahan data atau role. Pengguna ini sudah terdaftar dengan role tersebut pada proyek yang dipilih.");
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);

    try {
      const url = "/api/manager/members";
      const method = editingMember ? "PUT" : "POST";
      const payload = editingMember
        ? {
            userId: editingMember.id,
            nama: form.nama,
            email: form.email,
            userRole: form.userRole,
            divisi: form.divisi,
            proyekAssignments: selectedProyekAssignments,
          }
        : {
            nama: form.nama,
            email: form.email,
            password: form.password,
            userRole: form.userRole,
            divisi: form.divisi,
            proyekAssignments: selectedProyekAssignments,
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || `Gagal ${editingMember ? "memperbarui" : "mendaftarkan"} anggota`);
        setShowConfirm(false);
        return;
      }

      setSuccess(`Data anggota "${form.nama}" berhasil ${editingMember ? "diperbarui" : "didaftarkan"}!`);
      setForm({ nama: "", email: "", password: "", userRole: "Karyawan", divisi: "" });
      setSelectedProyekAssignments([]);
      setShowForm(false);
      setEditingMember(null);
      fetchMembers(1, true);
      setShowConfirm(false);
      setShowSuccessDialog(true);
    } catch {
      setFormError("Terjadi kesalahan koneksi");
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="px-6 lg:px-8 py-6 w-full overflow-y-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 leading-tight">Registrasi Anggota</h1>
          <p className="text-sm text-stone-500 mt-1.5">
            Kelola akun tim. Daftarkan karyawan, Project Manager, dan Tim Keuangan ke sistem, serta atur penugasan proyek mereka.
          </p>
        </div>
        <button
          onClick={handleStartAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2d6a4f] hover:bg-[#1e5038] text-white text-[13px] font-bold rounded-xl shadow-sm transition cursor-pointer whitespace-nowrap"
        >
          <UserPlus size={16} />
          Tambah Anggota
        </button>
      </div>

      <AnggotaModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingMember(null); }}
        editingMember={editingMember}
        form={form}
        setForm={setForm}
        proyekList={proyekList}
        selectedProyekAssignments={selectedProyekAssignments}
        setSelectedProyekAssignments={setSelectedProyekAssignments}
        onSubmit={handleSubmit}
        submitting={submitting}
        formError={formError}
      />

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-stone-50/20">
          <div className="flex items-center gap-2 bg-stone-100 rounded-xl px-3 py-2 flex-1">
            <Search size={14} className="text-stone-400 shrink-0" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-[13px] text-stone-700 placeholder-stone-400 focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="border border-stone-200 rounded-xl px-3 py-2 text-[12px] font-semibold text-stone-600 appearance-none pr-7 focus:outline-none bg-white cursor-pointer"
              >
                <option>Semua</option>
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            </div>

            <div className="flex items-center gap-1.5 text-[12px] font-medium whitespace-nowrap bg-stone-100 px-3 py-2 rounded-xl">
              <Users size={14} className="text-stone-500" />
              <span className="text-stone-700">
                {loading ? "Memuat..." : `Menampilkan ${members.length} dari ${totalMembers} anggota`}
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[11px] text-stone-400 font-bold uppercase tracking-wide border-b border-stone-150 bg-stone-50/50">
                <th className="text-left px-5 py-3">Anggota</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Divisi</th>
                <th className="text-left px-4 py-3">Proyek ({proyekList.length} total)</th>
                <th className="text-right px-5 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <MemberRowSkeleton key={`skel-init-${i}`} />)
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-stone-400 text-sm">
                    {searchQuery || filterRole !== "Semua"
                      ? "Tidak ada anggota yang sesuai filter."
                      : "Belum ada anggota terdaftar."}
                  </td>
                </tr>
              ) : (
                <>
                  {members.map((m, i) => (
                    <tr key={m.id} className="hover:bg-stone-50/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                            {getInitials(m.nama)}
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-stone-900 leading-tight">{m.nama}</p>
                            <p className="text-[11px] text-stone-400 font-mono">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-lg ${ROLE_BADGE[m.role] || "bg-stone-100 text-stone-600"}`}>
                          {m.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[12px] text-stone-500">{m.divisi || "—"}</td>
                      <td className="px-4 py-3.5">
                        {m.proyek.length === 0 ? (
                          <span className="text-[11px] text-stone-300 font-semibold italic">Tidak ada proyek</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-w-[450px]">
                            {m.proyek.map((p) => (
                              <div
                                key={p.id}
                                className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md font-semibold font-sans"
                              >
                                <Briefcase size={10} className="text-emerald-600" />
                                <span>{p.nama} ({p.roleInProyek === 'Anggota Lapangan' ? 'Karyawan' : 'PM'})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleStartEdit(m)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-[#e8f4ef] hover:text-[#2d6a4f] text-stone-600 text-[11px] font-bold rounded-lg transition cursor-pointer"
                        >
                          <Edit2 size={11} />
                          Atur Proyek & Info
                        </button>
                      </td>
                    </tr>
                  ))}
                  {loadingMore && (
                    Array.from({ length: 3 }).map((_, i) => <MemberRowSkeleton key={`skel-more-${i}`} />)
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        <div ref={observerTarget} className="py-4 text-center border-t border-stone-100 bg-stone-50/20">
          {!hasMore && members.length > 0 && !loading && (
            <span className="text-[11px] text-stone-400 font-medium py-1 inline-block">
              Menampilkan seluruh {totalMembers} anggota terdaftar.
            </span>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title={editingMember ? "Simpan Perubahan Anggota" : "Daftarkan Anggota Baru"}
        description={
          editingMember ? (
            <>
              Apakah Anda yakin ingin menyimpan perubahan data <span className="font-semibold text-stone-900">{form.nama}</span>? Role dan akses proyeknya akan diperbarui sesuai form ini.
            </>
          ) : (
            <>
              Apakah Anda yakin ingin mendaftarkan <span className="font-semibold text-stone-900">{form.nama}</span> ({form.email}) sebagai <span className="font-semibold text-stone-900">{form.userRole}</span>?
            </>
          )
        }
        confirmLabel={editingMember ? "Simpan" : "Daftarkan"}
        isLoading={submitting}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
      />

      <SuccessDialog
        open={showSuccessDialog}
        title={success.includes("diperbarui") ? "Anggota Berhasil Diperbarui" : "Anggota Berhasil Didaftarkan"}
        description={success}
        onClose={() => {
          setShowSuccessDialog(false);
          setSuccess("");
        }}
      />
    </main>
  );
}