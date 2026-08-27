import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function checkAuthorization(req: NextRequest, proyekId: number) {
  const userId = req.headers.get('x-user-id');
  const userRole = req.headers.get('x-user-role');

  const isDirektur = userRole === 'Direktur / Manajemen';
  const isSuperAdmin = userRole === 'Superadmin' || userRole === 'superadmin';
  const isKeuangan = userRole === 'Tim Keuangan';

  const isMember = userId
    ? await prisma.userProyek.findFirst({
        where: { userId: parseInt(userId, 10), proyekId },
      })
    : null;

  return isDirektur || isSuperAdmin || isKeuangan || isMember;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const proyekId = parseInt(id, 10);

    const isAuthorized = await checkAuthorization(req, proyekId);
    if (!isAuthorized) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const riwayatPencairan = await prisma.terminPembayaran.findMany({
      where: { 
        proyekId,
        status: 'DITERIMA' 
      },
      orderBy: { tanggalPencairan: 'desc' }, 
    });

    return NextResponse.json({ success: true, data: riwayatPencairan });
  } catch (error: any) {
    console.error('Fetch riwayat pemasukan error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}