import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { clearCache } from '@/lib/route-cache';

export async function POST(req: NextRequest) {
  try {
    const userIdStr = req.headers.get('x-user-id');
    if (!userIdStr) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = parseInt(userIdStr, 10);

    const body = await req.json();
    const { proyekId } = body;

    if (!proyekId) {
      return NextResponse.json({ message: 'Proyek ID wajib diisi' }, { status: 400 });
    }

    const targetProyekId = parseInt(proyekId, 10);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        proyek: {
          where: { proyekId: targetProyekId },
          include: { proyek: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });
    }

    const allUserProyeks = await prisma.userProyek.findMany({
      where: { userId },
    });

    const rolesSet = new Set<string>();
    if (user.role === 'Direktur / Manajemen' || user.role === 'Tim Keuangan') {
      rolesSet.add(user.role);
    } else {
      const hasPM = allUserProyeks.some((up: any) => up.role === 'Project Manager');
      const hasKaryawan = allUserProyeks.some((up: any) => up.role === 'Anggota Lapangan') || !hasPM;

      if (hasPM) rolesSet.add('Project Manager');
      if (hasKaryawan) rolesSet.add('Karyawan');
    }
    const allowedRoles = Array.from(rolesSet);

    let primaryRole = user.role;
    if (user.role !== 'Direktur / Manajemen' && user.role !== 'Tim Keuangan') {
      const assignment = user.proyek[0];
      if (!assignment) {
        return NextResponse.json({ message: 'Anda tidak ditugaskan pada proyek ini' }, { status: 403 });
      }
      primaryRole = assignment.role === 'Anggota Lapangan' ? 'Karyawan' : 'Project Manager';
    }

    const token = signToken({
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: primaryRole,
      roles: allowedRoles,
      proyekId: targetProyekId,
    });

    clearCache(`me:${userIdStr}`);
    clearCache('dashboard:');
    clearCache('proyek:');
    clearCache('reimb:');
    const redirectUrl = primaryRole === 'Project Manager' ? '/pm' : '/karyawan';
    const response = NextResponse.json({
      message: 'Project selected successfully',
      redirectUrl,
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error: any) {
    console.error('Select project error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
