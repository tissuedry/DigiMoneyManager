import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { clearCache } from '@/lib/route-cache';

// GET: List all members (users) with their project assignments
export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');

    if (role !== 'Direktur / Manajemen') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        proyek: {
          include: {
            proyek: {
              select: { id: true, nama: true, status: true },
            },
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    const mapped = users.map((u) => {
      const firstDivisi = u.proyek.find(up => up.divisi !== null)?.divisi || null;
      return {
        id: u.id,
        nama: u.nama,
        email: u.email,
        role: u.role,
        divisi: firstDivisi,
        proyek: u.proyek.map((up) => ({
          id: up.proyek.id,
          nama: up.proyek.nama,
          status: up.proyek.status,
          roleInProyek: up.role,
          divisi: up.divisi,
        })),
      };
    });

    return NextResponse.json({ members: mapped });
  } catch (error: any) {
    console.error('Get members error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// POST: Register a new member (with support for multiple projects)
export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');

    if (role !== 'Direktur / Manajemen') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { nama, email, password, userRole, divisi, proyekId, proyekIds, proyekAssignments } = body;

    if (!nama || !email || !password || !userRole) {
      return NextResponse.json({ message: 'Nama, email, password, dan role wajib diisi' }, { status: 400 });
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existing) {
      return NextResponse.json({ message: 'Email sudah terdaftar' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        nama,
        email: trimmedEmail,
        passwordHash: hashedPassword,
        role: userRole,
      },
    });

    // Associate with projects if projects are given
    if (proyekAssignments && Array.isArray(proyekAssignments) && proyekAssignments.length > 0) {
      const userProyeks = proyekAssignments.map((pa: any) => ({
        userId: newUser.id,
        proyekId: parseInt(pa.proyekId, 10),
        role: pa.role || (userRole === 'Project Manager' ? 'Project Manager' : 'Anggota Lapangan'),
        divisi: divisi || null,
      }));
      await prisma.userProyek.createMany({
        data: userProyeks,
      });
    } else if (proyekIds && Array.isArray(proyekIds) && proyekIds.length > 0) {
      const userProyeks = proyekIds.map((pid: any) => ({
        userId: newUser.id,
        proyekId: parseInt(pid, 10),
        role: userRole === 'Project Manager' ? 'Project Manager' : 'Anggota Lapangan',
        divisi: divisi || null,
      }));
      await prisma.userProyek.createMany({
        data: userProyeks,
      });
    } else if (proyekId) {
      await prisma.userProyek.create({
        data: {
          userId: newUser.id,
          proyekId: parseInt(proyekId, 10),
          role: userRole === 'Project Manager' ? 'Project Manager' : 'Anggota Lapangan',
          divisi: divisi || null,
        },
      });
    }

    // Audit trail
    const direktorId = req.headers.get('x-user-id');
    if (direktorId) {
      await prisma.auditTrail.create({
        data: {
          userId: parseInt(direktorId, 10),
          aksi: 'register_member',
          detail: `Direktur mendaftarkan anggota baru: ${nama} (${userRole})`,
        },
      });
    }

    const { passwordHash: _, ...userWithoutPassword } = newUser;
    clearCache('dashboard:');
    return NextResponse.json({ message: 'Anggota berhasil didaftarkan', user: userWithoutPassword }, { status: 201 });
  } catch (error: any) {
    console.error('Register member error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// PUT: Update an existing member's details and project assignments
export async function PUT(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');

    if (role !== 'Direktur / Manajemen') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, nama, email, userRole, divisi, proyekIds, proyekAssignments } = body;

    if (!userId || !nama || !email || !userRole) {
      return NextResponse.json({ message: 'UserId, nama, email, dan role wajib diisi' }, { status: 400 });
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { id: parseInt(userId, 10) } });
    if (!existingUser) {
      return NextResponse.json({ message: 'Anggota tidak ditemukan' }, { status: 404 });
    }

    // Check email uniqueness if email has changed
    if (trimmedEmail !== existingUser.email) {
      const duplicate = await prisma.user.findUnique({ where: { email: trimmedEmail } });
      if (duplicate) {
        return NextResponse.json({ message: 'Email sudah terdaftar oleh pengguna lain' }, { status: 400 });
      }
    }

    // Update user details
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId, 10) },
      data: {
        nama,
        email: trimmedEmail,
        role: userRole,
      },
    });

    // Delete existing project assignments
    await prisma.userProyek.deleteMany({
      where: { userId: parseInt(userId, 10) },
    });

    // Create new project assignments
    if (proyekAssignments && Array.isArray(proyekAssignments) && proyekAssignments.length > 0) {
      const userProyeks = proyekAssignments.map((pa: any) => ({
        userId: parseInt(userId, 10),
        proyekId: parseInt(pa.proyekId, 10),
        role: pa.role || (userRole === 'Project Manager' ? 'Project Manager' : 'Anggota Lapangan'),
        divisi: divisi || null,
      }));
      await prisma.userProyek.createMany({
        data: userProyeks,
      });
    } else if (proyekIds && Array.isArray(proyekIds) && proyekIds.length > 0) {
      const userProyeks = proyekIds.map((pid: any) => ({
        userId: parseInt(userId, 10),
        proyekId: parseInt(pid, 10),
        role: userRole === 'Project Manager' ? 'Project Manager' : 'Anggota Lapangan',
        divisi: divisi || null,
      }));
      await prisma.userProyek.createMany({
        data: userProyeks,
      });
    }

    // Audit trail
    const direktorId = req.headers.get('x-user-id');
    if (direktorId) {
      await prisma.auditTrail.create({
        data: {
          userId: parseInt(direktorId, 10),
          aksi: 'update_member',
          detail: `Direktur memperbarui data anggota: ${nama} (${userRole})`,
        },
      });
    }

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    clearCache('dashboard:');
    return NextResponse.json({ message: 'Data anggota berhasil diperbarui', user: userWithoutPassword }, { status: 200 });
  } catch (error: any) {
    console.error('Update member error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
