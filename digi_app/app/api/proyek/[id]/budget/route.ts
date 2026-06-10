import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: Input/Set RAB budget for a project (PM or Tim Keuangan only)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    const userId = req.headers.get('x-user-id');

    if (role !== 'Project Manager' && role !== 'Tim Keuangan') {
      return NextResponse.json({ message: 'Forbidden: Only Project Manager or Tim Keuangan can modify project budget' }, { status: 403 });
    }

    const { id: proyekId } = await params;
    const body = await req.json();
    const { rabTotal, posAnggaran } = body; // posAnggaran is array of { deskripsi, nominalAlokasi }

    if (!rabTotal || !posAnggaran || !Array.isArray(posAnggaran)) {
      return NextResponse.json({ message: 'rabTotal and posAnggaran (array) are required' }, { status: 400 });
    }

    // Verify project exists
    const project = await prisma.proyek.findUnique({
      where: { id: proyekId },
    });

    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    // Verify sum of posAnggaran equals rabTotal
    const sumAllocations = posAnggaran.reduce((sum, pos) => sum + parseFloat(pos.nominalAlokasi), 0);
    if (Math.abs(sumAllocations - parseFloat(rabTotal)) > 0.01) {
      return NextResponse.json({ 
        message: `Allocation mismatch: Sum of item budgets (Rp ${sumAllocations.toLocaleString()}) must equal total RAB (Rp ${parseFloat(rabTotal).toLocaleString()})` 
      }, { status: 400 });
    }

    // We can use a transaction to delete existing budget (if any) and insert the new one
    const result = await prisma.$transaction(async (tx) => {
      // Check for existing budget
      const existingBudget = await tx.budget.findUnique({
        where: { proyekId },
      });

      if (existingBudget) {
        // Delete old budget (cascades to posAnggaran)
        await tx.budget.delete({
          where: { proyekId },
        });
      }

      // Create new budget
      const newBudget = await tx.budget.create({
        data: {
          proyekId,
          rabTotal,
          sisaBudget: rabTotal,
          totalPengeluaran: 0,
          totalReimbursement: 0,
          posAnggaran: {
            create: posAnggaran.map((pos) => ({
              deskripsi: pos.deskripsi,
              nominalAlokasi: pos.nominalAlokasi,
              nominalTerpakai: 0,
            })),
          },
        },
        include: {
          posAnggaran: true,
        },
      });

      return newBudget;
    });

    if (userId) {
      await prisma.auditTrail.create({
        data: {
          userId,
          aksi: 'input_rab',
          detail: `Menginput RAB proyek ${project.nama} senilai Rp ${parseFloat(rabTotal).toLocaleString()}`,
        },
      });
    }

    return NextResponse.json({ message: 'RAB budget initialized successfully', budget: result }, { status: 201 });
  } catch (error: any) {
    console.error('Input budget error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
