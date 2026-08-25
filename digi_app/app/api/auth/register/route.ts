import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ 
        message: 'Invalid input parameters', 
        errors: result.error.flatten().fieldErrors 
      }, { status: 400 });
    }
    const { nama, email, password, role, proyekId } = result.data;

    const trimmedEmail = email.trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const safeRole = (role || '').trim();
    const roleLower = safeRole.toLowerCase();
    let normalizedRole = safeRole;

    if (roleLower === 'superadmin' || roleLower === 'super admin') {
      normalizedRole = 'Superadmin';
    }

    const user = await prisma.user.create({
      data: {
        nama,
        email: trimmedEmail,
        passwordHash: hashedPassword,
        role: normalizedRole,
      },
    });

    if (proyekId) {
      let projectRole = 'Anggota Lapangan';
      if (normalizedRole === 'Project Manager') {
        projectRole = 'Project Manager';
      } else if (normalizedRole === 'Superadmin') {
        projectRole = 'Superadmin';
      } else if (normalizedRole === 'Direktur / Manajemen' || normalizedRole === 'Tim Keuangan') {
        projectRole = normalizedRole;
      }

      await prisma.userProyek.create({
        data: {
          userId: user.id,
          proyekId: typeof proyekId === 'number' ? proyekId : parseInt(proyekId, 10),
          role: projectRole,
        },
      });
    }

    await prisma.auditTrail.create({
      data: {
        userId: user.id,
        aksi: 'register',
        detail: `User ${nama} terdaftar dengan role ${normalizedRole}.`,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json({ message: 'User registered successfully', user: userWithoutPassword }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}