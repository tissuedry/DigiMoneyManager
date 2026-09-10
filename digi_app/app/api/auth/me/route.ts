import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken, resolveUserRoles } from '@/lib/auth';
import { getCached, setCache } from '@/lib/route-cache';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: No user session found' }, { status: 401 });
    }

    const cacheKey = `me:${userId}`;
    const cached = getCached(cacheKey);
    if (cached) {
      const cachedUser = cached as any;
      const token = signToken({
        id: cachedUser.id,
        nama: cachedUser.nama,
        email: cachedUser.email,
        role: cachedUser.role,
        roles: cachedUser.roles,
        proyekId: cachedUser.proyekId,
      });
      const resp = NextResponse.json({ user: cachedUser });
      resp.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      });
      return resp;
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId, 10) },
      include: {
        proyek: {
          include: {
            proyek: true,
          },
        },
      },
    });

    if (!user) {
      const response = NextResponse.json({ message: 'Unauthorized: User not found in database' }, { status: 401 });
      response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
      return response;
    }

    const assignments = user.proyek.map((up: any) => ({
      proyekId: up.proyekId,
      nomorRegister: up.proyek.nomorRegister,
      nama: up.proyek.nama,
      status: up.proyek.status,
      role: up.role === 'Anggota Lapangan' ? 'Karyawan' : up.role,
      divisi: up.divisi,
    }));

    const activeProyekIdHeader = req.headers.get('x-user-proyek-id');
    const requestedProyekId = activeProyekIdHeader ? parseInt(activeProyekIdHeader, 10) : null;

    const { primaryRole, allowedRoles, activeProyekId } = resolveUserRoles(
      user.role,
      user.proyek,
      requestedProyekId
    );

    const activeProjectAssignment = activeProyekId !== null
      ? user.proyek.find((up: any) => up.proyekId === activeProyekId)
      : null;
    const userProyekDetails = activeProjectAssignment ? activeProjectAssignment.proyek : null;

    const { passwordHash: _, proyek: _proyekRelations, ...userWithoutPassword } = user;
    const responseUser = {
      ...userWithoutPassword,
      role: primaryRole,
      roles: allowedRoles,
      proyek: userProyekDetails,
      proyekId: activeProyekId,
      divisi: activeProjectAssignment?.divisi || null,
      assignments,
    };

    setCache(cacheKey, responseUser);

    const token = signToken({
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: primaryRole,
      roles: allowedRoles,
      proyekId: activeProyekId,
    });

    const response = NextResponse.json({ user: responseUser });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error: any) {
    console.error('Me endpoint error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}