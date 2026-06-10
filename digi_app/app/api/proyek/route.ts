import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch all projects with budget information
export async function GET(req: NextRequest) {
  try {
    const projects = await prisma.proyek.findMany({
      include: {
        budget: {
          include: {
            posAnggaran: true,
          },
        },
      },
      orderBy: { tanggalMulai: 'desc' },
    });
    return NextResponse.json({ projects });
  } catch (error: any) {
    console.error('Fetch projects error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// POST: Create a new project (PM or Tim Keuangan only)
export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');
    const userId = req.headers.get('x-user-id');

    if (role !== 'Project Manager' && role !== 'Tim Keuangan') {
      return NextResponse.json({ message: 'Forbidden: Only Project Manager or Tim Keuangan can create projects' }, { status: 403 });
    }

    const body = await req.json();
    const { nama, deskripsi, tanggalMulai, tanggalSelesai } = body;

    if (!nama || !tanggalMulai) {
      return NextResponse.json({ message: 'Nama and tanggalMulai are required' }, { status: 400 });
    }

    const newProject = await prisma.proyek.create({
      data: {
        nama,
        deskripsi: deskripsi || null,
        status: 'AKTIF',
        tanggalMulai: new Date(tanggalMulai),
        tanggalSelesai: tanggalSelesai ? new Date(tanggalSelesai) : null,
      },
    });

    if (userId) {
      await prisma.auditTrail.create({
        data: {
          userId,
          aksi: 'create_proyek',
          detail: `Membuat proyek baru: ${nama}`,
        },
      });
    }

    return NextResponse.json({ message: 'Project created successfully', proyek: newProject }, { status: 201 });
  } catch (error: any) {
    console.error('Create project error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
