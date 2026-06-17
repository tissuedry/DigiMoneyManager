import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: Input/Set RAB budget for a project (PM or Tim Keuangan only)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    const rolesHeader = req.headers.get('x-user-roles') || role || '';
    const roles = rolesHeader.split(',');
    const userId = req.headers.get('x-user-id');
    const { id: proyekId } = await params;

    const isPM = await prisma.userProyek.findFirst({
      where: {
        userId: parseInt(userId || '0', 10),
        proyekId: parseInt(proyekId, 10),
        role: 'Project Manager',
      },
    });

    if (!isPM && !roles.includes('Tim Keuangan') && !roles.includes('Direktur / Manajemen')) {
      return NextResponse.json({ message: 'Forbidden: You must be the assigned Project Manager, Tim Keuangan, or Direktur / Manajemen to modify this project budget' }, { status: 403 });
    }
    const body = await req.json();
    const { rabTotal, posAnggaran } = body; // posAnggaran is array of { deskripsi, nominalAlokasi }

    if (!rabTotal || !posAnggaran || !Array.isArray(posAnggaran)) {
      return NextResponse.json({ message: 'rabTotal and posAnggaran (array) are required' }, { status: 400 });
    }

    // Verify project exists
    const project = await prisma.proyek.findUnique({
      where: { id: parseInt(proyekId, 10) },
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

    // Perform a differential update of the budget if it exists, or create a new one
    const result = await prisma.$transaction(async (tx) => {
      // Check for existing budget
      const existingBudget = await tx.budget.findUnique({
        where: { proyekId: parseInt(proyekId, 10) },
        include: {
          posAnggaran: {
            include: {
              reimbursements: {
                select: { id: true },
              },
            },
          },
        },
      });

      if (existingBudget) {
        const existingPos = existingBudget.posAnggaran;

        for (const ext of existingPos) {
          const matchedIncoming = posAnggaran.find(
            (pos) => pos.deskripsi.trim().toLowerCase() === ext.namaPos.trim().toLowerCase()
          );

          if (matchedIncoming) {
            const newAlokasi = parseFloat(matchedIncoming.nominalAlokasi);
            const nominalTerpakai = Number(ext.nominalTerpakai);

            if (newAlokasi < nominalTerpakai) {
              throw new Error(
                `ValidationError: Alokasi untuk pos "${ext.namaPos}" tidak boleh kurang dari nominal yang sudah terpakai (Rp ${nominalTerpakai.toLocaleString('id-ID')})`
              );
            }

            await tx.posAnggaran.update({
              where: { id: ext.id },
              data: {
                nominalAlokasi: newAlokasi,
                namaPos: matchedIncoming.deskripsi,
              },
            });
          } else {
            if (ext.reimbursements.length > 0 || Number(ext.nominalTerpakai) > 0) {
              throw new Error(
                `ValidationError: Tidak dapat menghapus pos anggaran "${ext.namaPos}" karena sudah memiliki pengajuan reimbursement terkait`
              );
            }

            await tx.posAnggaran.delete({
              where: { id: ext.id },
            });
          }
        }

        for (const incoming of posAnggaran) {
          const exists = existingPos.some(
            (ext) => ext.namaPos.trim().toLowerCase() === incoming.deskripsi.trim().toLowerCase()
          );

          if (!exists) {
            await tx.posAnggaran.create({
              data: {
                budgetId: existingBudget.id,
                namaPos: incoming.deskripsi,
                nominalAlokasi: parseFloat(incoming.nominalAlokasi),
                nominalTerpakai: 0,
              },
            });
          }
        }

        const totalPengeluaran = Number(existingBudget.totalPengeluaran);
        const updatedBudget = await tx.budget.update({
          where: { id: existingBudget.id },
          data: {
            rabTotal,
            sisaBudget: Number(rabTotal) - totalPengeluaran,
          },
          include: {
            posAnggaran: true,
          },
        });

        return updatedBudget;
      } else {
        const newBudget = await tx.budget.create({
          data: {
            proyekId: parseInt(proyekId, 10),
            rabTotal,
            sisaBudget: rabTotal,
            totalPengeluaran: 0,
            totalReimbursement: 0,
            posAnggaran: {
              create: posAnggaran.map((pos) => ({
                namaPos: pos.deskripsi,
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
      }
    });

    if (userId) {
      await prisma.auditTrail.create({
        data: {
          userId: parseInt(userId, 10),
          aksi: 'input_rab',
          detail: `Menginput RAB proyek ${project.nama} senilai Rp ${parseFloat(rabTotal).toLocaleString()}`,
        },
      });
    }

    const responseBudget = {
      ...result,
      posAnggaran: result.posAnggaran.map((pos) => ({
        ...pos,
        deskripsi: pos.namaPos,
      })),
    };

    return NextResponse.json({ message: 'RAB budget initialized successfully', budget: responseBudget }, { status: 201 });
  } catch (error: any) {
    console.error('Input budget error:', error);
    if (error.message && error.message.startsWith('ValidationError:')) {
      return NextResponse.json(
        { message: error.message.replace('ValidationError:', '').trim() },
        { status: 400 }
      );
    }
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
