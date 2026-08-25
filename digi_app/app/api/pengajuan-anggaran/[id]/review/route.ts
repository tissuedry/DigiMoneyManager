import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearCache } from '@/lib/route-cache';

type ApproveCheck = { alokasiBaru: number; sumLain: number; nilaiKontrak: number; sumSub: number };

export function computeApproveError({ alokasiBaru, sumLain, nilaiKontrak, sumSub }: ApproveCheck): string | null {
  if (alokasiBaru < sumSub) return 'Alokasi baru kurang dari total alokasi sub';
  if (sumLain + alokasiBaru > nilaiKontrak) return 'Batas Nilai Proyek terlampaui';
  return null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    if (role !== 'Direktur / Manajemen' && role !== 'Superadmin' && role !== 'superadmin') {
      return NextResponse.json({ message: 'Forbidden: Only Direktur or Super Admin can review proposals' }, { status: 403 });
    }
    const reviewerName = role === 'Superadmin' || role === 'superadmin' ? 'Superadmin' : 'Direktur';
    const userId = req.headers.get('x-user-id');

    const { id: pengajuanIdStr } = await params;
    const pengajuanId = parseInt(pengajuanIdStr, 10);

    const body = await req.json();
    const { status: targetStatus, catatan } = body;
    if (!['APPROVE', 'REJECT'].includes(targetStatus)) {
      return NextResponse.json({ message: 'status must be APPROVE or REJECT' }, { status: 400 });
    }

    const pengajuan = await prisma.pengajuanAnggaran.findUnique({
      where: { id: pengajuanId },
      include: {
        proyek: { select: { id: true, nama: true } },
        mainAnggaran: { select: { id: true, namaMain: true, budgetId: true } },
        pengaju: { select: { id: true, nama: true } },
      },
    });
    if (!pengajuan) return NextResponse.json({ message: 'Pengajuan not found' }, { status: 404 });
    if (pengajuan.status !== 'PENDING') {
      return NextResponse.json({ message: 'Pengajuan sudah diproses' }, { status: 400 });
    }

    if (targetStatus === 'REJECT') {
      await prisma.pengajuanAnggaran.update({
        where: { id: pengajuanId },
        data: { status: 'REJECT', catatan: catatan?.trim() || null, processedAt: new Date() },
      });

      await prisma.notification.create({
        data: {
          userId: pengajuan.pengajuId,
          tipe: 'PENGAJUAN_DITOLAK',
          pesan: `Pengajuan "${pengajuan.judul}" untuk proyek ${pengajuan.proyek.nama} ditolak oleh ${reviewerName}.${catatan ? ` Alasan: ${catatan}` : ''}`,
        },
      });
    } else {
      // APPROVE — validasi ulang batas dalam transaction (race safety)
      try {
        await prisma.$transaction(async (tx) => {
          const current = await tx.pengajuanAnggaran.findUnique({ where: { id: pengajuanId }, select: { status: true } });
          if (!current || current.status !== 'PENDING') throw new Error('RACE_CONDITION');

          const locked = await tx.$queryRaw<Array<{ id: number }>>`
            SELECT id FROM budget WHERE proyek_id = ${pengajuan.proyekId} FOR UPDATE
          `;
          if (!locked || locked.length === 0) throw new Error('Budget not found');

          const budget = await tx.budget.findUnique({ where: { proyekId: pengajuan.proyekId } });
          if (!budget) throw new Error('Budget not found');

          const sumSub = await tx.subAnggaran.aggregate({
            where: { mainAnggaranId: pengajuan.mainAnggaranId },
            _sum: { nominalAlokasi: true },
          });
          const others = await tx.mainAnggaran.aggregate({
            where: { budgetId: budget.id, id: { not: pengajuan.mainAnggaranId } },
            _sum: { nominalAlokasi: true },
          });

          const err = computeApproveError({
            alokasiBaru: Number(pengajuan.alokasiBaru),
            sumLain: Number(others._sum.nominalAlokasi || 0),
            nilaiKontrak: Number(budget.nilaiKontrak),
            sumSub: Number(sumSub._sum.nominalAlokasi || 0),
          });
          if (err) throw new Error(`VALIDATION:${err}`);

          await tx.mainAnggaran.update({
            where: { id: pengajuan.mainAnggaranId },
            data: { nominalAlokasi: pengajuan.alokasiBaru },
          });
          await tx.pengajuanAnggaran.update({
            where: { id: pengajuanId },
            data: { status: 'DISETUJUI', catatan: catatan?.trim() || null, processedAt: new Date() },
          });
        });
      } catch (e: any) {
        if (e?.message === 'RACE_CONDITION') {
          return NextResponse.json({ message: 'Pengajuan sudah diproses oleh reviewer lain' }, { status: 409 });
        }
        if (typeof e?.message === 'string' && e.message.startsWith('VALIDATION:')) {
          return NextResponse.json({ message: e.message.replace('VALIDATION:', '') }, { status: 422 });
        }
        throw e;
      }

      await prisma.notification.create({
        data: {
          userId: pengajuan.pengajuId,
          tipe: 'PENGAJUAN_DISETUJUI',
          pesan: `Pengajuan "${pengajuan.judul}" untuk proyek ${pengajuan.proyek.nama} telah disetujui oleh ${reviewerName}. Alokasi ${pengajuan.mainAnggaran.namaMain} diperbarui.`,
        },
      });
    }

    if (userId) {
      await prisma.auditTrail.create({
        data: {
          userId: parseInt(userId, 10),
          aksi: 'review_pengajuan_anggaran',
          detail: `${reviewerName} ${targetStatus === 'APPROVE' ? 'menyetujui' : 'menolak'} pengajuan "${pengajuan.judul}" (${pengajuan.mainAnggaran.namaMain}) untuk proyek ${pengajuan.proyek.nama}.${catatan ? ` Catatan: ${catatan}` : ''}`,
        },
      });
    }

    clearCache('proyek:');
    clearCache('dashboard:');

    const final = await prisma.pengajuanAnggaran.findUnique({
      where: { id: pengajuanId },
      include: { pengaju: { select: { id: true, nama: true } }, mainAnggaran: { select: { id: true, namaMain: true } } },
    });

    return NextResponse.json({
      message: targetStatus === 'APPROVE' ? 'Pengajuan disetujui dan alokasi diperbarui' : 'Pengajuan ditolak',
      pengajuan: final,
    });
  } catch (error) {
    console.error('Review pengajuan error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Internal server error', error: message }, { status: 500 });
  }
}
