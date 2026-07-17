import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: List all users (id + nama) for PM member assignment dropdown
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: { id: true, nama: true },
      orderBy: { nama: 'asc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get PM users error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
