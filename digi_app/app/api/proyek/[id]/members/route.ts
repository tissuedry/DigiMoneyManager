import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

async function verifyIsProjectManagerOf(userId: string | null, proyekId: number) {
  if (!userId) return false;
  const up = await prisma.userProyek.findFirst({
    where: { userId: parseInt(userId, 10), proyekId, role: 'Project Manager' },
  });
  return !!up;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id');
    const { id: proyekIdStr } = await params;
    const proyekId = parseInt(proyekIdStr, 10);

    if (!(await verifyIsProjectManagerOf(userId, proyekId))) {
      return NextResponse.json(
        { message: 'Forbidden: Only the assigned Project Manager can access project members' },
        { status: 403 },
      );
    }

    const members = await prisma.userProyek.findMany({
      where: { proyekId },
      include: {
        user: { select: { id: true, nama: true, email: true, role: true } },
      },
    });

    const mapped = members.map((m) => ({
      id: m.user.id,
      nama: m.user.nama,
      email: m.user.email,
      role: m.user.role,
      divisi: m.divisi,
      roleInProyek: m.role,
    }));

    return NextResponse.json({ members: mapped });
  } catch (error) {
    console.error('Get project member error: ', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Internal Server Error', error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id');
    const { id: proyekIdStr } = await params;
    const proyekId = parseInt(proyekIdStr, 10);

    if (!(await verifyIsProjectManagerOf(userId, proyekId))) {
      return NextResponse.json(
        { message: 'Forbidden: Only the assigned Project Manager can manage project members' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { userIds, members } = body;

    if ((!userIds || !Array.isArray(userIds)) && (!members || !Array.isArray(members))) {
      return NextResponse.json({ message: 'userIds or members array is required' }, { status: 400 });
    }

    // Guard: prevent empty arrays from deleting all members
    const memberArray = (Array.isArray(members) ? members : []) as { userId: number | string; role: string; divisi?: string }[];
    const userIdArray = (Array.isArray(userIds) && !members) ? userIds as number[] : [];
    const hasMembers = memberArray.length > 0;
    const hasUserIds = userIdArray.length > 0;

    if (!hasMembers && !hasUserIds) {
      return NextResponse.json({ message: 'members or userIds must not be empty' }, { status: 400 });
    }

    // Guard: PM cannot remove themselves
    const pmUserId = userId ? parseInt(userId, 10) : 0;
    if (hasMembers && pmUserId) {
      const pmInNew = memberArray.some((m) =>
        (typeof m.userId === 'string' ? parseInt(m.userId, 10) : m.userId) === pmUserId && m.role === 'Project Manager'
      );
      if (!pmInNew) {
        return NextResponse.json({ message: 'Cannot remove or demote yourself as Project Manager' }, { status: 400 });
      }
    }

    const projectName = userId
      ? (await prisma.proyek.findUnique({ where: { id: proyekId }, select: { nama: true } }))?.nama
      : undefined;

    const deleteOp = prisma.userProyek.deleteMany({ where: { proyekId } });

    if (hasMembers) {
      const userProyeks = memberArray.map((m) => ({
        proyekId,
        userId: typeof m.userId === 'string' ? parseInt(m.userId, 10) : m.userId,
        role: m.role,
        divisi: m.divisi || null,
      }));

      await prisma.$transaction([deleteOp, prisma.userProyek.createMany({ data: userProyeks })]);
    } else {
      // userIds path — preserve existing PM role
      const users = await prisma.user.findMany({
        where: { id: { in: userIdArray } },
        select: { id: true },
      });

      const userProyeks = users.map((u) => ({
        proyekId,
        userId: u.id,
        role: u.id === pmUserId ? 'Project Manager' : 'Anggota Lapangan',
      }));

      await prisma.$transaction([deleteOp, prisma.userProyek.createMany({ data: userProyeks })]);
    }

    if (userId && projectName) {
      const memberCount = hasMembers ? memberArray.length : userIdArray.length;
      await prisma.auditTrail.create({
        data: {
          userId: parseInt(userId, 10),
          aksi: 'assign_project_members',
          detail: `Project Manager mengatur ulang anggota proyek ${projectName} (${memberCount} orang)`,
        },
      });
    }

    return NextResponse.json({ message: 'Project members successfully updated!' }, { status: 200 });
  } catch (error) {
    console.error('Update project members error: ', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Internal Server Error', error: message }, { status: 500 });
  }
}
