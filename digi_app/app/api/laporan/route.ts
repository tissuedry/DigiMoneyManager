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
        journalFilter.OR = [
          { reimbursement: { proyekId: parseInt(proyekId, 10) } },
          { transaksiPemasukan: { proyekId: parseInt(proyekId, 10) } },
        ];
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
          transaksiPemasukan: {
            include: {
              user: { select: { nama: true } },
              proyek: { select: { nama: true } },
              subCoa: { select: { nama: true, master_main: { select: { nama: true } } } },
            },
          },
        },
        orderBy: { id: 'desc' },
      });

      const reportData = entries.map((entry) => {
        if (entry.transaksiPemasukan) {
          const tx = entry.transaksiPemasukan;
          const tanggal = tx.tanggalTransaksi
            ? new Date(tx.tanggalTransaksi).toISOString().split('T')[0]
            : 'N/A';

          let kategoriLabel = tx.kategori;
          if (tx.kategori === 'DISKON_PENJUALAN') kategoriLabel = 'Diskon Penjualan';
          else if (tx.kategori === 'RETUR_PENJUALAN') kategoriLabel = 'Retur Penjualan';
          else if (tx.kategori === 'BIAYA_PENJUALAN_LAINNYA') kategoriLabel = 'Biaya Penjualan';
          else if (tx.kategori === 'PENERIMAAN_PENJUALAN') kategoriLabel = 'Penerimaan Penjualan';

          return {
            ID: entry.id,
            Tanggal: tanggal,
            TipePencairan: kategoriLabel,
            Keterangan: entry.keterangan || tx.keterangan || `Transaksi ${kategoriLabel} ${tx.id}`,
            Proyek: tx.proyek?.nama || '-',
            Karyawan: tx.user?.nama || '-',
            KategoriAnggaran: tx.subCoa?.nama || kategoriLabel,
            'Akun Debit': entry.noAkunDebit,
            'Akun Kredit': entry.noAkunKredit,
            Nominal: Number(entry.nominal),
          };
        }

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
      const reportData = await Promise.all(projects.map(async (p) => {
        const rabTotal = p.budget ? Number(p.budget.nilaiKontrak || 0) : 0;
        const totalPengeluaran = p.budget ? Number(p.budget.totalPengeluaran || 0) : 0;
        const sisaBudget = p.budget ? Number(p.budget.sisaBudget || 0) : 0;

        const txPemasukan = await prisma.transaksiPemasukan.findMany({
          where: { proyekId: p.id },
        });

        const totalPemasukanCair = txPemasukan
          .filter((t) => t.status === 'CAIR' || t.kategori === 'PENERIMAAN_PENJUALAN')
          .reduce((sum, t) => sum + Number(t.nominal || 0), 0);

        const cashAsset = sisaBudget + totalPemasukanCair;
        const projectAssets = totalPengeluaran;
        const totalAssets = cashAsset + projectAssets;

        const equity = rabTotal;
        const totalLiabilitiesAndEquity = equity;

        return {
          Proyek: p.nama,
          'Kas / Sisa Budget (Asset)': cashAsset,
          'Biaya Terpakai (Asset/Cost)': projectAssets,
          'Total Aset': totalAssets,
          'Utang Reimbursement (Liabilitas)': 0,
          'Modal RAB (Ekuitas)': equity,
          'Total Liabilitas & Ekuitas': totalLiabilitiesAndEquity,
        };
      }));

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
        const grossRevenue = p.budget ? Number(p.budget.nilaiKontrak || 0) : 0;
        const totalPengeluaran = p.budget ? Number(p.budget.totalPengeluaran || 0) : 0;

        const txPemasukan = await prisma.transaksiPemasukan.findMany({
          where: { proyekId: p.id },
        });

        let totalDiskon = 0;
        let totalRetur = 0;
        let totalBiayaLainnya = 0;

        txPemasukan.forEach((tx) => {
          const nom = Number(tx.nominal || 0);
          if (tx.kategori === 'DISKON_PENJUALAN') totalDiskon += nom;
          else if (tx.kategori === 'RETUR_PENJUALAN') totalRetur += nom;
          else if (tx.kategori === 'BIAYA_PENJUALAN_LAINNYA') totalBiayaLainnya += nom;
        });

        const netRevenue = grossRevenue - totalDiskon - totalRetur - totalBiayaLainnya;
        const labaBersih = netRevenue - totalPengeluaran;

        // Break down expenses by PosAnggaran
        const expensesBreakdown: any = {};
        if (p.budget) {
          p.budget.mainAnggaran
            .filter((m: any) => m.tipe !== 'pemasukan')
            .forEach((main: any) => {
              expensesBreakdown[`Beban ${main.namaMain}`] = Number(main.nominalTerpakai);
            });
        }

        reportData.push({
          Proyek: p.nama,
          'Penjualan Kotor (Kontrak)': grossRevenue,
          'Diskon Penjualan': totalDiskon,
          'Retur Penjualan': totalRetur,
          'Biaya Penjualan Lainnya': totalBiayaLainnya,
          'Penjualan Bersih (Net Revenue)': netRevenue,
          ...expensesBreakdown,
          'Total Beban / Pengeluaran': totalPengeluaran,
          'Laba (Rugi) Bersih': labaBersih,
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