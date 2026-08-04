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
        role, // Role utama (termasuk Super Admin) disimpan di sini
      },
    });

    if (proyekId) {
      // PERUBAHAN: Menyesuaikan pemetaan role pada proyek agar role manajerial/admin tidak turun menjadi Anggota Lapangan
      let projectRole = 'Anggota Lapangan';
      if (role === 'Project Manager') {
        projectRole = 'Project Manager';
      } else if (role === 'Superadmin' || role === 'superadmin') {
        projectRole = 'Super Admin';
      } else if (role === 'Direktur / Manajemen' || role === 'Tim Keuangan') {
        projectRole = role;
      }

      await prisma.userProyek.create({
        data: {
          userId: user.id,
          proyekId: typeof proyekId === 'number' ? proyekId : parseInt(proyekId, 10),
          role: projectRole,
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