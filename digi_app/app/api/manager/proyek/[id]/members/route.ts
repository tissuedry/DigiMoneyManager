import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch all members assigned to this project
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    if (role !== 'Direktur / Manajemen') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id: proyekIdStr } = await params;
    const proyekId = parseInt(proyekIdStr, 10);

    const members = await prisma.userProyek.findMany({
      where: { proyekId },
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            email: true,
            role: true,
            divisi: true,
          },
        },
      },
    });

    const mapped = members.map((m) => ({
      id: m.user.id,
      nama: m.user.nama,
      email: m.user.email,
      role: m.user.role,
      divisi: m.user.divisi,
      roleInProyek: m.role,
    }));

    return NextResponse.json({ members: mapped });
  } catch (error: any) {
    console.error('Get project members error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// PUT: Set the list of assigned members for this project
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    const direktorId = req.headers.get('x-user-id');
    if (role !== 'Direktur / Manajemen') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id: proyekIdStr } = await params;
    const proyekId = parseInt(proyekIdStr, 10);

    const body = await req.json();
    const { userIds, members } = body;

    if ((!userIds || !Array.isArray(userIds)) && (!members || !Array.isArray(members))) {
      return NextResponse.json({ message: 'userIds or members array is required' }, { status: 400 });
    }

    // Verify project exists
    const project = await prisma.proyek.findUnique({ where: { id: proyekId } });
    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    // Update members inside a batch transaction (safe for PgBouncer transaction mode)
    const deleteOp = prisma.userProyek.deleteMany({
      where: { proyekId },
    });

    if (members && Array.isArray(members) && members.length > 0) {
      const userProyeks = members.map((m: any) => ({
        proyekId,
        userId: typeof m.userId === 'string' ? parseInt(m.userId, 10) : m.userId,
        role: m.role,
        divisi: m.divisi || null,
      }));

      const createOp = prisma.userProyek.createMany({
        data: userProyeks,
      });

      await prisma.$transaction([deleteOp, createOp]);
    } else if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      // Fetch user roles (run before batch transaction)
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, role: true },
      });

      const userProyeks = users.map((u) => ({
        proyekId,
        userId: u.id,
        role: u.role === 'Project Manager' ? 'Project Manager' : 'Anggota Lapangan',
      }));

      const createOp = prisma.userProyek.createMany({
        data: userProyeks,
      });

      await prisma.$transaction([deleteOp, createOp]);
    } else {
      await deleteOp;
    }

    // Audit trail
    if (direktorId) {
      await prisma.auditTrail.create({
        data: {
          userId: parseInt(direktorId, 10),
          aksi: 'assign_project_members',
          detail: `Direktur mengatur ulang anggota proyek ${project.nama} (${(members || userIds || []).length} orang)`,
        },
      });
    }

    return NextResponse.json({ message: 'Anggota proyek berhasil diperbarui' }, { status: 200 });
  } catch (error: any) {
    console.error('Update project members error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
