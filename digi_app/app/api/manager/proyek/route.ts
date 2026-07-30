import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');
    
    if (role && role !== 'Direktur / Manajemen') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'Semua';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '4', 10);

    const whereCondition: any = {};
    if (status !== 'Semua') {
      whereCondition.status = status;
    }
    if (search) {
      whereCondition.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [totalItems, proyekList] = await prisma.$transaction([
      prisma.proyek.count({ where: whereCondition }),
      prisma.proyek.findMany({
        where: whereCondition,
        skip: skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          budget: true,
          users: true,
        }
      })
    ]);

    return NextResponse.json({ 
      projects: proyekList,
      proyek: proyekList,
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