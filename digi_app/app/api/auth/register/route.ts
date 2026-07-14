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

    const trimmedEmail = email;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        nama,
        email: trimmedEmail,
        passwordHash: hashedPassword,
        role,
      },
    });

    if (proyekId) {
      await prisma.userProyek.create({
        data: {
          userId: user.id,
          proyekId: typeof proyekId === 'number' ? proyekId : parseInt(proyekId, 10),
          role: role === 'Project Manager' ? 'Project Manager' : 'Anggota Lapangan',
        },
      });
    }

    // Create an audit trail log
    await prisma.auditTrail.create({
      data: {
        userId: user.id,
        aksi: 'register',
        detail: `User ${nama} terdaftar dengan role ${role}.`,
      },
    });

    // Don't return password
    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json({ message: 'User registered successfully', user: userWithoutPassword }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
