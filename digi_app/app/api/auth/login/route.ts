import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const trimmedEmail = String(email).trim().toLowerCase();

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

    // Get user's project association
    const userProyek = await prisma.userProyek.findFirst({
      where: { userId: user.id },
    });
    const userProyekId = userProyek ? userProyek.proyekId : null;

    // Sign JWT Token
    const token = signToken({
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
      proyekId: userProyekId,
      divisi: user.divisi,
    });

    // Create audit trail log
    await prisma.auditTrail.create({
      data: {
        userId: user.id,
        aksi: 'login',
        detail: `User ${user.nama} berhasil login.`,
      },
    });

    // Don't return password
    const { passwordHash: _, ...userWithoutPassword } = user;
    const responseUser = {
      ...userWithoutPassword,
      proyekId: userProyekId,
    };

    // Create Response
    const response = NextResponse.json({
      message: 'Login successful',
      token,
      user: responseUser,
    });

    // Set token in Cookie (httpOnly, secure, lax, expires in 24h)
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
