import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearCache } from '@/lib/route-cache';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const reimbursement = await prisma.reimbursement.findUnique({
      where: { id: parseInt(id, 10) },
      include: { proyek: { select: { nama: true } } },
    });

    if (!reimbursement) {
      return NextResponse.json({ message: 'Pengajuan not found' }, { status: 404 });
    }

    if (reimbursement.userId !== parseInt(userId, 10)) {
      return NextResponse.json({ message: 'Forbidden: You can only cancel your own submissions' }, { status: 403 });
    }

    const tipePengajuan = reimbursement.tipe || 'Pengajuan';

    const isKaryawanPending = reimbursement.status === 'SUBMITTED';
    const isPMPending = reimbursement.status === 'APPROVED_BY_PM' && tipePengajuan === 'Realisasi Anggaran';

    if (!isKaryawanPending && !isPMPending) {
      return NextResponse.json({ 
        message: 'Pengajuan sudah diproses atau diteruskan, tidak dapat dibatalkan' 
      }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.reimbursement.delete({
        where: { id: parseInt(id, 10) },
      });

      await tx.auditTrail.create({
        data: {
          userId: parseInt(userId, 10),
          aksi: 'cancel_pengajuan',
          detail: `Membatalkan pengajuan ${tipePengajuan} Rp ${Number(reimbursement.nominal).toLocaleString()} untuk proyek ${reimbursement.proyek.nama}`,
        },
      });
    });

    clearCache('dashboard:');
    clearCache('reimb:');
    clearCache('notif:');

    return NextResponse.json({
      message: `${tipePengajuan} successfully cancelled and removed`,
      id: parseInt(id, 10),
    });
  } catch (error: any) {
    console.error('Cancel pengajuan error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}