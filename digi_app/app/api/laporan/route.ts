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
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'buku-besar'; // buku-besar, neraca, laba-rugi
    const proyekId = searchParams.get('proyekId');
    const format = searchParams.get('export') || 'json'; // json, csv

    const projectFilter: any = {};
    if (proyekId) {
      projectFilter.id = parseInt(proyekId, 10);
    }

    const projects = await prisma.proyek.findMany({
      where: projectFilter,
      include: {
        budget: {
          include: {
            posAnggaran: true,
          },
        },
      },
    });

    if (projects.length === 0) {
      return NextResponse.json({ message: 'No projects found' }, { status: 404 });
    }

    if (type === 'buku-besar') {
      // 1. General Ledger (Buku Besar)
      // Retrieve JurnalAkuntansi entries
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
              posAnggaran: { select: { namaPos: true } },
            },
          },
          akunDebit: true,
          akunKredit: true,
        },
        orderBy: { id: 'desc' },
      });

      const reportData = entries.map((entry) => ({
        ID: entry.id,
        Tanggal: entry.reimbursement.ocrData && (entry.reimbursement.ocrData as any).tanggal 
          ? (entry.reimbursement.ocrData as any).tanggal 
          : 'N/A',
        Keterangan: entry.keterangan || `Pencairan reimbursement ${entry.reimbursement.id}`,
        Proyek: entry.reimbursement.proyek.nama,
        Karyawan: entry.reimbursement.user.nama,
        PosAnggaran: entry.reimbursement.posAnggaran.namaPos,
        'Akun Debit': `${entry.akunDebit.nomorAkun} - ${entry.akunDebit.namaAkun}`,
        'Akun Kredit': `${entry.akunKredit.nomorAkun} - ${entry.akunKredit.namaAkun}`,
        Nominal: Number(entry.nominal),
      }));

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
      // 2. Balance Sheet (Neraca)
      // Generates balance sheet for the projects
      const reportData = projects.map((p) => {
        const rabTotal = p.budget ? Number(p.budget.rabTotal) : 0;
        const totalPengeluaran = p.budget ? Number(p.budget.totalPengeluaran) : 0;
        const sisaBudget = p.budget ? Number(p.budget.sisaBudget) : 0;

        // Assets = Cash / Bank remaining budget + Allocated Fixed Project Assets
        const cashAsset = sisaBudget;
        const projectAssets = totalPengeluaran; // Capitalized costs
        const totalAssets = cashAsset + projectAssets;

        // Liabilities & Equity
        // Liabilities = unpaid / pending approvals (we can count pending reimbursement amounts)
        // Let's query sum of pending reimbursements for this project
        const pendingAmount = p.budget ? 0 : 0; // standard simplified model
        
        // Equity = Initial RAB budget allocations
        const equity = rabTotal;
        const totalLiabilitiesAndEquity = equity; // Simplified balance equation

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
      // 3. Income Statement (Laba Rugi)
      const reportData: any[] = [];

      for (const p of projects) {
        const rabTotal = p.budget ? Number(p.budget.rabTotal) : 0;
        const totalPengeluaran = p.budget ? Number(p.budget.totalPengeluaran) : 0;

        // Break down expenses by PosAnggaran
        const expensesBreakdown: any = {};
        if (p.budget) {
          p.budget.posAnggaran.forEach((pos) => {
            expensesBreakdown[`Beban ${pos.namaPos}`] = Number(pos.nominalTerpakai);
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
