import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { getCached, setCache } from '@/lib/route-cache';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: No user session found' }, { status: 401 });
    }

    // ponytail: cache per user — data rarely changes, called 2-5x per page load
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
        divisi: cachedUser.divisi,
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
      nama: up.proyek.nama,
      status: up.proyek.status,
      role: up.role === 'Anggota Lapangan' ? 'Karyawan' : up.role,
    }));

    const activeProyekIdHeader = req.headers.get('x-user-proyek-id');
    let activeProyekId = activeProyekIdHeader ? parseInt(activeProyekIdHeader, 10) : null;

    let primaryRole = user.role;
    const rolesSet = new Set<string>();

    if (user.role === 'Direktur / Manajemen' || user.role === 'Tim Keuangan') {
      rolesSet.add(user.role);
    } else {
      const hasPM = user.proyek.some((up: any) => up.role === 'Project Manager');
      const hasKaryawan = user.proyek.some((up: any) => up.role === 'Anggota Lapangan') || !hasPM;

      if (hasPM) rolesSet.add('Project Manager');
      if (hasKaryawan) rolesSet.add('Karyawan');

      if (activeProyekId !== null) {
        const activeAssignment = user.proyek.find((up: any) => up.proyekId === activeProyekId);
        if (activeAssignment) {
          primaryRole = activeAssignment.role === 'Anggota Lapangan' ? 'Karyawan' : 'Project Manager';
        } else {
          activeProyekId = null;
          primaryRole = hasPM ? 'Project Manager' : 'Karyawan';
        }
      } else {
        primaryRole = hasPM ? 'Project Manager' : 'Karyawan';
      }
    }
    const allowedRoles = Array.from(rolesSet);

    const activeProjectAssignment = activeProyekId !== null
      ? user.proyek.find((up: any) => up.proyekId === activeProyekId)
      : null;
    const userProyekDetails = activeProjectAssignment ? activeProjectAssignment.proyek : null;

    const { passwordHash: _, proyek: __, ...userWithoutPassword } = user;
    const responseUser = {
      ...userWithoutPassword,
      role: primaryRole,
      roles: allowedRoles,
      proyek: userProyekDetails,
      proyekId: activeProyekId,
      assignments,
    };

    // Cache the resolved user object (without password) for 60s
    setCache(cacheKey, responseUser);

    // Re-sign JWT Token to keep session current with database updates
    const token = signToken({
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: primaryRole,
      roles: allowedRoles,
      proyekId: activeProyekId,
      divisi: user.divisi,
    });

    const response = NextResponse.json({ user: responseUser });

    // Set token in Cookie (httpOnly, secure, lax, expires in 24h)
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error('Me endpoint error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
