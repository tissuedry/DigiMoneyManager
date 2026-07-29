import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// 👇 BARIS INI WAJIB ADA AGAR NEXT.JS TIDAK NGE-CACHE HASILNYA 👇
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');
    
    // Asumsi: Endpoint ini bisa diakses oleh role yang sesuai
    if (role && role !== 'Direktur / Manajemen') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // 1. Ambil parameter dari URL (page dan limit)
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'Semua';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '4', 10);

    // 2. Tentukan filter kondisi (search dan status)
    const whereCondition: any = {};
    if (status !== 'Semua') {
      whereCondition.status = status;
    }
    if (search) {
      whereCondition.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 3. Hitung data yang harus dilewati (skip)
    const skip = (page - 1) * limit;

    // 4. Ambil total data & data list secara bersamaan
    const [totalItems, proyekList] = await prisma.$transaction([
      prisma.proyek.count({ where: whereCondition }),
      prisma.proyek.findMany({
        where: whereCondition,
        skip: skip,
        take: limit, // <--- Perintah ini yang memotong data jadi 4
        orderBy: { id: 'desc' },
        include: {
          budget: true, // <--- Penting agar FE bisa menampilkan nominal rupiah
          users: true,  // <--- Opsional, jika FE butuh data user/members
        }
      })
    ]);

    // 5. Kirim data dan metadata pagination ke Frontend
    return NextResponse.json({ 
      projects: proyekList,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error: any) {
    console.error('Get proyek error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}