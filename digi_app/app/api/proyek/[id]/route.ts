import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearCache } from '@/lib/route-cache';

// GET: Retrieve a project with its full budget, expenses, and budget items
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const proyekId = parseInt(id, 10);

    const [project, approvals] = await Promise.all([
      prisma.proyek.findUnique({
        where: { id: proyekId },
        include: {
          budget: {
            include: {
              posAnggaran: true,
            },
          },
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  nama: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
      }),
      prisma.approval.findMany({
        where: {
          reimbursement: { proyekId: proyekId },
          level: 'KEUANGAN',
          status: 'APPROVED',
        },
        include: { reimbursement: { select: { nominal: true } } },
        orderBy: { timestamp: 'asc' },
      })
    ]);

    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    const mappedUsers = project.users.map((up) => ({
      ...up.user,
      roleInProyek: up.role,
    }));
    const mappedBudget = project.budget ? {
      ...project.budget,
      posAnggaran: project.budget.posAnggaran.map((pos) => ({
        ...pos,
        deskripsi: pos.namaPos,
      })),
    } : null;

    // Calculate last 6 months cash flow
    const cashFlow: { bulan: string; inflow: number; outflow: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthLabel = monthDate.toLocaleDateString('id-ID', { month: 'short' });

      const monthOutflow = approvals
        .filter((a) => {
          const t = new Date(a.timestamp);
          return t >= monthDate && t <= monthEnd;
        })
        .reduce((sum, a) => sum + Number(a.reimbursement.nominal), 0);

      const monthInflow = Math.round(monthOutflow * 1.2);
      cashFlow.push({
        bulan: monthLabel,
        inflow: monthInflow,
        outflow: monthOutflow,
      });
    }

    const responseProject = {
      ...project,
      users: mappedUsers,
      budget: mappedBudget,
      cashFlow,
    };

    return NextResponse.json({ project: responseProject });
  } catch (error: any) {
    console.error('Fetch project detail error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// PUT: Update project details
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    const direktorId = req.headers.get('x-user-id');
    if (role !== 'Direktur / Manajemen') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const proyekId = parseInt(id, 10);

    const body = await req.json();
    const { nama, deskripsi, tanggalMulai, tanggalSelesai, status } = body;

    if (!nama || !tanggalMulai || !status) {
      return NextResponse.json({ message: 'Nama, tanggal mulai, dan status wajib diisi' }, { status: 400 });
    }

    const updatedProject = await prisma.proyek.update({
      where: { id: proyekId },
      data: {
        nama,
        deskripsi: deskripsi || null,
        tanggalMulai: new Date(tanggalMulai),
        tanggalSelesai: tanggalSelesai ? new Date(tanggalSelesai) : null,
        status,
      },
    });

    if (direktorId) {
      await prisma.auditTrail.create({
        data: {
          userId: parseInt(direktorId, 10),
          aksi: 'update_project',
          detail: `Direktur memperbarui proyek: ${nama} (Status: ${status})`,
        },
      });
    }

    clearCache('proyek:');
    clearCache('dashboard:');
    return NextResponse.json({ message: 'Proyek berhasil diperbarui', project: updatedProject });
  } catch (error: any) {
    console.error('Update project error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a project
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    const direktorId = req.headers.get('x-user-id');
    if (role !== 'Direktur / Manajemen') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const proyekId = parseInt(id, 10);

    // Verify project exists
    const project = await prisma.proyek.findUnique({ where: { id: proyekId } });
    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    // Perform deletion in a transaction to handle non-cascading relations safely
    await prisma.$transaction(async (tx) => {
      // 1. Delete reimbursements (this will cascade delete approvals and jurnal entries)
      await tx.reimbursement.deleteMany({
        where: { proyekId },
      });

      // 2. Delete project itself (cascades UserProyek, Budget, and PosAnggaran)
      await tx.proyek.delete({
        where: { id: proyekId },
      });
    });

    if (direktorId) {
      await prisma.auditTrail.create({
        data: {
          userId: parseInt(direktorId, 10),
          aksi: 'delete_project',
          detail: `Direktur menghapus proyek: ${project.nama}`,
        },
      });
    }

    clearCache('proyek:');
clearCache('dashboard:');
return NextResponse.json({ message: 'Proyek berhasil dihapus' });
  } catch (error: any) {
    console.error('Delete project error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
