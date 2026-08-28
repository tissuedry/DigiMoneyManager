import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { clearCache } from '@/lib/route-cache';

export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');

    if (role !== 'Direktur / Manajemen' && role !== 'Superadmin' && role !== 'superadmin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));
    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role') || '';

    const where: any = {};
    if (search.trim()) {
      where.OR = [
        { nama: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }
    if (roleFilter && roleFilter !== 'Semua') {
      where.role = roleFilter;
    }

    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
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
        skip,
        take: limit,
      }),
    ]);

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

    const hasMore = page * limit < total;

    return NextResponse.json({
      members: mapped,
      total,
      page,
      limit,
      hasMore,
    });

  } catch (error: any) {
    console.error('Get members error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');

    if (role !== 'Direktur / Manajemen' && role !== 'Superadmin' && role !== 'superadmin') {
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

    const adminId = req.headers.get('x-user-id');
    if (adminId) {
      await prisma.auditTrail.create({
        data: {
          userId: parseInt(adminId, 10),
          aksi: 'register_member',
          detail: `${role === 'Superadmin' || role === 'superadmin' ? 'Super Admin' : 'Direktur'} mendaftarkan anggota baru: ${nama} (${userRole})`,
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

export async function PUT(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');

    if (role !== 'Direktur / Manajemen' && role !== 'Superadmin' && role !== 'superadmin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, nama, email, userRole, divisi, proyekIds, proyekAssignments } = body;

    if (!userId || !nama || !email || !userRole) {
      return NextResponse.json({ message: 'UserId, nama, email, dan role wajib diisi' }, { status: 400 });
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(userId, 10) },
      include: {
        proyek: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ message: 'Anggota tidak ditemukan' }, { status: 404 });
    }

    if (trimmedEmail !== existingUser.email) {
      const duplicate = await prisma.user.findUnique({ where: { email: trimmedEmail } });

      if (duplicate) {
        return NextResponse.json({ message: 'Email sudah terdaftar oleh pengguna lain' }, { status: 400 });
      }
    }

    const namaUnchanged = existingUser.nama === nama.trim();
    const emailUnchanged = existingUser.email === trimmedEmail;
    const roleUnchanged = existingUser.role === userRole;

    const existingProyekMap = new Map(existingUser.proyek.map((p) => [p.proyekId, p.role]));
    const currentAssignments: { proyekId: number; role: string }[] = proyekAssignments && Array.isArray(proyekAssignments)
      ? proyekAssignments.map((pa: any) => ({
        proyekId: parseInt(pa.proyekId, 10),
        role: pa.role || (userRole === 'Project Manager' ? 'Project Manager' : 'Anggota Lapangan'),
      }))
      : (proyekIds && Array.isArray(proyekIds)
        ? proyekIds.map((pid: any) => ({
          proyekId: parseInt(pid, 10),
          role: userRole === 'Project Manager' ? 'Project Manager' : 'Anggota Lapangan',
        }))
        : []);

    let assignmentsUnchanged = existingProyekMap.size === currentAssignments.length;
    if (assignmentsUnchanged) {
      for (const curr of currentAssignments) {
        if (!existingProyekMap.has(curr.proyekId) || existingProyekMap.get(curr.proyekId) !== curr.role) {
          assignmentsUnchanged = false;
          break;
        }
      }
    }

    if (namaUnchanged && emailUnchanged && roleUnchanged && assignmentsUnchanged) {
      return NextResponse.json({ message: 'Tidak ada perubahan data. Anggota sudah memiliki role tersebut pada proyek terkait.' }, { status: 400 });
    }

    if (proyekAssignments && Array.isArray(proyekAssignments)) {
      const pmAsses = proyekAssignments.filter((pa: any) => pa.role === 'Project Manager');
      for (const pmAss of pmAsses) {
        const targetProyekId = parseInt(pmAss.proyekId, 10);
        const existingProjectPm = await prisma.userProyek.findFirst({
          where: {
            proyekId: targetProyekId,
            role: 'Project Manager',
            userId: { not: parseInt(userId, 10) },
          },
          include: { user: true, proyek: true },
        });
        if (existingProjectPm) {
          return NextResponse.json({
            message: `Proyek '${existingProjectPm.proyek.nama}' sudah memiliki Project Manager (${existingProjectPm.user.nama}). Setiap proyek hanya boleh memiliki satu Project Manager.`,
          }, { status: 400 });
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId, 10) },
      data: {
        nama,
        email: trimmedEmail,
        role: userRole,
      },
    });

    await prisma.userProyek.deleteMany({
      where: { userId: parseInt(userId, 10) },
    });
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

    const adminId = req.headers.get('x-user-id');
    if (adminId) {
      await prisma.auditTrail.create({
        data: {
          userId: parseInt(adminId, 10),
          aksi: 'update_member',
          detail: `${role === 'Superadmin' || role === 'superadmin' ? 'Super Admin' : 'Direktur'} memperbarui data anggota: ${nama} (${userRole})`,
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