import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearCache } from '@/lib/route-cache';

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
    const { rabTotal, posAnggaran } = body; // posAnggaran is array of { deskripsi, nominalAlokasi } — kept for API compat

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

    // Verify sum of posAnggaran does not exceed rabTotal
    const sumAllocations = posAnggaran.reduce((sum: number, pos: any) => sum + parseFloat(pos.nominalAlokasi), 0);
    if (sumAllocations > parseFloat(rabTotal)) {
      return NextResponse.json({
        message: `Jumlah alokasi item (Rp ${sumAllocations.toLocaleString('id-ID')}) tidak boleh melebihi total Nilai Proyek (Rp ${parseFloat(rabTotal).toLocaleString('id-ID')})`
      }, { status: 400 });
    }

    // Perform a differential update of the budget if it exists, or create a new one
    const result = await prisma.$transaction(async (tx) => {
      // Check for existing budget
      const existingBudget = await tx.budget.findUnique({
        where: { proyekId: parseInt(proyekId, 10) },
        include: {
          mainAnggaran: true,
        },
      });

      if (existingBudget) {
        const existingMain = existingBudget.mainAnggaran;

        for (const ext of existingMain) {
          const matchedIncoming = posAnggaran.find(
            (pos: any) => pos.deskripsi.trim().toLowerCase() === ext.namaMain.trim().toLowerCase()
          );

            if (matchedIncoming) {
              const newAlokasi = parseFloat(matchedIncoming.nominalAlokasi);
              const nominalTerpakai = Number(ext.nominalTerpakai);

              await tx.mainAnggaran.update({
              where: { id: ext.id },
              data: {
                nominalAlokasi: newAlokasi,
                namaMain: matchedIncoming.deskripsi,
              },
            });
          } else {
            // Cascade delete subAnggaran, keteranganAnggaran, and reimbursements before deleting mainAnggaran
            const subs = await tx.subAnggaran.findMany({
              where: { mainAnggaranId: ext.id },
              select: { id: true },
            });
            const subIds = subs.map((s) => s.id);

            if (subIds.length > 0) {
              const kets = await tx.keteranganAnggaran.findMany({
                where: { subAnggaranId: { in: subIds } },
                select: { id: true },
              });
              const ketIds = kets.map((k) => k.id);

              if (ketIds.length > 0) {
                await tx.reimbursement.deleteMany({
                  where: { keteranganAnggaranId: { in: ketIds } },
                });
                await tx.keteranganAnggaran.deleteMany({
                  where: { id: { in: ketIds } },
                });
              }

              await tx.subAnggaran.deleteMany({
                where: { mainAnggaranId: ext.id },
              });
            }

            await tx.mainAnggaran.delete({
              where: { id: ext.id },
            });
          }
        }

        for (const incoming of posAnggaran) {
          const exists = existingMain.some(
            (ext) => ext.namaMain.trim().toLowerCase() === incoming.deskripsi.trim().toLowerCase()
          );

          if (!exists) {
            await tx.mainAnggaran.create({
              data: {
                budgetId: existingBudget.id,
                namaMain: incoming.deskripsi,
                nominalAlokasi: parseFloat(incoming.nominalAlokasi),
                nominalTerpakai: 0,
              },
            });
          }
        }

        const approvedReimbursements = await tx.reimbursement.findMany({
          where: {
            proyekId: parseInt(proyekId, 10),
            status: 'APPROVED',
          },
          select: { nominal: true },
        });
        const totalPengeluaran = approvedReimbursements.reduce(
          (sum, r) => sum + Number(r.nominal),
          0
        );

        const updatedBudget = await tx.budget.update({
          where: { id: existingBudget.id },
          data: {
            rabTotal,
            totalPengeluaran,
            sisaBudget: Number(rabTotal) - totalPengeluaran,
          },
          include: {
            mainAnggaran: true,
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
            mainAnggaran: {
              create: posAnggaran.map((pos: any) => ({
                namaMain: pos.deskripsi,
                nominalAlokasi: pos.nominalAlokasi,
                nominalTerpakai: 0,
              })),
            },
          },
          include: {
            mainAnggaran: true,
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
      posAnggaran: result.mainAnggaran.map((m) => ({
        ...m,
        deskripsi: m.namaMain,
        namaPos: m.namaMain,
      })),
    };

    clearCache('dashboard:');
    clearCache('proyek:');
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

// PATCH: Directly update a single pos alokasi (Main / Sub / Keterangan) — PM of project or Direktur
// Body: { type: 'main'|'sub'|'ket', id: number, nominalAlokasi: number }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    const userId = req.headers.get('x-user-id');
    const { id: proyekIdStr } = await params;
    const proyekId = parseInt(proyekIdStr, 10);

    // Authorization: PM assigned to project or Direktur
    const isDirektur = role === 'Direktur / Manajemen';
    const isPM = userId
      ? await prisma.userProyek.findFirst({
          where: { userId: parseInt(userId, 10), proyekId, role: 'Project Manager' },
        })
      : null;

    if (!isDirektur && !isPM) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { type, id, nominalAlokasi } = body;

    if (!['main', 'sub', 'ket'].includes(type) || !id || nominalAlokasi == null || Number(nominalAlokasi) < 0) {
      return NextResponse.json({ message: 'type (main|sub|ket), id, and nominalAlokasi (>=0) are required' }, { status: 400 });
    }

    const newAlokasi = Number(nominalAlokasi);
    const posId = Number(id);

    if (type === 'main') {
      await prisma.mainAnggaran.update({ where: { id: posId }, data: { nominalAlokasi: newAlokasi } });
    } else if (type === 'sub') {
      await prisma.subAnggaran.update({ where: { id: posId }, data: { nominalAlokasi: newAlokasi } });
    } else {
      await prisma.keteranganAnggaran.update({ where: { id: posId }, data: { nominalAlokasi: newAlokasi } });
    }

    // Audit trail
    if (userId) {
      await prisma.auditTrail.create({
        data: {
          userId: parseInt(userId, 10),
          aksi: 'edit_alokasi',
          detail: `Edit alokasi ${type} id=${posId} pada proyek ${proyekId} menjadi Rp ${newAlokasi.toLocaleString('id-ID')}`,
        },
      });
    }

    clearCache('dashboard:');
    clearCache('proyek:');
    return NextResponse.json({ message: 'Alokasi berhasil diperbarui' });
  } catch (error: any) {
    console.error('PATCH alokasi error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
