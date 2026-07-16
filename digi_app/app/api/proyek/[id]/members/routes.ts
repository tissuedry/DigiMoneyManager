import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    if (role !== 'PM') {
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
          },
        },
      },
    });

    const mapped = members.map((m) => ({
      id: m.user.id,
      nama: m.user.nama,
      email: m.user.email,
      role: m.user.role,
      divisi: m.divisi,
      roleinProyek: m.role,
    }));

    return NextResponse.json({ members: mapped });
  } catch (error: any) {
    console.error('Get project member error: ', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message}, {status: 500});
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    const editorId = req.headers.get('x-user-id');
    if (role !== 'PM') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id: proyekIdStr } = await params;
    const proyekId = parseInt(proyekIdStr, 10);

    const body = await req.json();
    const { userIds, members } = body;

    if ((!userIds && !Array.isArray(userIds)) && (!members && !Array.isArray(members))) {
      return NextResponse.json({ message: 'userIds or members array is required' }, {status: 400});
    }

    const proyek = await prisma.proyek.findUnique({ where: { id : proyekId } });
    if (!proyek) {
      return NextResponse.json({ message: 'Project not Found!' }, {status: 404});
    }

    const deleteOp = prisma.userProyek.deleteMany({
      where: { proyekId },
    });

    if (members && Array.isArray(members) && members.length > 0) {
      const userProyeks = members.map((m: any) => ({
        proyekId,
        userId: typeof m.userId === 'string' ? parseInt(m.userId, 10) : m.userId,
        role: m.role,
        divisi: m.divisi || '',
      }));

      const createOp = prisma.userProyek.createMany({
        data: userProyeks,
      });

      await prisma.$transaction([deleteOp, createOp]);
    } else if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      const users = await prisma.user.findMany({
        where: {id: { in: userIds } },
        select: { id: true, role: true }
      });

      const userProyeks = users.map((u) => ({
        proyekId,
        userId: u.id,
        role: 'Anggota Lapangan'
      }))

      const createOp = prisma.userProyek.createMany({
        data: userProyeks,
      });

      await prisma.$transaction([deleteOp, createOp]);
    } else {
      await deleteOp;
    }

    if (editorId) {
      await prisma.auditTrail.create({
        data: {
          userId: parseInt(editorId, 10),
          aksi: 'assign_project_members',
          detail: `Project Manager mengatur ulang anggota proyek ${proyek.nama} (${(members || userIds || []).length} orang)`,
        },
      });
    }

    return NextResponse.json({ message: 'Project members successfully updated!' }, { status: 200 });
  } catch (error: any) {
    console.log('Update project members error: ', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message}, { status: 500 });
  }
}