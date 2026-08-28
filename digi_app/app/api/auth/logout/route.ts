import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    const numericUserId = userId ? parseInt(userId, 10) : null;
    if (numericUserId && !isNaN(numericUserId)) {
      const user = await prisma.user.findUnique({
        where: { id: numericUserId },
        select: { nama: true },
      });
      if (user) {
        await prisma.auditTrail.create({
          data: {
            userId: numericUserId,
            aksi: 'logout',
            detail: `User ${user.nama} logout dari sistem.`,
          },
        });
      }
    }

    const response = NextResponse.json({ message: 'Logout successful' });
    
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error: any) {
    console.error('Logout endpoint error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
