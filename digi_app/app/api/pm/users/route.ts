import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    const role = req.headers.get('x-user-role');
    
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (
      role !== 'Project Manager' && 
      role !== 'Direktur / Manajemen' && 
      role !== 'Superadmin' && 
      role !== 'superadmin'
    ) 
    {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
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