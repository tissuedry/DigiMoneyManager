import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT: Update a pemasukan account (MasterSub)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    const userId = req.headers.get('x-user-id');

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

    if (userId) {
      await prisma.auditTrail.create({
        data: {
          userId: parseInt(userId, 10),
          aksi: 'update_coa',
          detail: `Mengubah Akun Pemasukan: ${existing.nama} -> ${updated.nama}`,
        },
      });
    }

    return NextResponse.json({ message: 'Chart of Accounts updated successfully', coa: updated });

  } catch (error: any) {
    console.error('Update CoA error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a pemasukan account (MasterSub)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    const userId = req.headers.get('x-user-id');

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

    if (userId) {
      await prisma.auditTrail.create({
        data: {
          userId: parseInt(userId, 10),
          aksi: 'delete_coa',
          detail: `Menghapus Akun Pemasukan: ${existing.nama}`,
        },
      });
    }

    return NextResponse.json({ message: 'Chart of Accounts deleted successfully' });
    
  } catch (error: any) {
    console.error('Delete CoA error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}