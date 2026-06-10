import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Retrieve a project with its full budget, expenses, and budget items
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const project = await prisma.proyek.findUnique({
      where: { id },
      include: {
        budget: {
          include: {
            posAnggaran: true,
          },
        },
        users: {
          select: {
            id: true,
            nama: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error: any) {
    console.error('Fetch project detail error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
