import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearCache } from '@/lib/route-cache';

// POST: Add a new Pos Anggaran category to a project's budget
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    const rolesHeader = req.headers.get('x-user-roles') || role || '';
    const roles = rolesHeader.split(',');
    const userId = req.headers.get('x-user-id');
    const { id: proyekIdStr } = await params;
    const proyekId = parseInt(proyekIdStr, 10);

    const isPM = await prisma.userProyek.findFirst({
      where: {
        userId: parseInt(userId || '0', 10),
        proyekId: proyekId,
        role: 'Project Manager',
      },
    });

    if (!isPM && !roles.includes('Tim Keuangan') && !roles.includes('Direktur / Manajemen')) {
      return NextResponse.json({ message: 'Forbidden: You must be the assigned Project Manager, Tim Keuangan, or Direktur / Manajemen to modify this project budget' }, { status: 403 });
    }
    const body = await req.json();
    const { namaPos, nominalAlokasi } = body;

    if (!namaPos || isNaN(Number(nominalAlokasi)) || Number(nominalAlokasi) <= 0) {
      return NextResponse.json({ message: 'namaPos and a positive nominalAlokasi are required' }, { status: 400 });
    }

    // Verify project exists
    const project = await prisma.proyek.findUnique({
      where: { id: proyekId },
    });

    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    // Find existing budget for the project
    const budget = await prisma.budget.findUnique({
      where: { proyekId },
    });

    if (!budget) {
      return NextResponse.json({ message: 'Budget not found for this project. Please initialize the project budget first.' }, { status: 404 });
    }

    // Update in transaction: create PosAnggaran and increment budget fields
    const newPos = await prisma.$transaction(async (tx) => {
      const createdPos = await tx.mainAnggaran.create({
        data: {
          budgetId: budget.id,
          namaMain: namaPos.trim(),
          nominalAlokasi: Number(nominalAlokasi),
          nominalTerpakai: 0,
        },
      });

      // Update parent budget total and remaining
      await tx.budget.update({
        where: { id: budget.id },
        data: {
          rabTotal: { increment: Number(nominalAlokasi) },
          sisaBudget: { increment: Number(nominalAlokasi) },
        },
      });

      return createdPos;
    });

    if (userId) {
      await prisma.auditTrail.create({
        data: {
          userId: parseInt(userId, 10),
          aksi: 'add_pos_anggaran',
          detail: `Menambahkan pos anggaran ${namaPos} senilai Rp ${Number(nominalAlokasi).toLocaleString('id-ID')} pada proyek ${project.nama}`,
        },
      });
    }

    clearCache('dashboard:');
    clearCache('proyek:');
    return NextResponse.json({ message: 'Pos Anggaran added successfully', pos: newPos }, { status: 201 });
  } catch (error: any) {
    console.error('Add pos anggaran error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
