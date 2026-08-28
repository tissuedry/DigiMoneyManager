import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(fieldName => {
        let value = row[fieldName];
        if (value === null || value === undefined) value = '';
        value = String(value).replace(/"/g, '""');
        if (value.includes(',') || value.includes('\n')) {
          value = `"${value}"`;
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

      return NextResponse.json({ report: reportData });

    } 

    return NextResponse.json({ message: 'Invalid report type' }, { status: 400 });
    
  } catch (error: any) {
    console.error('Fetch reports error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}