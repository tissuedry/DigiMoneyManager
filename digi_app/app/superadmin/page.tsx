import React from "react";
import { 
  Wallet, Users, Folder, Inbox, Layers, TrendingUp, Receipt, ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function SuperAdminDashboard() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Info */}
      <div>
        <h1 className="text-3xl font-bold text-stone-900">Beranda Super Admin</h1>
        <p className="text-stone-500 mt-2 text-sm max-w-3xl">
          Satu layar untuk memantau seluruh alur kerja — karyawan, project manager, keuangan, dan direktur.
        </p>
      </div>

      {/* Stats Summary Bar */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {/* Stat Item */}
        <div className="flex items-center gap-2 bg-[#f2f4f7] px-3 py-1.5 rounded-lg border border-stone-100">
          <Wallet size={16} className="text-blue-500" />
          <span className="text-sm font-bold text-stone-800">Rp 16.000.000.000</span>
          <span className="text-[11px] text-stone-500">Total Nilai Proyek</span>
        </div>
        <div className="flex items-center gap-2 bg-[#e6f4ea] px-3 py-1.5 rounded-lg border border-stone-100">
          <Users size={16} className="text-emerald-600" />
          <span className="text-sm font-bold text-stone-800">6</span>
          <span className="text-[11px] text-stone-500">User Aktif</span>
        </div>
        <div className="flex items-center gap-2 bg-[#f4e6f4] px-3 py-1.5 rounded-lg border border-stone-100">
          <Folder size={16} className="text-purple-600" />
          <span className="text-sm font-bold text-stone-800">5</span>
          <span className="text-[11px] text-stone-500">Proyek Aktif</span>
        </div>
        <div className="flex items-center gap-2 bg-[#fce8d5] px-3 py-1.5 rounded-lg border border-stone-100">
          <Inbox size={16} className="text-orange-500" />
          <span className="text-sm font-bold text-stone-800">4</span>
          <span className="text-[11px] text-stone-500">Approval Tertunda</span>
        </div>
        <div className="flex items-center gap-2 bg-[#e0f2f1] px-3 py-1.5 rounded-lg border border-stone-100">
          <Layers size={16} className="text-teal-600" />
          <span className="text-sm font-bold text-stone-800">15</span>
          <span className="text-[11px] text-stone-500">Akun CoA</span>
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Karyawan Card */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="w-10 h-10 bg-[#e6f4ea] text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <Receipt size={20} />
            </div>
            <h3 className="font-bold text-lg text-stone-800">Karyawan</h3>
            <p className="text-sm text-stone-500 mt-1">Reimbursement & riwayat pengajuan</p>
          </div>
          <Link href="/superadmin/karyawan/riwayat" className="flex items-center justify-between text-emerald-600 font-semibold text-sm mt-6 hover:text-emerald-700">
            21 pengajuan tercatat <ArrowRight size={16} />
          </Link>
        </div>

        {/* Project Manager Card */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="w-10 h-10 bg-[#fde8e8] text-red-500 rounded-xl flex items-center justify-center mb-4">
              <Folder size={20} />
            </div>
            <h3 className="font-bold text-lg text-stone-800">Project Manager</h3>
            <p className="text-sm text-stone-500 mt-1">Approval, kelola proyek & budget</p>
          </div>
          <Link href="/superadmin/pm/approval" className="flex items-center justify-between text-emerald-600 font-semibold text-sm mt-6 hover:text-emerald-700">
            2 menunggu approval <ArrowRight size={16} />
          </Link>
        </div>

        {/* Tim Keuangan Card */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="w-10 h-10 bg-[#e0f2fe] text-blue-500 rounded-xl flex items-center justify-center mb-4">
              <Wallet size={20} />
            </div>
            <h3 className="font-bold text-lg text-stone-800">Tim Keuangan</h3>
            <p className="text-sm text-stone-500 mt-1">Pencairan, jurnal & laporan</p>
          </div>
          <Link href="/superadmin/keuangan/pencairan" className="flex items-center justify-between text-emerald-600 font-semibold text-sm mt-6 hover:text-emerald-700">
            2 siap dicairkan <ArrowRight size={16} />
          </Link>
        </div>

        {/* Direktur Card */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="w-10 h-10 bg-[#ede9fe] text-purple-600 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp size={20} />
            </div>
            <h3 className="font-bold text-lg text-stone-800">Direktur</h3>
            <p className="text-sm text-stone-500 mt-1">Kelola proyek, profitabilitas & laporan eksekutif</p>
          </div>
          <Link href="/superadmin/direktur/proyek" className="flex items-center justify-between text-emerald-600 font-semibold text-sm mt-6 hover:text-emerald-700">
            5 proyek aktif <ArrowRight size={16} />
          </Link>
        </div>

        {/* Master CoA Card */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="w-10 h-10 bg-[#f3e8ff] text-purple-500 rounded-xl flex items-center justify-center mb-4">
              <Layers size={20} />
            </div>
            <h3 className="font-bold text-lg text-stone-800">Master CoA</h3>
            <p className="text-sm text-stone-500 mt-1">Chart of Accounts</p>
          </div>
          <Link href="/superadmin/master-coa" className="flex items-center justify-between text-emerald-600 font-semibold text-sm mt-6 hover:text-emerald-700">
            15 akun terdaftar <ArrowRight size={16} />
          </Link>
        </div>

        {/* Kelola Akun Card */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="w-10 h-10 bg-[#ffedd5] text-orange-500 rounded-xl flex items-center justify-center mb-4">
              <Users size={20} />
            </div>
            <h3 className="font-bold text-lg text-stone-800">Kelola Akun</h3>
            <p className="text-sm text-stone-500 mt-1">Akun karyawan & akses sistem</p>
          </div>
          <Link href="/superadmin/kelola-akun" className="flex items-center justify-between text-emerald-600 font-semibold text-sm mt-6 hover:text-emerald-700">
            Kelola pengguna <ArrowRight size={16} />
          </Link>
        </div>

      </div>
    </div>
  );
}