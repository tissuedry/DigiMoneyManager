import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: Cancel (permanently delete) a reimbursement that is still pending PM review (Karyawan only)
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
      return NextResponse.json({ message: 'Reimbursement not found' }, { status: 404 });
    }

    if (reimbursement.userId !== parseInt(userId, 10)) {
      return NextResponse.json({ message: 'Forbidden: You can only cancel your own submissions' }, { status: 403 });
    }

    if (reimbursement.status !== 'SUBMITTED') {
      return NextResponse.json({ message: 'Only submissions still pending PM review (SUBMITTED) can be cancelled' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // No Approval/JurnalAkuntansi rows exist yet at SUBMITTED status, safe to delete outright
      await tx.reimbursement.delete({
        where: { id: parseInt(id, 10) },
      });

      await tx.auditTrail.create({
        data: {
          userId: parseInt(userId, 10),
          aksi: 'cancel_reimbursement',
          detail: `Membatalkan pengajuan reimbursement Rp ${Number(reimbursement.nominal).toLocaleString()} untuk proyek ${reimbursement.proyek.nama}`,
        },
      });
    });

    return NextResponse.json({
      message: 'Reimbursement successfully cancelled and removed',
      id: parseInt(id, 10),
    });
  } catch (error: any) {
    console.error('Cancel reimbursement error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
