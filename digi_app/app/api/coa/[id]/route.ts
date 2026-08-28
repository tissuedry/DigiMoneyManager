import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearCache } from '@/lib/route-cache';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }

    if (role !== 'Tim Keuangan' && role !== 'Superadmin' && role !== 'superadmin') {
      return NextResponse.json({ message: 'Forbidden: Only Tim Keuangan and Super Admin can manage Chart of Accounts' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { namaAkun, nama } = body;
    const targetName = namaAkun || nama;
    const subId = parseInt(id.replace('COA-', ''), 10);

    const existing = await prisma.masterSub.findUnique({
      where: { id: subId },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Chart of Accounts not found' }, { status: 404 });
    }

    const updated = await prisma.masterSub.update({
      where: { id: subId },
      data: {
        nama: targetName || existing.nama,
      },
    });

    clearCache('coa');

    await prisma.auditTrail.create({
      data: {
        userId: numericUserId,
        aksi: 'update_coa',
        detail: `Mengubah Akun (${existing.tipe || 'Akun'}): ${existing.nama} -> ${updated.nama}`,
      },
    });

    return NextResponse.json({ message: 'Chart of Accounts updated successfully', coa: updated });

  } catch (error: any) {
    console.error('Update CoA error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }

    if (role !== 'Tim Keuangan' && role !== 'Superadmin' && role !== 'superadmin') {
      return NextResponse.json({ message: 'Forbidden: Only Tim Keuangan and Super Admin can manage Chart of Accounts' }, { status: 403 });
    }

    const { id } = await params;
    const subId = parseInt(id.replace('COA-', ''), 10);

    const existing = await prisma.masterSub.findUnique({
      where: { id: subId },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Chart of Accounts not found' }, { status: 404 });
    }

    await prisma.masterSub.delete({
      where: { id: subId },
    });

    clearCache('coa');

    await prisma.auditTrail.create({
      data: {
        userId: numericUserId,
        aksi: 'delete_coa',
        detail: `Menghapus Akun (${existing.tipe || 'Akun'}): ${existing.nama}`,
      },
    });

    return NextResponse.json({ message: 'Chart of Accounts deleted successfully' });
    
  } catch (error: any) {
    console.error('Delete CoA error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}