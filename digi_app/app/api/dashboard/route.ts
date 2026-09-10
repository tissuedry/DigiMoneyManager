import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCached, setCache } from '@/lib/route-cache';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    const role = req.headers.get('x-user-role');
    const userProyekId = req.headers.get('x-user-proyek-id');

    if (!userId || !role) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectIdParam = searchParams.get('projectId') || userProyekId || '';
    const cacheKey = `dashboard:${role}:${userId}:${projectIdParam}`;
    const cached = getCached(cacheKey);
    if (cached) return NextResponse.json(cached);

    const dashboardData: any = { role };

    if (role === 'Karyawan') {
      const karyawanWhere: any = { userId: parseInt(userId, 10) };
      if (userProyekId) {
        karyawanWhere.proyekId = parseInt(userProyekId, 10);
      }

      const [reimbSummary, recentReimb] = await Promise.all([
        prisma.reimbursement.groupBy({
          by: ['status'],
          where: karyawanWhere,
          _sum: { nominal: true },
          _count: { _all: true },
        }),
        prisma.reimbursement.findMany({
          where: karyawanWhere,
          include: {
            proyek: { select: { nama: true } },
            keteranganAnggaran: {
              select: {
                keterangan: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        })
      ]);

      const countFor = (status: string) =>
        reimbSummary.find(r => r.status === status)?._count._all ?? 0;

      const totalSubmissions = reimbSummary.reduce((sum, r) => sum + r._count._all, 0);
      const totalNominal = reimbSummary.reduce((sum, r) => sum + Number(r._sum.nominal ?? 0), 0);
      const totalPending = countFor('SUBMITTED') + countFor('APPROVED_BY_PM');
      const totalApproved = countFor('APPROVED');
      const totalRejected = countFor('REJECTED');

      const mappedRecent = recentReimb.map((r: any) => ({
        ...r,
        strukUrl: r.urlStruk,
        posAnggaran: r.keteranganAnggaran ? {
          deskripsi: r.keteranganAnggaran.keterangan,
          namaPos: r.keteranganAnggaran.subAnggaran?.mainAnggaran?.namaMain,
        } : null,
      }));

      dashboardData.summary = {
        totalSubmissions: totalSubmissions,
        totalNominalSubmitted: totalNominal,
        pendingCount: totalPending,
        approvedCount: totalApproved,
        rejectedCount: totalRejected,
      };
      dashboardData.recentSubmissions = mappedRecent;

    } else if (role === 'Project Manager') {
      const targetProjectId = projectIdParam;

      if (!targetProjectId) {
        dashboardData.project = null;
        dashboardData.message = 'No project associated with this Project Manager';
      } else {
        const project = await prisma.proyek.findUnique({
          where: { id: parseInt(targetProjectId, 10) },
          include: {
            budget: {
              include: {
                mainAnggaran: {
                  orderBy: { id: 'asc' },
                  include: { 
                    subAnggaran: { 
                      orderBy: { id: 'asc' },
                      include: { 
                        keterangan: {
                          orderBy: { id: 'asc' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

        const pendingApprovalsCount = await prisma.reimbursement.count({
          where: {
            proyekId: parseInt(targetProjectId, 10),
            status: 'SUBMITTED',
          },
        });

        const activeAlerts = await prisma.notification.findMany({
          where: {
            userId: parseInt(userId, 10),
            tipe: 'alert',
            dibaca: false,
          },
          orderBy: { timestamp: 'desc' },
          take: 3,
        });

        const mappedBudget = project?.budget ? {
          ...project.budget,
          posAnggaran: project.budget.mainAnggaran
            .filter((m: any) => !m.tipe || m.tipe.toLowerCase() === 'pengeluaran')
            .map((main) => ({
            ...main,
            deskripsi: main.namaMain,
            namaPos: main.namaMain,
            nominalTerpakai: String(
              main.subAnggaran.reduce(
                (sum: number, sub: any) =>
                  sum + sub.keterangan.reduce(
                    (s: number, ket: any) => s + Number(ket.nominalRealisasi || 0), 0
                  ),
                0
              )
            ),
          })),
        } : null;

        dashboardData.project = project ? {
          ...project,
          budget: mappedBudget,
        } : null;
        dashboardData.pendingApprovalsCount = pendingApprovalsCount;
        dashboardData.alerts = activeAlerts;
      }

    } else if (role === 'Tim Keuangan') {
      const activeProjectsCount = await prisma.proyek.count({
        where: { status: 'AKTIF' },
      });

      const budgets = await prisma.budget.findMany();
      const totalRABAllocated = budgets.reduce((sum, b) => sum + Number(b.nilaiKontrak), 0);
      const totalCashDisbursed = budgets.reduce((sum, b) => sum + Number(b.totalPengeluaran), 0);
      const totalReimbursementsDisbursed = budgets.reduce((sum, b) => sum + Number(b.totalReimbursement), 0);
      const remainingBudgets = budgets.reduce((sum, b) => sum + Number(b.sisaBudget), 0);

      const pendingDisbursementCount = await prisma.reimbursement.count({
        where: { status: 'APPROVED_BY_PM' },
      });

      const pendingDisbursementsNominalResult = await prisma.reimbursement.aggregate({
        where: { status: 'APPROVED_BY_PM' },
        _sum: { nominal: true },
      });
      const pendingDisbursementsNominal = Number(pendingDisbursementsNominalResult._sum.nominal || 0);

      const recentActivities = await prisma.auditTrail.findMany({
        include: { user: { select: { nama: true, role: true } } },
        orderBy: { timestamp: 'desc' },
        take: 10,
      });

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const todayApprovals = await prisma.approval.findMany({
        where: {
          level: 'KEUANGAN',
          status: 'APPROVED',
          timestamp: { gte: startOfToday },
        },
        include: {
          reimbursement: {
            select: { nominal: true },
          },
        },
      });

      const disbursedTodayCount = todayApprovals.length;
      const disbursedTodayNominal = todayApprovals.reduce(
        (sum, a) => sum + Number(a.reimbursement.nominal),
        0
      );

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const monthApprovals = await prisma.approval.findMany({
        where: {
          level: 'KEUANGAN',
          status: 'APPROVED',
          timestamp: { gte: startOfMonth },
        },
        select: { reimbursementId: true },
      });
      const monthReimbursementIds = monthApprovals.map((a) => a.reimbursementId);

      const jurnalCountThisMonth = monthReimbursementIds.length > 0
        ? await prisma.jurnalAkuntansi.count({
          where: { reimbursementId: { in: monthReimbursementIds } },
        })
        : 0;

      const totalJurnalResult = await prisma.jurnalAkuntansi.aggregate({
        _sum: { nominal: true },
      });
      const totalDebitKredit = Number(totalJurnalResult._sum.nominal || 0);
      const totalDebit = totalDebitKredit;
      const totalKredit = totalDebitKredit;

      const recentJournalsRaw = await prisma.jurnalAkuntansi.findMany({
        include: {
          reimbursement: {
            include: {
              user: { select: { nama: true } },
              keteranganAnggaran: {
                select: {
                  keterangan: true,
                  subAnggaran: { select: { mainAnggaran: { select: { namaMain: true } } } },
                },
              },
            },
          },
          transaksiPemasukan: {
            include: {
              user: { select: { nama: true } },
              proyek: { select: { nama: true } },
              subCoa: { select: { nama: true } },
            },
          },
        },
        orderBy: { id: 'desc' },
        take: 5,
      });

      const recentJournals = recentJournalsRaw.map((j) => {
        if (j.transaksiPemasukan) {
          const tx = j.transaksiPemasukan;
          const tanggal = tx.tanggalTransaksi
            ? new Date(tx.tanggalTransaksi).toISOString().split('T')[0]
            : null;

          let kategoriLabel = tx.kategori;
          if (tx.kategori === 'DISKON_PENJUALAN') kategoriLabel = 'Diskon Penjualan';
          else if (tx.kategori === 'RETUR_PENJUALAN') kategoriLabel = 'Retur Penjualan';
          else if (tx.kategori === 'BIAYA_PENJUALAN_LAINNYA') kategoriLabel = 'Biaya Penjualan';
          else if (tx.kategori === 'PENERIMAAN_PENJUALAN') kategoriLabel = 'Penerimaan Penjualan';

          return {
            jeId: `JE-${String(j.id).padStart(4, '0')}`,
            tanggal,
            keterangan: j.keterangan || tx.keterangan || `Transaksi ${kategoriLabel} - ${tx.proyek?.nama || ''}`,
            debitKode: j.noAkunDebit,
            debitNama: j.noAkunDebit,
            kreditKode: j.noAkunKredit,
            kreditNama: j.noAkunKredit,
            nominal: Number(j.nominal),
          };
        }

        const tanggal = j.reimbursement?.tanggalStruk || null;
        const tipePengajuan = j.reimbursement?.tipe || 'Pengajuan';
        const kategori = j.reimbursement?.keteranganAnggaran?.subAnggaran?.mainAnggaran?.namaMain
          || j.reimbursement?.keteranganAnggaran?.keterangan
          || '-';

        return {
          jeId: `JE-${String(j.id).padStart(4, '0')}`,
          tanggal,
          keterangan: j.keterangan || `Pencairan ${tipePengajuan} ${j.reimbursement?.user?.nama || ''} - ${kategori}`,
          debitKode: j.noAkunDebit,
          debitNama: j.noAkunDebit,
          kreditKode: j.noAkunKredit,
          kreditNama: j.noAkunKredit,
          nominal: Number(j.nominal),
        };
      });

      const pendingDisbursementsRaw = await prisma.reimbursement.findMany({
        where: { status: 'APPROVED_BY_PM' },
        include: {
          user: {
            select: {
              nama: true,
              proyek: {
                select: {
                  proyekId: true,
                  divisi: true,
                },
              },
            },
          },
          proyek: {
            select: {
              nama: true,
              nomorRegister: true,
            },
          },
        },
        orderBy: { id: 'desc' },
      });

      const pendingDisbursements = pendingDisbursementsRaw.map((r) => {
        const assignment = r.user.proyek.find((up) => up.proyekId === r.proyekId);
        return {
          id: r.id,
          nominal: Number(r.nominal),
          status: r.status,
          tipe: r.tipe,
          user: {
            nama: r.user.nama,
            divisi: assignment?.divisi || null,
          },
          proyek: {
            nama: r.proyek.nama,
            nomorRegister: r.proyek.nomorRegister,
          },
        };
      });

      const approvedReimbursementsResult = await prisma.reimbursement.aggregate({
        where: { status: 'APPROVED' },
        _sum: { nominal: true },
        _count: { id: true },
      });
      const totalPengeluaranNominal = Number(approvedReimbursementsResult._sum.nominal || 0);
      const totalPencairanCount = approvedReimbursementsResult._count.id || 0;

      const terminDiterimaResult = await prisma.terminPembayaran.aggregate({
        where: { status: 'DITERIMA' },
        _sum: { nominal: true },
        _count: { id: true },
      });
      const totalPemasukanNominal = Number(terminDiterimaResult._sum.nominal || 0);
      const totalTerminDiterimaCount = terminDiterimaResult._count.id || 0;

      const terminBelumDiterimaResult = await prisma.terminPembayaran.aggregate({
        where: { status: 'BELUM_DITERIMA' },
        _sum: { nominal: true },
        _count: { id: true },
      });
      const totalBelumDiterimaNominal = Number(terminBelumDiterimaResult._sum.nominal || 0);
      const totalTerminBelumDiterimaCount = terminBelumDiterimaResult._count.id || 0;

      const pendingTerminRaw = await prisma.terminPembayaran.findMany({
        where: { status: 'BELUM_DITERIMA' },
        include: {
          proyek: {
            select: {
              nama: true,
              nomorRegister: true,
            },
          },
        },
        orderBy: { urutan: 'asc' },
        take: 5,
      });

      const pendingTerminList = pendingTerminRaw.map((t) => ({
        id: t.id,
        namaTermin: t.namaTermin,
        persentaseProgress: Number(t.persentaseProgress),
        nominal: Number(t.nominal),
        status: t.status,
        proyek: {
          nama: t.proyek.nama,
          nomorRegister: t.proyek.nomorRegister,
        },
      }));

      const riwayatTerminRaw = await prisma.terminPembayaran.findMany({
        where: { status: 'DITERIMA' },
        include: {
          proyek: {
            select: {
              nama: true,
              nomorRegister: true,
            },
          },
        },
        orderBy: { tanggalPencairan: 'desc' },
        take: 5,
      });

      const riwayatTerminList = riwayatTerminRaw.map((t) => ({
        id: t.id,
        namaTermin: t.namaTermin,
        persentaseProgress: Number(t.persentaseProgress),
        nominal: Number(t.nominal),
        tanggalPencairan: t.tanggalPencairan ? t.tanggalPencairan.toISOString().split('T')[0] : null,
        status: t.status,
        proyek: {
          nama: t.proyek.nama,
          nomorRegister: t.proyek.nomorRegister,
        },
      }));

      dashboardData.metrics = {
        activeProjectsCount,
        totalRABAllocated,
        totalCashDisbursed,
        totalReimbursementsDisbursed,
        remainingBudgets,
        totalPengeluaranNominal,
        totalPencairanCount,
        pendingDisbursementCount,
        pendingDisbursementsNominal,
        totalPemasukanNominal,
        totalTerminDiterimaCount,
        totalBelumDiterimaNominal,
        totalTerminBelumDiterimaCount,
        disbursedTodayCount,
        disbursedTodayNominal,
        jurnalCountThisMonth,
        totalDebitKredit,
        totalDebit,
        totalKredit,
      };
      dashboardData.recentActivities = recentActivities;
      dashboardData.recentJournals = recentJournals;
      dashboardData.pendingDisbursements = pendingDisbursements;
      dashboardData.pendingTerminList = pendingTerminList;
      dashboardData.riwayatTerminList = riwayatTerminList;

    } else if (role === 'Direktur / Manajemen') {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const proyekList = await prisma.proyek.findMany({
        include: {
          budget: {
            include: { mainAnggaran: true },
          },
          users: {
            include: { user: { select: { nama: true, role: true } } },
          },
        },
      });

      const ACTIVE_STATUSES = ['Active', 'AKTIF', 'ACTIVE', 'active', 'aktif'];
      const activeProyek = proyekList.filter(p => ACTIVE_STATUSES.includes(p.status));
      const displayProyek = proyekList.filter(p => !['Done', 'Canceled', 'DONE', 'CANCELED'].includes(p.status));

      const totalRABAktif = activeProyek.reduce((sum, p) => sum + Number(p.budget?.nilaiKontrak || 0), 0);
      const totalRABAllocated = proyekList.reduce((sum, p) => sum + Number(p.budget?.nilaiKontrak || 0), 0);
      const totalDisbursed = proyekList.reduce((sum, p) => sum + Number(p.budget?.totalPengeluaran || 0), 0);
      const remainingBudgets = proyekList.reduce((sum, p) => sum + Number(p.budget?.sisaBudget || 0), 0);

      const pemasukanResult = await prisma.transaksiPemasukan.aggregate({
        where: { kategori: { not: 'DISKON_PENJUALAN' } },
        _sum: { nominal: true },
      }).catch(() => ({ _sum: { nominal: null } }));
      const totalPemasukan = Number(pemasukanResult._sum.nominal || 0);

      const totalPengeluaran = totalDisbursed;

      const selisihBersih = totalPemasukan - totalPengeluaran;

      const ytdApprovals = await prisma.approval.findMany({
        where: {
          level: 'KEUANGAN',
          status: 'APPROVED',
          timestamp: { gte: startOfYear },
        },
        include: { reimbursement: { select: { nominal: true, proyekId: true } } },
      });
      const realisasiYTD = ytdApprovals.reduce((sum, a) => sum + Number(a.reimbursement.nominal), 0);

      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

      const [monthlyApprovals, monthlyPemasukan] = await Promise.all([
        prisma.approval.findMany({
          where: {
            level: 'KEUANGAN',
            status: 'APPROVED',
            timestamp: { gte: twelveMonthsAgo },
          },
          include: { reimbursement: { select: { nominal: true } } },
          orderBy: { timestamp: 'asc' },
        }),
        prisma.transaksiPemasukan.findMany({
          where: {
            kategori: { not: 'DISKON_PENJUALAN' },
            tanggalTransaksi: { gte: twelveMonthsAgo },
          },
          select: { nominal: true, tanggalTransaksi: true },
          orderBy: { tanggalTransaksi: 'asc' },
        }).catch(() => []),
      ]);

      const outflowByMonth = new Map<string, number>();
      for (const a of monthlyApprovals) {
        const t = new Date(a.timestamp);
        const key = `${t.getFullYear()}-${t.getMonth()}`;
        const prev = outflowByMonth.get(key) || 0;
        outflowByMonth.set(key, prev + Number(a.reimbursement?.nominal || 0));
      }

      const inflowByMonth = new Map<string, number>();
      for (const tx of monthlyPemasukan as Array<{ nominal: any; tanggalTransaksi: Date | null }>) {
        if (!tx.tanggalTransaksi) continue;
        const t = new Date(tx.tanggalTransaksi);
        const key = `${t.getFullYear()}-${t.getMonth()}`;
        const prev = inflowByMonth.get(key) || 0;
        inflowByMonth.set(key, prev + Number(tx.nominal || 0));
      }

      const cashFlowMonths: { bulan: string; inflow: number; outflow: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
        const monthLabel = monthDate.toLocaleDateString('id-ID', { month: 'short' });

        const monthOutflow = outflowByMonth.get(monthKey) || 0;
        const monthInflowActual = inflowByMonth.get(monthKey) || 0;
        const monthInflow = monthInflowActual > 0 ? monthInflowActual : Math.round(monthOutflow * 1.2);

        cashFlowMonths.push({ bulan: monthLabel, inflow: Math.round(monthInflow), outflow: Math.round(monthOutflow) });
      }
      const monthApprovals = ytdApprovals.filter(a => new Date(a.timestamp) >= startOfMonth);
      const pendapatanBulanIni = monthApprovals.reduce((sum, a) => sum + Number(a.reimbursement.nominal), 0);

      const marginBersih = totalRABAllocated > 0
        ? ((remainingBudgets / totalRABAllocated) * 100)
        : 0;
      const totalDiajukan = await prisma.reimbursement.count();
      const totalDisetujuiPM = await prisma.reimbursement.count({ where: { status: { in: ['APPROVED_BY_PM', 'APPROVED'] } } });
      const totalDiprosesKeuangan = await prisma.reimbursement.count({ where: { status: { in: ['APPROVED_BY_PM', 'APPROVED'] } } });
      const totalDicairkan = await prisma.reimbursement.count({ where: { status: 'APPROVED' } });

      const reimbursementPipeline = {
        diajukan: { count: totalDiajukan, pct: 100 },
        disetujuiPM: {
          count: totalDisetujuiPM,
          pct: totalDiajukan > 0 ? Math.round((totalDisetujuiPM / totalDiajukan) * 100) : 0,
        },
        diprosesKeuangan: {
          count: totalDiprosesKeuangan,
          pct: totalDiajukan > 0 ? Math.round((totalDiprosesKeuangan / totalDiajukan) * 100) : 0,
        },
        dicairkan: {
          count: totalDicairkan,
          pct: totalDiajukan > 0 ? Math.round((totalDicairkan / totalDiajukan) * 100) : 0,
        },
      };

      const [menungguPersetujuanData, disetujuiData] = await Promise.all([
        prisma.reimbursement.aggregate({
          where: { status: { in: ['SUBMITTED', 'APPROVED_BY_PM'] } },
          _sum: { nominal: true },
          _count: true,
        }),
        prisma.reimbursement.aggregate({
          where: { status: 'APPROVED' },
          _sum: { nominal: true },
          _count: true,
        }),
      ]);

      const pengajuanSummary = {
        menunggu: {
          count: menungguPersetujuanData._count,
          nominal: Number(menungguPersetujuanData._sum.nominal || 0),
        },
        disetujui: {
          count: disetujuiData._count,
          nominal: Number(disetujuiData._sum.nominal || 0),
        },
      };
      const terminAll = await prisma.terminPembayaran.findMany({
        select: { id: true, nominal: true, status: true },
      }).catch(() => []);
      const terminBelumDicairkan = (terminAll as Array<{id: number; nominal: any; status: string}>)
        .filter(t => t.status === 'BELUM_DITERIMA');
      const terminDicairkan = (terminAll as Array<{id: number; nominal: any; status: string}>)
        .filter(t => t.status !== 'BELUM_DITERIMA');

      const terminSummary = {
        belumDicairkan: {
          count: terminBelumDicairkan.length,
          nominal: terminBelumDicairkan.reduce((s, t) => s + Number(t.nominal || 0), 0),
        },
        dicairkan: {
          count: terminDicairkan.length,
          nominal: terminDicairkan.reduce((s, t) => s + Number(t.nominal || 0), 0),
        },
      };

      const projectProfitability = displayProyek.map((p) => {
        const rab = Number(p.budget?.nilaiKontrak || 0);
        const expense = Number(p.budget?.totalPengeluaran || 0);
        const sisa = Number(p.budget?.sisaBudget || 0);
        const realisasi = expense;
        const margin = rab > 0 ? ((sisa / rab) * 100) : 0;
        const realisasiPct = rab > 0 ? Math.round((expense / rab) * 100) : 0;
        const klien = p.users.find(u => u.role === 'Project Manager')?.user?.nama || 'PT. Klien';

        return {
          id: p.id,
          nomorRegister: p.nomorRegister,
          kode: p.nomorRegister || `PRJ-${String(p.id).padStart(3, '0')}`,
          proyekNama: p.nama,
          klien,
          status: p.status,
          tanggalMulai: p.tanggalMulai,
          tanggalSelesai: p.tanggalSelesai,
          rabTotal: rab,
          realisasi,
          sisaBudget: sisa,
          realisasiPct,
          margin: parseFloat(margin.toFixed(1)),
        };
      });

      const avgMargin = projectProfitability.length > 0
        ? projectProfitability.reduce((sum, p) => sum + p.margin, 0) / projectProfitability.length
        : 0;

      dashboardData.metrics = {
        totalRABAllocated,
        totalRABActiveProyek: totalRABAktif,
        totalDisbursed,
        remainingBudgets,
        realisasiYTD,
        pendapatanBulanIni,
        marginBersih: parseFloat(marginBersih.toFixed(1)),
        avgMargin: parseFloat(avgMargin.toFixed(1)),
        projectCount: proyekList.length,
        activeProjectCount: activeProyek.length,
        totalPemasukan,
        totalPengeluaran,
        selisihBersih,
        pctPemasukan: totalRABAllocated > 0 ? Math.round((totalPemasukan / totalRABAllocated) * 100) : 0,
        pctPengeluaran: totalRABAllocated > 0 ? Math.round((totalPengeluaran / totalRABAllocated) * 100) : 0,
      };
      dashboardData.cashFlow = cashFlowMonths;
      dashboardData.reimbursementPipeline = reimbursementPipeline;
      dashboardData.projectList = projectProfitability;
      dashboardData.pengajuanSummary = pengajuanSummary;
      dashboardData.terminSummary = terminSummary;

    } else if (role === 'Superadmin' || role === 'superadmin') {
      
      const totalPengajuan = await prisma.reimbursement.count();

      const totalMenungguApproval = await prisma.reimbursement.count({
        where: { status: 'SUBMITTED' }
      });

      const totalSiapDicairkan = await prisma.reimbursement.count({
        where: { status: 'APPROVED_BY_PM' }
      });

      const totalProyekAktif = await prisma.proyek.count({
        where: { status: 'AKTIF' }
      });

      const totalCoA = await prisma.masterSub.count({ where: { tipe: 'pemasukan' } });

      const totalUserAktif = await prisma.user.count(); 

      const budgets = await prisma.budget.findMany();
      const totalNilaiProyek = budgets.reduce((sum, b) => sum + Number(b.nilaiKontrak), 0);

      dashboardData.metrics = {
        totalNilaiProyek,
        totalPengajuan,
        totalMenungguApproval,
        totalSiapDicairkan,
        totalProyekAktif,
        totalCoA,
        totalUserAktif
      };

    }

    setCache(cacheKey, { dashboard: dashboardData });

    return NextResponse.json({ dashboard: dashboardData });
  } catch (error: any) {
    console.error('Fetch dashboard error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}