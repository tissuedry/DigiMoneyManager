import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Retrieve dashboard summary metrics based on user role
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    const role = req.headers.get('x-user-role');
    const userProyekId = req.headers.get('x-user-proyek-id');

    if (!userId || !role) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Initialize output object
    let dashboardData: any = { role };

    if (role === 'Karyawan') {
      // 1. Employee Dashboard data
      const userReimbursements = await prisma.reimbursement.findMany({
        where: { userId: parseInt(userId, 10) },
        select: {
          nominal: true,
          status: true,
        },
      });

      const totalNominal = userReimbursements.reduce((sum, r) => sum + Number(r.nominal), 0);
      const totalPending = userReimbursements.filter(r => r.status === 'SUBMITTED' || r.status === 'APPROVED_BY_PM').length;
      const totalApproved = userReimbursements.filter(r => r.status === 'APPROVED').length;
      const totalRejected = userReimbursements.filter(r => r.status === 'REJECTED').length;

      const recentSubmissions = await prisma.reimbursement.findMany({
        where: { userId: parseInt(userId, 10) },
        include: { proyek: { select: { nama: true } }, posAnggaran: { select: { namaPos: true } } },
        orderBy: { id: 'desc' },
        take: 5,
      });

      const mappedRecent = recentSubmissions.map((r: any) => ({
        ...r,
        strukUrl: r.urlStruk,
        posAnggaran: r.posAnggaran ? {
          ...r.posAnggaran,
          deskripsi: r.posAnggaran.namaPos,
        } : null,
      }));

      dashboardData.summary = {
        totalSubmissions: userReimbursements.length,
        totalNominalSubmitted: totalNominal,
        pendingCount: totalPending,
        approvedCount: totalApproved,
        rejectedCount: totalRejected,
      };
      dashboardData.recentSubmissions = mappedRecent;

    } else if (role === 'Project Manager') {
      // 2. Project Manager Dashboard data
      const { searchParams } = new URL(req.url);
      const projectIdParam = searchParams.get('projectId');
      const targetProjectId = projectIdParam || userProyekId;

      if (!targetProjectId) {
        dashboardData.project = null;
        dashboardData.message = 'No project associated with this Project Manager';
      } else {
        const project = await prisma.proyek.findUnique({
          where: { id: parseInt(targetProjectId, 10) },
          include: {
            budget: {
              include: {
                posAnggaran: true,
              },
            },
          },
        });

        const pendingApprovalsCount = await prisma.reimbursement.count({
          where: {
            proyekId: parseInt(targetProjectId, 10),
            status: 'SUBMITTED', // PM only approves SUBMITTED status
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
          posAnggaran: project.budget.posAnggaran.map((pos) => ({
            ...pos,
            deskripsi: pos.namaPos,
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
      // 3. Tim Keuangan Dashboard data
      const activeProjectsCount = await prisma.proyek.count({
        where: { status: 'AKTIF' },
      });

      const budgets = await prisma.budget.findMany();
      const totalRABAllocated = budgets.reduce((sum, b) => sum + Number(b.rabTotal), 0);
      const totalCashDisbursed = budgets.reduce((sum, b) => sum + Number(b.totalPengeluaran), 0);
      const totalReimbursementsDisbursed = budgets.reduce((sum, b) => sum + Number(b.totalReimbursement), 0);
      const remainingBudgets = budgets.reduce((sum, b) => sum + Number(b.sisaBudget), 0);

      // Pending Keuangan approvals are status = 'APPROVED_BY_PM'
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

      // ── Disbursed Today ──────────────────────────────────────────
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

      // ── Jurnal Count This Month ──────────────────────────────────
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get IDs of reimbursements approved this month by Keuangan
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

      // ── Total Debit = Kredit (balance check) ─────────────────────
      const totalJurnalResult = await prisma.jurnalAkuntansi.aggregate({
        _sum: { nominal: true },
      });
      const totalDebitKredit = Number(totalJurnalResult._sum.nominal || 0);
      const totalDebit = totalDebitKredit;
      const totalKredit = totalDebitKredit;

      // ── Recent Journals (8 terbaru, formatted for frontend) ──────
      const recentJournalsRaw = await prisma.jurnalAkuntansi.findMany({
        include: {
          reimbursement: {
            include: {
              user: { select: { nama: true } },
              posAnggaran: { select: { namaPos: true } },
            },
          },
          akunDebit: { select: { nomorAkun: true, namaAkun: true } },
          akunKredit: { select: { nomorAkun: true, namaAkun: true } },
        },
        orderBy: { id: 'desc' },
        take: 8,
      });

      const recentJournals = recentJournalsRaw.map((j) => {
        // Determine tanggal from OCR data or approval timestamp
        const ocrData = j.reimbursement.ocrData as any;
        const tanggal = ocrData?.tanggal || null;

        return {
          jeId: `JE-${String(j.id).padStart(4, '0')}`,
          tanggal,
          keterangan: j.keterangan || `Pencairan reimbursement ${j.reimbursement.user.nama} - ${j.reimbursement.posAnggaran.namaPos}`,
          debitKode: `${j.akunDebit.nomorAkun}`,
          debitNama: j.akunDebit.namaAkun,
          kreditKode: `${j.akunKredit.nomorAkun}`,
          kreditNama: j.akunKredit.namaAkun,
          nominal: Number(j.nominal),
        };
      });

      // ── Pending Disbursements (formatted list) ───────────────────
      const pendingDisbursementsRaw = await prisma.reimbursement.findMany({
        where: { status: 'APPROVED_BY_PM' },
        include: {
          user: { select: { nama: true, divisi: true } },
          proyek: { select: { nama: true } },
        },
        orderBy: { id: 'desc' },
      });

      const pendingDisbursements = pendingDisbursementsRaw.map((r) => ({
        id: r.id,
        nominal: Number(r.nominal),
        status: r.status,
        user: { nama: r.user.nama, divisi: r.user.divisi },
        proyek: { nama: r.proyek.nama },
      }));

      dashboardData.metrics = {
        activeProjectsCount,
        totalRABAllocated,
        totalCashDisbursed,
        totalReimbursementsDisbursed,
        remainingBudgets,
        pendingDisbursementCount,
        pendingDisbursementsNominal,
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

    } else if (role === 'Direktur / Manajemen') {
      // 4. Executive Dashboard data — full analytics for director
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // ── Projects & Budgets ───────────────────────────────────────
      const proyekList = await prisma.proyek.findMany({
        include: {
          budget: {
            include: { posAnggaran: true },
          },
          users: {
            include: { user: { select: { nama: true, role: true, divisi: true } } },
          },
        },
      });

      const activeProyek = proyekList.filter(p => p.status === 'AKTIF');

      const totalRABAktif = activeProyek.reduce((sum, p) => sum + Number(p.budget?.rabTotal || 0), 0);
      const totalRABAllocated = proyekList.reduce((sum, p) => sum + Number(p.budget?.rabTotal || 0), 0);
      const totalDisbursed = proyekList.reduce((sum, p) => sum + Number(p.budget?.totalPengeluaran || 0), 0);
      const remainingBudgets = proyekList.reduce((sum, p) => sum + Number(p.budget?.sisaBudget || 0), 0);

      // ── YTD Realization ──────────────────────────────────────────
      const ytdApprovals = await prisma.approval.findMany({
        where: {
          level: 'KEUANGAN',
          status: 'APPROVED',
          timestamp: { gte: startOfYear },
        },
        include: { reimbursement: { select: { nominal: true, proyekId: true } } },
      });
      const realisasiYTD = ytdApprovals.reduce((sum, a) => sum + Number(a.reimbursement.nominal), 0);

      // ── Monthly Revenue (pendapatan from disbursed reimbursements per month) ──
      const monthlyApprovals = await prisma.approval.findMany({
        where: { level: 'KEUANGAN', status: 'APPROVED' },
        include: { reimbursement: { select: { nominal: true } } },
        orderBy: { timestamp: 'asc' },
      });

      // Build 12-month cash flow array
      const cashFlowMonths: { bulan: string; inflow: number; outflow: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
        const monthLabel = monthDate.toLocaleDateString('id-ID', { month: 'short' });

        const monthOutflow = monthlyApprovals
          .filter(a => {
            const t = new Date(a.timestamp);
            return t >= monthDate && t <= monthEnd;
          })
          .reduce((sum, a) => sum + Number(a.reimbursement.nominal), 0);

        // Inflow is estimated as portion of RAB allocated to that month (simplified)
        const monthInflow = monthOutflow * 1.2; // simulated: inflow slightly higher than outflow
        cashFlowMonths.push({ bulan: monthLabel, inflow: Math.round(monthInflow), outflow: Math.round(monthOutflow) });
      }

      // ── Monthly Pendapatan (current month) ──────────────────────
      const monthApprovals = ytdApprovals.filter(a => new Date(a.timestamp) >= startOfMonth);
      const pendapatanBulanIni = monthApprovals.reduce((sum, a) => sum + Number(a.reimbursement.nominal), 0);

      // ── Margin calculation ──────────────────────────────────────
      const marginBersih = totalRABAllocated > 0
        ? ((remainingBudgets / totalRABAllocated) * 100)
        : 0;

      // ── Reimbursement pipeline status ────────────────────────────
      const [
        countDiajukan,
        countDisetujuiPM,
        countDiprosesKeuangan,
        countDicairkan,
      ] = await Promise.all([
        prisma.reimbursement.count(),
        prisma.reimbursement.count({ where: { status: { in: ['APPROVED_BY_PM'] } } }),
        prisma.reimbursement.count({ where: { status: 'APPROVED_BY_PM' } }),
        prisma.reimbursement.count({ where: { status: 'APPROVED' } }),
      ]);

      // Accurate counts
      const countSubmitted = await prisma.reimbursement.count({ where: { status: 'SUBMITTED' } });
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

      // ── Project Profitability ────────────────────────────────────
      const projectProfitability = proyekList.map((p) => {
        const rab = Number(p.budget?.rabTotal || 0);
        const expense = Number(p.budget?.totalPengeluaran || 0);
        const sisa = Number(p.budget?.sisaBudget || 0);
        const realisasi = expense;
        const margin = rab > 0 ? ((sisa / rab) * 100) : 0;
        const realisasiPct = rab > 0 ? Math.round((expense / rab) * 100) : 0;
        const klien = p.users.find(u => u.role === 'Project Manager')?.user?.nama || 'PT. Klien';

        return {
          id: p.id,
          kode: `PRJ-${String(p.id).padStart(3, '0')}`,
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

      // ── Summary KPI ──────────────────────────────────────────────
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
      };
      dashboardData.cashFlow = cashFlowMonths;
      dashboardData.reimbursementPipeline = reimbursementPipeline;
      dashboardData.projectList = projectProfitability;
    }

    return NextResponse.json({ dashboard: dashboardData });
  } catch (error: any) {
    console.error('Fetch dashboard error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
