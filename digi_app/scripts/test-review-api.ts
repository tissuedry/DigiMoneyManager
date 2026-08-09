import { computeApproveError } from '../app/api/pengajuan-anggaran/[id]/review/route';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
  console.log('ok:', msg);
}

assert(computeApproveError({ alokasiBaru: 60, sumLain: 50, rabTotal: 100, sumSub: 0 }) === 'Batas Nilai Proyek terlampaui', 'over rab -> error');
assert(computeApproveError({ alokasiBaru: 5, sumLain: 50, rabTotal: 100, sumSub: 10 }) === 'Alokasi baru kurang dari total alokasi sub', 'kurang sub -> error');
assert(computeApproveError({ alokasiBaru: 40, sumLain: 50, rabTotal: 100, sumSub: 10 }) === null, 'valid -> null');

console.log('ALL PASS');
