import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Lightweight Main > Sub > Keterangan name tree for a project's budget.
// Unlike /api/proyek/[id], this is readable by anyone assigned to the project
// in any role (not just Project Manager) since it never exposes budget
// nominals, cash flow, or other members' reimbursement data — just the
// classification names/ids needed to categorize a reimbursement.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');
    const { id } = await params;
    const proyekId = parseInt(id, 10);

    const isDirektur = userRole === 'Direktur / Manajemen';
    const isMember = userId
      ? await prisma.userProyek.findFirst({
          where: { userId: parseInt(userId, 10), proyekId },
        })
      : null;

    if (!isDirektur && !isMember) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const mainAnggaran = await prisma.mainAnggaran.findMany({
      where: { budget: { proyekId } },
      select: {
        id: true,
        namaMain: true,
        subAnggaran: {
          select: {
            id: true,
            namaSub: true,
            keterangan: {
              select: { id: true, keterangan: true },
            },
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({ posAnggaran: mainAnggaran });
  } catch (error: any) {
    console.error('Fetch pos anggaran error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}