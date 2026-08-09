import { validateAlokasi } from '../app/api/proyek/[id]/pengajuan-anggaran/route';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
  console.log('ok:', msg);
}

assert(validateAlokasi({ rabTotal: 100, sumLain: 90, alokasiBaru: 20, sumSub: 5 }) === false, 'over rabTotal ditolak');
assert(validateAlokasi({ rabTotal: 100, sumLain: 90, alokasiBaru: 10, sumSub: 5 }) === true, 'tepat rabTotal diterima');
assert(validateAlokasi({ rabTotal: 100, sumLain: 50, alokasiBaru: 5, sumSub: 10 }) === false, 'kurang dari sub child ditolak');
assert(validateAlokasi({ rabTotal: 100, sumLain: 50, alokasiBaru: 40, sumSub: 10 }) === true, 'valid diterima');

console.log('ALL PASS');
