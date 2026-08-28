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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const transaksi = await prisma.transaksiPemasukan.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        proyek: true,
        user: { select: { id: true, nama: true, email: true } },
        subCoa: { include: { master_main: true } },
        jurnalAkuntansi: true,
      },
    });

    if (!transaksi) {
      return NextResponse.json({ message: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: transaksi });
  } catch (error: any) {
    console.error('Fetch detail transaksi pemasukan error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    const rolesHeader = req.headers.get('x-user-roles');
    const userId = req.headers.get('x-user-id');
    const { id } = await params;
    const transaksiId = parseInt(id, 10);

    if (!isFinanceOrAdmin(role, rolesHeader)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.transaksiPemasukan.findUnique({
      where: { id: transaksiId },
      include: { proyek: true },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    const body = await req.json();
    const {
      subCoaId,
      kategori,
      nominal,
      tanggalTransaksi,
      keterangan,
      buktiUrl,
      status,
      noAkunDebit,
      noAkunKredit,
    } = body;

    const parsedNominal = nominal !== undefined
      ? (typeof nominal === 'number' ? nominal : parseFloat(String(nominal).replace(/[^0-9.-]+/g, '')) || 0)
      : Number(existing.nominal);

    let validMasterSubId: number | null = existing.subCoaId;
    if (subCoaId !== undefined) {
      if (subCoaId) {
        const parsed = parseInt(String(subCoaId), 10);
        if (!isNaN(parsed)) {
          const direct = await prisma.masterSub.findUnique({ where: { id: parsed } });
          validMasterSubId = direct ? direct.id : null;
        } else {
          validMasterSubId = null;
        }
      } else {
        validMasterSubId = null;
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.transaksiPemasukan.update({
        where: { id: transaksiId },
        data: {
          subCoaId: validMasterSubId,
          kategori: kategori || existing.kategori,
          nominal: parsedNominal,
          tanggalTransaksi: tanggalTransaksi ? new Date(tanggalTransaksi) : existing.tanggalTransaksi,
          keterangan: keterangan !== undefined ? keterangan : existing.keterangan,
          buktiUrl: buktiUrl !== undefined ? buktiUrl : existing.buktiUrl,
          status: status || existing.status,
        },
        include: {
          proyek: true,
          subCoa: { include: { master_main: true } },
          jurnalAkuntansi: true,
        },
      });

      if (noAkunDebit && noAkunKredit) {
        const existingJournal = await tx.jurnalAkuntansi.findFirst({
          where: { transaksiPemasukanId: transaksiId },
        });

        if (existingJournal) {
          await tx.jurnalAkuntansi.update({
            where: { id: existingJournal.id },
            data: {
              noAkunDebit: String(noAkunDebit),
              noAkunKredit: String(noAkunKredit),
              nominal: parsedNominal,
              keterangan: keterangan || `Transaksi ${updated.kategori} - Proyek: ${existing.proyek.nama}`,
            },
          });
        } else {
          await tx.jurnalAkuntansi.create({
            data: {
              transaksiPemasukanId: transaksiId,
              noAkunDebit: String(noAkunDebit),
              noAkunKredit: String(noAkunKredit),
              nominal: parsedNominal,
              keterangan: keterangan || `Transaksi ${updated.kategori} - Proyek: ${existing.proyek.nama}`,
            },
          });
        }
      }

      if (userId) {
        await tx.auditTrail.create({
          data: {
            userId: parseInt(userId, 10),
            aksi: 'update_transaksi_pemasukan',
            detail: `Memperbarui transaksi ${updated.kategori} (ID: ${transaksiId}) menjadi Rp ${parsedNominal.toLocaleString('id-ID')} pada proyek: ${existing.proyek.nama}`,
          },
        });
      }

      return updated;
    });

    clearCache('dashboard:');
    clearCache('proyek:');

    return NextResponse.json({
      message: 'Transaksi pemasukan berhasil diperbarui',
      data: result,
    });
  } catch (error: any) {
    console.error('Update transaksi pemasukan error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    const rolesHeader = req.headers.get('x-user-roles');
    const userId = req.headers.get('x-user-id');
    const { id } = await params;
    const transaksiId = parseInt(id, 10);

    if (!isFinanceOrAdmin(role, rolesHeader)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.transaksiPemasukan.findUnique({
      where: { id: transaksiId },
      include: { proyek: true },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.jurnalAkuntansi.deleteMany({
        where: { transaksiPemasukanId: transaksiId },
      });

      await tx.transaksiPemasukan.delete({
        where: { id: transaksiId },
      });

      if (userId) {
        await tx.auditTrail.create({
          data: {
            userId: parseInt(userId, 10),
            aksi: 'delete_transaksi_pemasukan',
            detail: `Menghapus transaksi ${existing.kategori} (ID: ${transaksiId}) sebesar Rp ${Number(existing.nominal).toLocaleString('id-ID')} dari proyek: ${existing.proyek.nama}`,
          },
        });
      }
    });

    clearCache('dashboard:');
    clearCache('proyek:');

    return NextResponse.json({ message: 'Transaksi pemasukan berhasil dihapus' });
  } catch (error: any) {
    console.error('Delete transaksi pemasukan error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
