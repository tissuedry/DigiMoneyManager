'use client';

import Link from 'next/link';
import { Check, PlusCircle } from 'lucide-react';

export default function SuccessScreen({
  count,
  totalNominal,
  onReset,
}: {
  count: number;
  totalNominal: string;
  onReset: () => void;
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm max-w-2xl mx-auto text-center space-y-6 animate-fade-in">
      <div className="w-16 h-16 bg-[#008F5D] text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-700/20">
        <Check size={36} className="stroke-3" />
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <h2 className="text-xl font-extrabold text-stone-900">
          {count} Pengajuan Berhasil Dikirim!
        </h2>
        <p className="text-xs text-stone-500 leading-relaxed font-medium">
          Seluruh {count} pengajuan reimbursement dengan total nominal{' '}
          <span className="font-extrabold text-stone-900 ">Rp {totalNominal}</span> telah
          diteruskan ke Project Manager untuk proses persetujuan (approval).
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        <Link href="/superadmin/riwayat-pengajuan">
          <button className="px-5 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold rounded-xl transition shadow-sm cursor-pointer">
            Lihat Riwayat Pengajuan
          </button>
        </Link>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#008F5D] hover:bg-[#007A4F] text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
        >
          <PlusCircle size={14} /> Ajukan Struk Lain
        </button>
      </div>
    </div>
  );
}
