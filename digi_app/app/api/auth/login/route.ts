import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken, resolveUserRoles } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ 
        message: 'Invalid input parameters', 
        errors: result.error.flatten().fieldErrors 
      }, { status: 400 });
    }
    const { email, password } = result.data;

    // Bersihkan email dari spasi tidak sengaja
    const trimmedEmail = email.trim();

    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const userProyeks = await prisma.userProyek.findMany({
      where: { userId: user.id },
    });
    const userProyekId = userProyeks.length > 0 ? userProyeks[0].proyekId : null;

    const { primaryRole, allowedRoles } = resolveUserRoles(user.role, userProyeks);

    const token = signToken({
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: primaryRole,
      roles: allowedRoles,
      proyekId: userProyekId,
    });

    await prisma.auditTrail.create({
      data: {
        userId: user.id,
        aksi: 'login',
        detail: `User ${user.nama} berhasil login.`,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    const responseUser = {
      ...userWithoutPassword,
      role: primaryRole,
      proyekId: userProyekId,
    };

    const response = NextResponse.json({
      message: 'Login successful',
      token,
      user: responseUser,
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}