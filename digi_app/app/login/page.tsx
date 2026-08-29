'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Camera,
  BookOpen,
  TrendingUp,
  Loader2
} from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const handleLogin = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/digimoney/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login gagal');
      }

      setSuccessMsg('Login berhasil! Mengalihkan ke dashboard...');

      setLoginEmail('');
      setLoginPassword('');

        const role = data.user.role || '';
        const roleLower = String(role).trim().toLowerCase();
        const roles: string[] = Array.isArray(data.user.roles)
          ? data.user.roles.map((r: any) => String(r).trim().toLowerCase())
          : [roleLower];

        const isSuperAdmin = 
          roleLower === 'superadmin' || 
          roleLower === 'super admin' || 
          roles.includes('superadmin') || 
          roles.includes('super admin');

        if (isSuperAdmin) {
          window.location.href = '/digimoney/superadmin';
        } else if (role === 'Tim Keuangan' || roles.includes('tim keuangan')) {
          window.location.href = '/digimoney/keuangan';
        } else if (role === 'Direktur / Manajemen' || roles.includes('direktur / manajemen')) {
          window.location.href = '/digimoney/manager';
        } else {
          window.location.href = '/digimoney/select-project';
        }

    } catch (err: any) {
      setErrorMsg(err.message || 'Email atau password salah.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-stone-800 font-sans bg-[#f8f6f1]">

      <div className="hidden lg:flex lg:w-5/12 bg-[#003d29] text-white flex-col justify-between p-12 relative overflow-hidden shrink-0 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />

        <div className="z-10 flex items-center gap-3">
          <div className="flex items-center justify-center shrink-0">
            <Image src="/digimoney/logo.png" alt="Digi Money Manager" width={40} height={40} className="object-contain" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight leading-tight">Digi Money Manager</h1>
            <p className="text-[10px] text-emerald-300 font-medium">Sistem Keuangan Proyek</p>
          </div>
        </div>

        <div className="z-10 space-y-12 my-auto">
          <div className="space-y-4">
            <span className="text-xs font-bold tracking-widest text-emerald-300 uppercase">
              KEUANGAN PROYEK, SATU PINTU
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight leading-[1.15] max-w-md font-serif text-emerald-50">
              Budget proyek <span className="italic font-normal text-emerald-300">sehat</span>, reimbursement tanpa drama.
            </h2>
            <p className="text-sm text-emerald-100/70 max-w-sm leading-relaxed font-medium">
              Pantau RAB, validasi pengajuan, dan hasilkan jurnal akuntansi otomatis.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
                <Camera size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-emerald-100">Foto struk, AI yang isi</h4>
                <p className="text-xs text-emerald-100/50 leading-relaxed font-medium">
                  VLM otomatis mengisi nominal, merchant, dan pos anggaran.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
                <BookOpen size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-emerald-100">Jurnal Debit–Kredit otomatis</h4>
                <p className="text-xs text-emerald-100/50 leading-relaxed font-medium">
                  Setiap pencairan langsung jadi entri jurnal yang seimbang.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
                <TrendingUp size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-emerald-100">Budget real-time</h4>
                <p className="text-xs text-emerald-100/50 leading-relaxed font-medium">
                  Sisa anggaran terupdate tiap transaksi, lengkap dengan alert.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="z-10 text-[10px] text-emerald-100/30 font-medium">
          © {new Date().getFullYear()} Digi Money Manager. Hak Cipta Dilindungi.
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12">
        <div className="w-full max-w-[440px] space-y-8">

          <div className="flex items-center gap-3 lg:hidden mb-4">
            <div className="flex items-center justify-center shrink-0">
              <Image src="/digimoney/logo.png" alt="Digi Money Manager" width={36} height={36} className="object-contain" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight leading-tight text-stone-900">Digi Money Manager</h1>
              <p className="text-[9px] text-[#008f5d] font-bold">Sistem Keuangan Proyek</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-[28px] font-extrabold tracking-tight leading-none text-stone-900">
              Selamat datang kembali
            </h3>
            <p className="text-xs text-stone-400 font-medium">
              Masuk untuk mengelola keuangan proyekmu.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-4 py-3 rounded-xl shadow-sm text-left">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-[#008f5d] text-xs font-bold px-4 py-3 rounded-xl shadow-sm text-left animate-pulse">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-stone-500">Email kantor</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-stone-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="nama@perusahaan.co.id"
                  className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-3 py-3 text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#008f5d] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-stone-500">Kata sandi</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-stone-400">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-10 py-3 text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#008f5d] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-700 transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-8 bg-[#008f5d] hover:bg-[#007a4f] text-white text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Masuk
                  <span className="stroke-2">→</span>
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
