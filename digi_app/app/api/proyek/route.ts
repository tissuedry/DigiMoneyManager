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
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '4', 10);

    const cacheKey = `proyek:${urlRole}:${userId || 'anon'}:search=${search}:status=${status}:page=${page}:limit=${limit}`;
    const cached = getCached(cacheKey);
    if (cached) return NextResponse.json(cached);

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

    // Logika Search: Mencari berdasarkan kolom 'nama' atau 'id'
    let searchFilter: any = {};
    if (search) {
      searchFilter = {
        OR: [
          { nama: { contains: search, mode: 'insensitive' } },
          ...(isNaN(Number(search)) ? [] : [{ id: parseInt(search, 10) }]),
        ],
      };
    }

    // Logika Filter Status Tab
    let statusFilter: any = {};
    if (status && status !== 'Semua') {
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

    const skip = (page - 1) * limit;

    const [totalItems, projects] = await prisma.$transaction([
      prisma.proyek.count({ where: finalWhere }),
      prisma.proyek.findMany({
        where: finalWhere,
        skip: skip,
        take: limit,
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
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { tanggalMulai: 'desc' },
      })
    ]);

    // Mapping budget (Tetap sama seperti kodemu aslinya)
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
            nominalTerpakai: String(
              m.subAnggaran.reduce(
                (sum: number, sub: any) =>
                  sum +
                  sub.keterangan.reduce(
                    (s: number, ket: any) => s + Number(ket.nominalRealisasi || 0),
                    0
                  ),
                0
              )
            ),
          })),
        },
      };
    });

    const responseData = { 
      projects: mappedProjects,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit
      }
    };

    // Simpan ke cache lalu return
    setCache(cacheKey, responseData);
    return NextResponse.json(responseData);

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