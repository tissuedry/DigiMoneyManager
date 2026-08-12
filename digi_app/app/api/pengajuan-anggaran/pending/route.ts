import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');
    if (role !== 'Direktur / Manajemen' && role !== 'Superadmin' && role !== 'superadmin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'PENDING';

    const list = await prisma.pengajuanAnggaran.findMany({
      where: { status },
      include: {
        pengaju: { select: { id: true, nama: true } },
        proyek: { select: { id: true, nama: true } },
        mainAnggaran: { select: { id: true, namaMain: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ pengajuan: list });
  } catch (error) {
    console.error('Get pending pengajuan error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Internal server error', error: message }, { status: 500 });
  }
}
