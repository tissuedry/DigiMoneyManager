import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to convert objects to CSV string
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','), // header row
    ...data.map(row => 
      headers.map(fieldName => {
        let value = row[fieldName];
        if (value === null || value === undefined) value = '';
        value = String(value).replace(/"/g, '""'); // escape quotes
        if (value.includes(',') || value.includes('\n')) {
          value = `"${value}"`; // wrap in quotes if contains commas or newlines
        }
        return value;
      }).join(',')
    )
  ];
  return csvRows.join('\r\n');
}

export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');

    const allowedRoles = ['Tim Keuangan', 'Direktur / Manajemen', 'Superadmin', 'superadmin', 'Project Manager'];

    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json({ message: 'Forbidden: You do not have permission to export reports' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'buku-besar'; 
    const proyekId = searchParams.get('proyekId');
    const format = searchParams.get('export') || 'json'; 

    const projectFilter: any = {};

    if (proyekId) {
      projectFilter.id = parseInt(proyekId, 10);
    }

    const projects = await prisma.proyek.findMany({
      where: projectFilter,
      include: {
        budget: {
          include: {
            mainAnggaran: true,
          },
        },
      },
    });

    if (projects.length === 0) {
      return NextResponse.json({ message: 'No projects found' }, { status: 404 });
    }

    if (type === 'buku-besar') {
      const journalFilter: any = {};

      if (proyekId) {
        journalFilter.reimbursement = { proyekId: parseInt(proyekId, 10) };
      }

      const entries = await prisma.jurnalAkuntansi.findMany({
        where: journalFilter,
        include: {
          reimbursement: {
            include: {
              user: { select: { nama: true } },
              proyek: { select: { nama: true } },
              approvals: {
                where: {
                  status: 'APPROVED',
                  level: { in: ['KEUANGAN', 'SUPER_ADMIN'] },
                },
                orderBy: { timestamp: 'desc' },
                take: 1,
              },
              keteranganAnggaran: {
                select: {
                  keterangan: true,
                  subAnggaran: { select: { mainAnggaran: { select: { namaMain: true } } } },
                },
              },
            },
          },
        },
        orderBy: { id: 'desc' },
      });

      const reportData = entries.map((entry) => {
        const approval = entry.reimbursement?.approvals?.[0];
        const tanggal = approval?.timestamp
          ? new Date(approval.timestamp).toISOString().split('T')[0]
          : 'N/A';
        
        const tipePengajuan = entry.reimbursement?.tipe || 'Pengajuan';

        return {
          ID: entry.id,
          Tanggal: tanggal,
          TipePencairan: tipePengajuan,
          Keterangan: entry.keterangan || `Pencairan ${tipePengajuan} ${entry.reimbursement?.id || ''}`,
          Proyek: entry.reimbursement?.proyek?.nama || '-',
          Karyawan: entry.reimbursement?.user?.nama || '-',
          KategoriAnggaran: entry.reimbursement?.keteranganAnggaran?.subAnggaran?.mainAnggaran?.namaMain
            || entry.reimbursement?.keteranganAnggaran?.keterangan
            || 'N/A',
          'Akun Debit': entry.noAkunDebit,
          'Akun Kredit': entry.noAkunKredit,
          Nominal: Number(entry.nominal),
        };
      });

      if (format === 'csv') {
        const csv = convertToCSV(reportData);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="Buku_Besar.csv"',
          },
        });
      }

      return NextResponse.json({ report: reportData });

    } else if (type === 'neraca') {
        const reportData = projects.map((p) => {
        const rabTotal = p.budget ? Number(p.budget.rabTotal) : 0;
        const totalPengeluaran = p.budget ? Number(p.budget.totalPengeluaran) : 0;
        const sisaBudget = p.budget ? Number(p.budget.sisaBudget) : 0;

        // Assets = Cash / Bank remaining budget + Allocated Fixed Project Assets
        const cashAsset = sisaBudget;
        const projectAssets = totalPengeluaran;
        const totalAssets = cashAsset + projectAssets;

        // Liabilities & Equity
        const pendingAmount = p.budget ? 0 : 0; 
        
        // Equity = Initial RAB budget allocations
        const equity = rabTotal;
        const totalLiabilitiesAndEquity = equity; 

        return {
          Proyek: p.nama,
          'Kas / Sisa Budget (Asset)': cashAsset,
          'Biaya Terpakai (Asset/Cost)': projectAssets,
          'Total Aset': totalAssets,
          'Utang Reimbursement (Liabilitas)': pendingAmount,
          'Modal RAB (Ekuitas)': equity,
          'Total Liabilitas & Ekuitas': totalLiabilitiesAndEquity,
        };
      });

      if (format === 'csv') {
        const csv = convertToCSV(reportData);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="Neraca_Proyek.csv"',
          },
        });
      }

      return NextResponse.json({ report: reportData });

    } else if (type === 'laba-rugi') {
      const reportData: any[] = [];

      for (const p of projects) {
        const rabTotal = p.budget ? Number(p.budget.rabTotal) : 0;
        const totalPengeluaran = p.budget ? Number(p.budget.totalPengeluaran) : 0;

        // Break down expenses by PosAnggaran
        const expensesBreakdown: any = {};
        if (p.budget) {
          p.budget.mainAnggaran.forEach((main: any) => {
            expensesBreakdown[`Beban ${main.namaMain}`] = Number(main.nominalTerpakai);
          });
        }

        reportData.push({
          Proyek: p.nama,
          'Pendapatan / Alokasi RAB': rabTotal,
          ...expensesBreakdown,
          'Total Beban / Pengeluaran': totalPengeluaran,
          'Laba (Rugi) Bersih': rabTotal - totalPengeluaran,
        });
      }

      if (format === 'csv') {
        const csv = convertToCSV(reportData);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="Laba_Rugi_Proyek.csv"',
          },
        });
      }

      return NextResponse.json({ report: reportData });
    }

    return NextResponse.json({ message: 'Invalid report type' }, { status: 400 });
    
  } catch (error: any) {
    console.error('Fetch reports error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}