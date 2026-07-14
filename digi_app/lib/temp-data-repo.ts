import { prisma } from './prisma';

interface CachedAIChatContext {
  projectsContext: any[];
  totalReimbursements: number;
  recentReimbursementsContext: any[];
  coas: any[];
  totalJurnal: number;
  
  // Pre-calculated fields for optimized AI queries
  pendingStats: {
    count: number;
    totalNominal: number;
    countPM: number;
    countKeuangan: number;
  };
  largestApproved: {
    nominal: number;
    pemohon: string;
    proyek: string;
    kategoriAnggaran: string;
  } | null;
}

let cache: CachedAIChatContext | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 30000; // 30 seconds

export async function getAIChatContext(): Promise<CachedAIChatContext> {
  const now = Date.now();
  if (cache && now - lastFetchTime < CACHE_TTL) {
    console.log('Serving AI Chat Context from temporary repository cache');
    return cache;
  }

  console.log('Fetching fresh data for AI Chat Context');
  const [
    projects,
    totalReimbursements,
    recentReimbursements,
    coas,
    totalJurnal,
    pendingRbs,
    largestRb
  ] = await Promise.all([
    prisma.proyek.findMany({
      include: {
        budget: {
          select: {
            rabTotal: true,
            totalPengeluaran: true,
            totalReimbursement: true,
            sisaBudget: true,
          },
        },
      },
    }),
    prisma.reimbursement.count(),
    prisma.reimbursement.findMany({
      take: 10,
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
    prisma.chartOfAccounts.findMany({
      select: { nomorAkun: true, namaAkun: true, tipe: true },
    }),
    prisma.jurnalAkuntansi.count(),
    prisma.reimbursement.findMany({
      where: {
        status: { in: ['SUBMITTED', 'APPROVED_BY_PM'] },
      },
      select: {
        nominal: true,
        status: true,
      },
    }),
    prisma.reimbursement.findFirst({
      where: { status: 'APPROVED' },
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
    })
  ]);

  const projectsContext = projects.map((p) => {
    const rab = p.budget ? Number(p.budget.rabTotal) : 0;
    const sisa = p.budget ? Number(p.budget.sisaBudget) : 0;
    const margin = rab > 0 ? parseFloat(((sisa / rab) * 100).toFixed(1)) : 0;

    return {
      id: p.id,
      nama: p.nama,
      status: p.status,
      budget: p.budget ? {
        rabTotal: rab,
        totalPengeluaran: Number(p.budget.totalPengeluaran),
        totalReimbursement: Number(p.budget.totalReimbursement),
        sisaBudget: sisa,
        margin: margin,
      } : null,
      margin: margin,
    };
  });

  const recentReimbursementsContext = recentReimbursements.map((r: any) => ({
    id: r.id,
    pemohon: r.user.nama,
    proyek: r.proyek.nama,
    kategoriAnggaran: r.keteranganAnggaran?.subAnggaran?.mainAnggaran?.namaMain
      || r.keteranganAnggaran?.keterangan
      || 'N/A',
    nominal: Number(r.nominal),
    status: r.status,
    fraudFlag: r.fraudFlag,
  }));

  const totalPendingNominal = pendingRbs.reduce((sum, r) => sum + Number(r.nominal), 0);
  const countPM = pendingRbs.filter(r => r.status === 'SUBMITTED').length;
  const countKeuangan = pendingRbs.filter(r => r.status === 'APPROVED_BY_PM').length;

  const pendingStats = {
    count: pendingRbs.length,
    totalNominal: totalPendingNominal,
    countPM,
    countKeuangan,
  };

  const largestApproved = largestRb ? {
    nominal: Number(largestRb.nominal),
    pemohon: (largestRb as any).user.nama,
    proyek: (largestRb as any).proyek.nama,
    kategoriAnggaran: (largestRb as any).keteranganAnggaran?.subAnggaran?.mainAnggaran?.namaMain
      || (largestRb as any).keteranganAnggaran?.keterangan
      || 'N/A',
  } : null;

  cache = {
    projectsContext,
    totalReimbursements,
    recentReimbursementsContext,
    coas,
    totalJurnal,
    pendingStats,
    largestApproved,
  };
  lastFetchTime = now;

  return cache;
}

export function clearAIChatContextCache() {
  cache = null;
  lastFetchTime = 0;
}
