import { prisma } from './prisma';

export interface AIChatScope {
  role: string;
  userId: number;
  proyekId?: number | null;
}

interface CachedAIChatContext {
  scopeNote: string;
  projectsContext: any[];
  posAnggaranContext: any[];
  teamContext: any[];
  pengajuanAnggaranContext: any[];
  totalReimbursements: number;
  recentReimbursementsContext: any[];
  coas: any[];
  totalJurnal: number;

  pendingStats: {
    count: number;
    totalNominal: number;
    countPM: number;
    countKeuangan: number;
    countRealisasiAnggaran: number;
    countReimbursementBiasa: number;
  };
  thisMonthStats: {
    count: number;
    totalNominal: number;
  };
  largestApproved: {
    tipe: string;
    nama: string | null;
    nominal: number;
    pemohon: string;
    proyek: string;
    kategoriAnggaran: string;
  } | null;
}

const FULL_ACCESS_ROLES = ['Tim Keuangan', 'Direktur / Manajemen'];

const TEAM_AND_PROPOSAL_ROLES = ['Project Manager', 'Direktur / Manajemen'];

const cacheStore = new Map<string, { data: CachedAIChatContext; time: number }>();
const CACHE_TTL = 30000;

function cacheKeyFor(scope: AIChatScope): string {
  if (FULL_ACCESS_ROLES.includes(scope.role)) return 'full';
  return `${scope.role}:${scope.userId}:${scope.proyekId ?? 'none'}`;
}

export async function getAIChatContext(scope: AIChatScope): Promise<CachedAIChatContext> {
  const key = cacheKeyFor(scope);
  const now = Date.now();
  const cached = cacheStore.get(key);
  if (cached && now - cached.time < CACHE_TTL) {
    console.log(`Serving AI Chat Context from temporary repository cache (${key})`);
    return cached.data;
  }

  console.log(`Fetching fresh data for AI Chat Context (${key})`);

  const isFullAccess = FULL_ACCESS_ROLES.includes(scope.role);
  const canSeeTeamAndProposals = TEAM_AND_PROPOSAL_ROLES.includes(scope.role);

  let proyekIdScope: number[] | null = null;
  if (scope.role === 'Project Manager') {
    const managed = await prisma.userProyek.findMany({
      where: { userId: scope.userId, role: 'Project Manager' },
      select: { proyekId: true },
    });
    proyekIdScope = managed.map((m) => m.proyekId);
  } else if (scope.role === 'Karyawan') {
    proyekIdScope = scope.proyekId ? [scope.proyekId] : [];
  }

  const proyekWhere = proyekIdScope ? { id: { in: proyekIdScope } } : {};
  const reimbursementScopeWhere = {
    ...(proyekIdScope ? { proyekId: { in: proyekIdScope } } : {}),
    ...(scope.role === 'Karyawan' ? { userId: scope.userId } : {}),
  };

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    projects,
    totalReimbursements,
    recentReimbursements,
    coas,
    totalJurnal,
    pendingRbs,
    largestRb,
    teamRows,
    pengajuanAnggaranRows,
    thisMonthAgg,
  ] = await Promise.all([
    prisma.proyek.findMany({
      where: proyekWhere,
      include: {
        budget: {
          select: {
            nilaiKontrak: true,
            totalPengeluaran: true,
            totalReimbursement: true,
            sisaBudget: true,
            mainAnggaran: {
              select: {
                namaMain: true,
                nominalAlokasi: true,
                nominalTerpakai: true,
                subAnggaran: {
                  select: {
                    namaSub: true,
                    nominalAlokasi: true,
                    nominalTerpakai: true,
                    keterangan: {
                      select: {
                        keterangan: true,
                        nominalAlokasi: true,
                        nominalRealisasi: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.reimbursement.count({ where: reimbursementScopeWhere }),
    prisma.reimbursement.findMany({
      where: reimbursementScopeWhere,
      take: 30,
      orderBy: { id: 'desc' },
      include: {
        user: { select: { nama: true } },
        proyek: { select: { nama: true } },
        keteranganAnggaran: {
          select: {
            keterangan: true,
            subAnggaran: { select: { mainAnggaran: { select: { namaMain: true } } } },
          },
        },
      },
    }),
    isFullAccess
      ? prisma.masterSub.findMany({ where: { tipe: 'pemasukan' }, select: { id: true, nama: true, tipe: true } })
      : Promise.resolve([]),
    isFullAccess ? prisma.jurnalAkuntansi.count() : Promise.resolve(0),
    prisma.reimbursement.findMany({
      where: {
        status: { in: ['SUBMITTED', 'APPROVED_BY_PM'] },
        ...reimbursementScopeWhere,
      },
      select: {
        nominal: true,
        status: true,
        tipe: true,
      },
    }),
    prisma.reimbursement.findFirst({
      where: { status: 'APPROVED', ...reimbursementScopeWhere },
      orderBy: { nominal: 'desc' },
      include: {
        user: { select: { nama: true } },
        proyek: { select: { nama: true } },
        keteranganAnggaran: {
          select: {
            keterangan: true,
            subAnggaran: { select: { mainAnggaran: { select: { namaMain: true } } } },
          },
        },
      },
    }),
    canSeeTeamAndProposals
      ? prisma.userProyek.findMany({
          where: proyekWhere.id ? { proyekId: proyekWhere.id } : {},
          select: {
            role: true,
            divisi: true,
            user: { select: { nama: true } },
            proyek: { select: { nama: true } },
          },
        })
      : Promise.resolve([]),
    canSeeTeamAndProposals
      ? prisma.pengajuanAnggaran.findMany({
          where: proyekWhere.id ? { proyekId: proyekWhere.id } : {},
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            pengaju: { select: { nama: true } },
            proyek: { select: { nama: true } },
            mainAnggaran: { select: { namaMain: true } },
          },
        })
      : Promise.resolve([]),
    prisma.reimbursement.aggregate({
      where: { ...reimbursementScopeWhere, createdAt: { gte: startOfMonth } },
      _count: true,
      _sum: { nominal: true },
    }),
  ]);

  const projectsContext = projects.map((p: any) => {
    const nilaiKontrak = p.budget ? Number(p.budget.nilaiKontrak) : 0;
    const sisa = p.budget ? Number(p.budget.sisaBudget) : 0;
    const margin = nilaiKontrak > 0 ? parseFloat(((sisa / nilaiKontrak) * 100).toFixed(1)) : 0;

    return {
      id: p.id,
      nama: p.nama,
      status: p.status,
      budget: p.budget ? {
        nilaiKontrak: nilaiKontrak,
        totalPengeluaran: Number(p.budget.totalPengeluaran),
        totalReimbursement: Number(p.budget.totalReimbursement),
        sisaBudget: sisa,
        margin: margin,
      } : null,
      margin: margin,
    };
  });

  const posAnggaranContext: any[] = [];
  for (const p of projects as any[]) {
    if (!p.budget) continue;
    for (const main of p.budget.mainAnggaran || []) {
      for (const sub of main.subAnggaran || []) {
        for (const ket of sub.keterangan || []) {
          posAnggaranContext.push({
            proyek: p.nama,
            kategoriUtama: main.namaMain,
            subKategori: sub.namaSub,
            pos: ket.keterangan,
            alokasi: Number(ket.nominalAlokasi),
            realisasi: Number(ket.nominalRealisasi),
            sisaAlokasi: Number(ket.nominalAlokasi) - Number(ket.nominalRealisasi),
          });
        }
      }
    }
  }

  const teamContext = (teamRows as any[]).map((t) => ({
    proyek: t.proyek.nama,
    nama: t.user.nama,
    role: t.role === 'Anggota Lapangan' ? 'Karyawan' : t.role,
    divisi: t.divisi || null,
  }));

  const pengajuanAnggaranContext = (pengajuanAnggaranRows as any[]).map((pa) => ({
    id: pa.id,
    proyek: pa.proyek.nama,
    pengaju: pa.pengaju.nama,
    judul: pa.judul,
    status: pa.status,
    catatan: pa.catatan || null,
    createdAt: pa.createdAt,
    mainAnggaran: pa.mainAnggaran?.namaMain ?? null,
    alokasiLama: pa.alokasiLama !== null ? Number(pa.alokasiLama) : null,
    alokasiBaru: pa.alokasiBaru !== null ? Number(pa.alokasiBaru) : null,
  }));

  const recentReimbursementsContext = recentReimbursements.map((r: any) => ({
    id: r.id,
    tipe: r.tipe || 'Reimbursement',
    nama: r.nama || null,
    pemohon: r.user.nama,
    proyek: r.proyek.nama,
    kategoriAnggaran: r.keteranganAnggaran?.subAnggaran?.mainAnggaran?.namaMain
      || r.keteranganAnggaran?.keterangan
      || 'N/A',
    nominal: Number(r.nominal),
    status: r.status,
    fraudFlag: r.fraudFlag,
    createdAt: r.createdAt,
    tanggalStruk: r.tanggalStruk || null,
  }));

  const totalPendingNominal = pendingRbs.reduce((sum: number, r: any) => sum + Number(r.nominal), 0);
  const countPM = pendingRbs.filter((r: any) => r.status === 'SUBMITTED').length;
  const countKeuangan = pendingRbs.filter((r: any) => r.status === 'APPROVED_BY_PM').length;
  const countRealisasiAnggaran = pendingRbs.filter((r: any) => r.tipe === 'Realisasi Anggaran').length;
  const countReimbursementBiasa = pendingRbs.length - countRealisasiAnggaran;

  const pendingStats = {
    count: pendingRbs.length,
    totalNominal: totalPendingNominal,
    countPM,
    countKeuangan,
    countRealisasiAnggaran,
    countReimbursementBiasa,
  };

  const thisMonthStats = {
    count: (thisMonthAgg as any)._count as number,
    totalNominal: Number((thisMonthAgg as any)._sum.nominal || 0),
  };

  const largestApproved = largestRb ? {
    tipe: (largestRb as any).tipe || 'Reimbursement',
    nama: (largestRb as any).nama || null,
    nominal: Number(largestRb.nominal),
    pemohon: (largestRb as any).user.nama,
    proyek: (largestRb as any).proyek.nama,
    kategoriAnggaran: (largestRb as any).keteranganAnggaran?.subAnggaran?.mainAnggaran?.namaMain
      || (largestRb as any).keteranganAnggaran?.keterangan
      || 'N/A',
  } : null;

  const scopeNote = isFullAccess
    ? 'Akses penuh ke seluruh proyek, tim, pengajuan anggaran, dan data akuntansi perusahaan.'
    : scope.role === 'Project Manager'
    ? 'Dibatasi hanya untuk proyek yang dikelola user ini sebagai Project Manager (termasuk tim & pengajuan anggaran proyek tersebut). Tidak ada akses ke CoA/jurnal akuntansi atau proyek lain.'
    : 'Dibatasi hanya untuk proyek aktif dan riwayat pengajuan reimbursement milik user ini sendiri. Tidak ada akses ke data tim, pengajuan anggaran, proyek lain, user lain, atau CoA/jurnal akuntansi.';

  const data: CachedAIChatContext = {
    scopeNote,
    projectsContext,
    posAnggaranContext,
    teamContext,
    pengajuanAnggaranContext,
    totalReimbursements,
    recentReimbursementsContext,
    coas,
    totalJurnal,
    pendingStats,
    thisMonthStats,
    largestApproved,
  };

  cacheStore.set(key, { data, time: now });

  return data;
}
