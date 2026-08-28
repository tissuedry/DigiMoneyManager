import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearCache } from '@/lib/route-cache';

export const dynamic = 'force-dynamic';

function isFinanceOrAdmin(role: string | null, rolesHeader: string | null) {
  const roles = (rolesHeader || role || '').split(',').map((r) => r.trim());
  return (
    roles.includes('Tim Keuangan') ||
    roles.includes('Superadmin') ||
    roles.includes('superadmin') ||
    roles.includes('Direktur / Manajemen')
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const proyekId = searchParams.get('proyekId');
    const kategori = searchParams.get('kategori');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    if (proyekId) {
      where.proyekId = parseInt(proyekId, 10);
    }

    if (kategori && kategori !== 'SEMUA') {
      where.kategori = kategori;
    }

    if (status && status !== 'SEMUA') {
      where.status = status;
    }

    if (startDate || endDate) {
      where.tanggalTransaksi = {};
      if (startDate) where.tanggalTransaksi.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.tanggalTransaksi.lte = end;
      }
    }

    const transaksiList = await prisma.transaksiPemasukan.findMany({
      where,
      include: {
        proyek: {
          select: {
            id: true,
            nama: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            nama: true,
            email: true,
          },
        },
        subCoa: {
          include: {
            master_main: true,
          },
        },
        jurnalAkuntansi: true,
      },
      orderBy: { tanggalTransaksi: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: transaksiList,
    });
  } catch (error: any) {
    console.error('Fetch transaksi pemasukan error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');
    const rolesHeader = req.headers.get('x-user-roles');
    const userId = req.headers.get('x-user-id');

    if (!isFinanceOrAdmin(role, rolesHeader)) {
      return NextResponse.json(
        { message: 'Forbidden: Hanya Tim Keuangan, Direktur, atau Super Admin yang dapat mencatat realisasi pemasukan' },
        { status: 403 }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    let proyekId = '';
    let subCoaId: string | null = null;
    let kategori = '';
    let nominal = 0;
    let namaRealisasi = '';
    let tanggalTransaksi: string | null = null;
    let keterangan = '';
    let buktiUrl = '';
    let status = 'CAIR';
    let noAkunDebit = '';
    let noAkunKredit = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      proyekId = formData.get('proyekId') as string;
      subCoaId = (formData.get('subCoaId') || formData.get('kategoriAnggaranId')) as string | null;
      kategori = (formData.get('kategori') || formData.get('namaSub') || formData.get('nama') || 'Pemasukan') as string;
      nominal = parseFloat((formData.get('nominal') as string) || '0');
      namaRealisasi = (formData.get('namaRealisasi') || formData.get('nama')) as string || '';
      tanggalTransaksi = (formData.get('tanggalTransaksi') || formData.get('tanggal')) as string | null;
      keterangan = (formData.get('keterangan') || formData.get('catatan') || formData.get('deskripsi')) as string || '';
      status = (formData.get('status') as string) || 'CAIR';
      noAkunDebit = (formData.get('noAkunDebit') as string) || '';
      noAkunKredit = (formData.get('noAkunKredit') as string) || '';

      const file = formData.get('file') as File | null;
      if (file && file.size > 0) {
        const { uploadStrukToSupabase } = await import('@/lib/supabase-storage');
        const buffer = Buffer.from(await file.arrayBuffer());
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        buktiUrl = await uploadStrukToSupabase(buffer, undefined, isPdf);
      }
    } else {
      const body = await req.json();
      proyekId = String(body.proyekId || '');
      subCoaId = body.subCoaId ? String(body.subCoaId) : null;
      kategori = body.kategori || body.namaSub || body.nama || 'Pemasukan';
      nominal = typeof body.nominal === 'number' ? body.nominal : parseFloat(String(body.nominal || '0').replace(/[^0-9.-]+/g, '')) || 0;
      namaRealisasi = body.namaRealisasi || body.nama || '';
      tanggalTransaksi = body.tanggalTransaksi || body.tanggal || null;
      keterangan = body.keterangan || body.catatan || body.deskripsi || '';
      buktiUrl = body.buktiUrl || '';
      status = body.status || 'CAIR';
      noAkunDebit = body.noAkunDebit || '';
      noAkunKredit = body.noAkunKredit || '';
    }

    if (!proyekId || isNaN(nominal) || nominal <= 0) {
      return NextResponse.json(
        { message: 'proyekId dan nominal yang valid (> 0) wajib diisi' },
        { status: 400 }
      );
    }

    const parsedNominal = nominal;
    const parsedProyekId = parseInt(proyekId, 10);

    const proyek = await prisma.proyek.findUnique({
      where: { id: parsedProyekId },
      include: {
        budget: {
          include: {
            mainAnggaran: {
              include: { subAnggaran: true },
            },
          },
        },
      },
    });

    if (!proyek) {
      return NextResponse.json({ message: 'Proyek tidak ditemukan' }, { status: 404 });
    }

    let validMasterSubId: number | null = null;
    if (subCoaId) {
      const parsedSubId = parseInt(subCoaId, 10);
      if (!isNaN(parsedSubId)) {
        const directMasterSub = await prisma.masterSub.findUnique({
          where: { id: parsedSubId },
        });
        if (directMasterSub) {
          validMasterSubId = directMasterSub.id;
        }
      }
    }
    if (!validMasterSubId && kategori) {
      const matchedMasterSub = await prisma.masterSub.findFirst({
        where: { nama: { equals: kategori, mode: 'insensitive' } },
      });
      if (matchedMasterSub) {
        validMasterSubId = matchedMasterSub.id;
      }
    }

    if (!noAkunDebit) {
      noAkunDebit = kategori.toLowerCase().includes('diskon')
        ? '4.1 - Diskon Penjualan'
        : kategori.toLowerCase().includes('retur')
        ? '4.2 - Retur Penjualan'
        : '1.1 - Kas & Bank';
    }
    if (!noAkunKredit) {
      noAkunKredit = kategori.toLowerCase().includes('diskon') || kategori.toLowerCase().includes('retur')
        ? '1.2 - Piutang Usaha'
        : '4.0 - Pendapatan Penjualan';
    }

    const finalKeterangan = namaRealisasi
      ? `${namaRealisasi}${keterangan ? ` - ${keterangan}` : ''}`
      : keterangan || `Realisasi ${kategori} - ${proyek.nama}`;

    const result = await prisma.$transaction(async (tx) => {
      const newTransaksi = await tx.transaksiPemasukan.create({
        data: {
          proyekId: parsedProyekId,
          userId: userId ? parseInt(userId, 10) : null,
          subCoaId: validMasterSubId,
          kategori: kategori,
          nominal: parsedNominal,
          tanggalTransaksi: tanggalTransaksi ? new Date(tanggalTransaksi) : new Date(),
          keterangan: finalKeterangan,
          buktiUrl: buktiUrl || null,
          status: status,
        },
        include: {
          proyek: true,
          subCoa: { include: { master_main: true } },
        },
      });

      const journal = await tx.jurnalAkuntansi.create({
        data: {
          transaksiPemasukanId: newTransaksi.id,
          noAkunDebit,
          noAkunKredit,
          nominal: parsedNominal,
          keterangan: `Pencatatan ${kategori}: ${finalKeterangan}`,
        },
      });

      if (proyek.budget) {
        const currentTotalPemasukan = Number(proyek.budget.totalPemasukan || 0);
        await tx.budget.update({
          where: { id: proyek.budget.id },
          data: {
            totalPemasukan: currentTotalPemasukan + parsedNominal,
          },
        });

        for (const main of proyek.budget.mainAnggaran) {
          let updatedMain = false;
          for (const sub of main.subAnggaran) {
            const isMatch =
              (subCoaId && sub.id === parseInt(subCoaId, 10)) ||
              sub.namaSub.toLowerCase() === kategori.toLowerCase();
            if (isMatch) {
              await tx.subAnggaran.update({
                where: { id: sub.id },
                data: {
                  nominalTerpakai: Number(sub.nominalTerpakai || 0) + parsedNominal,
                },
              });
              updatedMain = true;
            }
          }
          if (updatedMain) {
            await tx.mainAnggaran.update({
              where: { id: main.id },
              data: {
                nominalTerpakai: Number(main.nominalTerpakai || 0) + parsedNominal,
              },
            });
          }
        }
      }

      if (userId) {
        let actor = 'Tim Keuangan';
        if (role === 'Superadmin' || role === 'superadmin') actor = 'Superadmin';
        else if (role === 'Direktur / Manajemen') actor = 'Direktur';

        await tx.auditTrail.create({
          data: {
            userId: parseInt(userId, 10),
            aksi: 'realisasi_pemasukan',
            detail: `${actor} merealisasikan pemasukan ${kategori} "${namaRealisasi || finalKeterangan}" sebesar Rp ${parsedNominal.toLocaleString('id-ID')} pada proyek: ${proyek.nama}`,
          },
        });
      }

      return { transaksi: newTransaksi, journal };
    });

    clearCache('dashboard:');
    clearCache('proyek:');
    clearCache('coa');

    return NextResponse.json(
      {
        message: 'Transaksi pemasukan berhasil dicatat',
        data: result.transaksi,
        journal: result.journal,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create transaksi pemasukan error:', error);
    return NextResponse.json(
      { message: error?.message || 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
