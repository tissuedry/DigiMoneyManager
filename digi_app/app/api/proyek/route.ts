import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCached, setCache, clearCache } from '@/lib/route-cache';

// GET: Fetch all projects with budget information (filtered by user assignment for Karyawan and Project Manager)
export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');
    const userId = req.headers.get('x-user-id');

    const { searchParams } = new URL(req.url);
    const urlRole = searchParams.get('role') || role;

    // ponytail: cache per role+user
    const cacheKey = `proyek:${urlRole}:${userId || 'anon'}`;
    const cached = getCached(cacheKey);
    if (cached) return NextResponse.json(cached);

    // 💡 1. Menangkap query string yang dikirim oleh frontend
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    // Filter berdasarkan Role & User ID
    let roleFilter: any = {};
    if (userId) {
      if (urlRole === 'Karyawan') {
        roleFilter = {
          users: {
            some: {
              userId: parseInt(userId, 10),
              role: 'Anggota Lapangan',
            },
          },
        };
      } else if (urlRole === 'Project Manager') {
        roleFilter = {
          users: {
            some: {
              userId: parseInt(userId, 10),
              role: 'Project Manager',
            },
          },
        };
      }
    }

    // 💡 2. Logika Search: Mencari berdasarkan kolom 'nama' atau 'id'
    let searchFilter: any = {};
    if (search) {
      searchFilter = {
        OR: [
          { nama: { contains: search, mode: 'insensitive' } },
          ...(isNaN(Number(search)) ? [] : [{ id: parseInt(search, 10) }]),
        ],
      };
    }

    // 💡 3. Logika Filter Status Tab
    let statusFilter: any = {};
    if (status && status !== 'Semua') {
      // Mengubah ke uppercase agar cocok dengan data Enum/String di DB (Contoh: 'AKTIF', 'DONE')
      // Gantilah mapping string di bawah jika penamaan di database kamu berbeda
      let mappedStatus = status.toUpperCase();
      if (mappedStatus === 'ACTIVE') mappedStatus = 'AKTIF';
      if (mappedStatus === 'CANCELED') mappedStatus = 'CANCELED';
      statusFilter = {
        status: mappedStatus,
      };
    }

    // Menggabungkan semua filter ke dalam kondisi AND Prisma
    const finalWhere = {
      AND: [
        roleFilter,
        searchFilter,
        statusFilter
      ]
    };

    // Eksekusi query ke database Supabase via Prisma
    const projects = await prisma.proyek.findMany({
      where: finalWhere,
      include: {
        budget: {
          include: {
            mainAnggaran: true,
          },
        },
      },
      orderBy: { tanggalMulai: 'desc' },
    });

    const mappedProjects = projects.map((p) => {
      if (!p.budget) return p;
      return {
        ...p,
        budget: {
          ...p.budget,
          posAnggaran: p.budget.mainAnggaran.map((m: any) => ({
            ...m,
            deskripsi: m.namaMain,
            namaPos: m.namaMain,
          })),
        },
      };
    });

    setCache(cacheKey, { projects: mappedProjects });
    return NextResponse.json({ projects: mappedProjects });
  } catch (error: any) {
    console.error('Fetch projects error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}


// POST: Create a new project (PM or Tim Keuangan only)
export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');
    const rolesHeader = req.headers.get('x-user-roles') || role || '';
    const roles = rolesHeader.split(',');
    const userId = req.headers.get('x-user-id');

    if (!roles.includes('Project Manager') && !roles.includes('Tim Keuangan') && !roles.includes('Direktur / Manajemen')) {
      return NextResponse.json({ message: 'Forbidden: Unauthorized to create projects' }, { status: 403 });
    }

    const body = await req.json();
    const { nama, deskripsi, tanggalMulai, tanggalSelesai } = body;

    if (!nama || !tanggalMulai) {
      return NextResponse.json({ message: 'Nama and tanggalMulai are required' }, { status: 400 });
    }

    const newProject = await prisma.proyek.create({
      data: {
        nama,
        deskripsi: deskripsi || null,
        status: body.status || 'AKTIF',
        tanggalMulai: new Date(tanggalMulai),
        tanggalSelesai: tanggalSelesai ? new Date(tanggalSelesai) : null,
      },
    });

    if (userId) {
      await prisma.auditTrail.create({
        data: {
          userId: parseInt(userId, 10),
          aksi: 'create_proyek',
          detail: `Membuat proyek baru: ${nama}`,
        },
      });
    }

    clearCache('proyek:');
    clearCache('dashboard:');
    return NextResponse.json({ message: 'Project created successfully', proyek: newProject }, { status: 201 });
  } catch (error: any) {
    console.error('Create project error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
