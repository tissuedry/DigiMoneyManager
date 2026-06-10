import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: No user session found' }, { status: 401 });
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

    const firstUserProyek = user.proyek[0];
    const userProyekDetails = firstUserProyek ? firstUserProyek.proyek : null;
    const userProyekId = firstUserProyek ? firstUserProyek.proyekId : null;

    const { passwordHash: _, proyek: __, ...userWithoutPassword } = user;
    const responseUser = {
      ...userWithoutPassword,
      proyek: userProyekDetails,
      proyekId: userProyekId,
    };

    return NextResponse.json({ user: responseUser });
  } catch (error: any) {
    console.error('Me endpoint error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
