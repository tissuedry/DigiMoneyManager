import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearCache } from '@/lib/route-cache';

async function canAccess(userId: string | null, userRole: string | null, proyekId: number, action: 'read' | 'write' | 'delete') {
  if (
    userRole === 'Direktur / Manajemen' || 
    userRole === 'Superadmin' || 
    userRole === 'superadmin'
  ) 
  {
    return true;
  }

  if (action !== 'delete' && userId) {
    return !!(await prisma.userProyek.findFirst({
      where: { userId: parseInt(userId, 10), proyekId, role: 'Project Manager' },
    }));
  }

  return false;
}

// GET: Retrieve a project with its full budget, expenses, and budget items
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');
    const { id } = await params;
    const proyekId = parseInt(id, 10);

    if (!(await canAccess(userId, userRole, proyekId, 'read'))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const [project, approvals, pendingReimbursements, pendingPengajuanCount] = await Promise.all([
      prisma.proyek.findUnique({
        where: { id: proyekId },
        include: {
          budget: {
            include: {
              mainAnggaran: {
                orderBy: { id: 'asc' },
                include: {
                  subAnggaran: {
                    orderBy: { id: 'asc' },
                    include: {
                      keterangan: {
                        orderBy: { id: 'asc' },
                        include: {
                          reimbursements: {
                            include: {
                              user: {
                                select: {
                                  nama: true,
                                },
                              },
                            },
                            orderBy: {
                              id: 'desc',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
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
      }),

      prisma.reimbursement.findMany({
        where: {
          proyekId: proyekId,
          status: { notIn: ['APPROVED', 'REJECTED'] },
        },
        include: {
          user: {
            select: {
              nama: true,
            },
          },
          keteranganAnggaran: {
            include: {
              subAnggaran: {
                include: {
                  mainAnggaran: true,
                },
              },
            },
          },
        },
        orderBy: {
          id: 'desc',
        },
      }),

      prisma.pengajuanAnggaranItem.count({
        where: { pengajuan: { proyekId, status: 'PENDING' } },
      })
    ]);

    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    const mappedUsers = project.users.map((up: any) => ({
      ...up.user,
      roleInProyek: up.role,
      divisiInProyek: up.divisi,
    }));

    const mappedBudget = project.budget ? {
      ...project.budget,
      posAnggaran: (project.budget as any).mainAnggaran.map((m: any) => ({
        ...m,
        deskripsi: m.namaMain,
        namaPos: m.namaMain,
        subAnggaran: m.subAnggaran ? m.subAnggaran.map((s: any) => ({
          ...s,
          keterangan: s.keterangan || [],
        })) : [],
      })),
    } : null;

    // Calculate cash flow for different ranges
    const getCashFlowForMonths = (monthsCount: number) => {
      const flow: { bulan: string; inflow: number; outflow: number }[] = [];
      const now = new Date();

      for (let i = monthsCount - 1; i >= 0; i--) {
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
        flow.push({
          bulan: monthLabel,
          inflow: monthInflow,
          outflow: monthOutflow,
        });
      }

      return flow;
    };

    const now = new Date();
    const cashFlow4m = getCashFlowForMonths(4);
    const cashFlow12m = getCashFlowForMonths(12);
    const cashFlowYtd = getCashFlowForMonths(now.getMonth() + 1);

    const approvedReimbursements = approvals.map((a) => Number(a.reimbursement.nominal));
    const calculatedApprovedNominal = approvedReimbursements.reduce((sum, n) => sum + n, 0);
    const sudahReimburseNominal = approvals.length > 0
      ? calculatedApprovedNominal
      : Number(project.budget?.totalReimbursement || 0);
    const sudahReimburseCount = approvals.length;

    const belumReimburseNominal = pendingReimbursements.reduce((sum, r) => sum + Number(r.nominal || 0), 0);
    const belumReimburseCount = pendingReimbursements.length;

    const responseProject = {
      ...project,
      users: mappedUsers,
      budget: mappedBudget,
      cashFlow4m,
      cashFlow12m,
      cashFlowYtd,
      pendingPmCount: pendingPengajuanCount,
      pendingReimbursements,
      sudahReimburseNominal,
      sudahReimburseCount,
      belumReimburseNominal,
      belumReimburseCount,
      reimbursementDisetujui: sudahReimburseNominal,
      reimbursementDisetujuiCount: sudahReimburseCount,
      reimbursementBelumDisetujui: belumReimburseNominal,
      reimbursementBelumDisetujuiCount: belumReimburseCount,
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
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');
    const { id } = await params;
    const proyekId = parseInt(id, 10);

    if (!(await canAccess(userId, userRole, proyekId, 'write'))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

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

    if (userId) {
      let actor = 'Project Manager';

      if (userRole === 'Direktur / Manajemen') {
        actor = 'Direktur';

      } else if (userRole === 'Superadmin' || userRole === 'superadmin') {
        actor = 'Super Admin';
      }

      await prisma.auditTrail.create({
        data: {
          userId: parseInt(userId, 10),
          aksi: 'update_project',
          detail: `${actor} memperbarui proyek: ${nama} (Status: ${status})`,
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

// DELETE: Delete a project (Direktur / Super Admin only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');
    
    if (
      userRole !== 'Direktur / Manajemen' && 
      userRole !== 'Superadmin' && 
      userRole !== 'superadmin'
    ) 
    {
      return NextResponse.json({ message: 'Forbidden: Only Direktur or Super Admin can delete projects' }, { status: 403 });
    }

    const { id } = await params;
    const proyekId = parseInt(id, 10);

    // Verify project exists
    const project = await prisma.proyek.findUnique({ where: { id: proyekId } });
    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    // Perform deletion in a batch transaction to handle non-cascading relations safely (safe for PgBouncer)
    const deleteReimbursements = prisma.reimbursement.deleteMany({
      where: { proyekId },
    });

    const deleteProject = prisma.proyek.delete({
      where: { id: proyekId },
    });

    await prisma.$transaction([deleteReimbursements, deleteProject]);

    if (userId) {
      // PERUBAHAN: Menyesuaikan identitas actor untuk Audit Trail
      const actor = (userRole === 'Superadmin' || userRole === 'superadmin') 
        ? 'Superadmin' 
        : 'Direktur';

      await prisma.auditTrail.create({
        data: {
          userId: parseInt(userId, 10),
          aksi: 'delete_project',
          detail: `${actor} menghapus proyek: ${project.nama}`,
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