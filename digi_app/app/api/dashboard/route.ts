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
      if (!userProyekId) {
        dashboardData.project = null;
        dashboardData.message = 'No project associated with this Project Manager';
      } else {
        const project = await prisma.proyek.findUnique({
          where: { id: parseInt(userProyekId, 10) },
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
            proyekId: parseInt(userProyekId, 10),
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
      // 4. Executive Dashboard data
      const budgets = await prisma.budget.findMany({
        include: {
          proyek: {
            select: { nama: true, status: true },
          },
        },
      });

      const totalRABAllocated = budgets.reduce((sum, b) => sum + Number(b.rabTotal), 0);
      const totalDisbursed = budgets.reduce((sum, b) => sum + Number(b.totalPengeluaran), 0);
      const remainingBudgets = budgets.reduce((sum, b) => sum + Number(b.sisaBudget), 0);

      // Profitability: we can map remaining budgets or budget utilization percentage
      const projectProfitability = budgets.map((b) => {
        const rab = Number(b.rabTotal);
        const expense = Number(b.totalPengeluaran);
        const utilization = rab > 0 ? (expense / rab) * 100 : 0;
        const sisa = Number(b.sisaBudget);
        return {
          id: b.id,
          proyekNama: b.proyek.nama,
          status: b.proyek.status,
          rabTotal: rab,
          totalPengeluaran: expense,
          sisaBudget: sisa,
          utilizationPercentage: utilization.toFixed(2),
        };
      });

      dashboardData.metrics = {
        totalRABAllocated,
        totalDisbursed,
        remainingBudgets,
        projectCount: budgets.length,
      };
      dashboardData.projectList = projectProfitability;
    }

    return NextResponse.json({ dashboard: dashboardData });
  } catch (error: any) {
    console.error('Fetch dashboard error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
