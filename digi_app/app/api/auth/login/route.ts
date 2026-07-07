import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';
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

    const trimmedEmail = email;

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

    // Get user's project associations and roles
    const userProyeks = await prisma.userProyek.findMany({
      where: { userId: user.id },
    });
    const userProyekId = userProyeks.length > 0 ? userProyeks[0].proyekId : null;

    // Map project roles dynamically for regular members
    const rolesSet = new Set<string>();
    let primaryRole = user.role;

    if (user.role === 'Direktur / Manajemen' || user.role === 'Tim Keuangan') {
      rolesSet.add(user.role);
    } else {
      const hasPM = userProyeks.some((up: any) => up.role === 'Project Manager');
      const hasKaryawan = userProyeks.some((up: any) => up.role === 'Anggota Lapangan') || !hasPM;

      if (hasPM) rolesSet.add('Project Manager');
      if (hasKaryawan) rolesSet.add('Karyawan');
      
      primaryRole = hasPM ? 'Project Manager' : 'Karyawan';
    }
    const allowedRoles = Array.from(rolesSet);

    // Sign JWT Token
    const token = signToken({
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: primaryRole,
      roles: allowedRoles,
      proyekId: null, // Force selection on select-project screen
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
