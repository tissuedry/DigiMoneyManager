import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearCache } from '@/lib/route-cache';

function isSuperAdmin(role: string | null) {
  return role === 'Super Admin' || role === 'Superadmin' || role === 'superadmin';
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    const adminId = req.headers.get('x-user-id');
    
    if (!isSuperAdmin(role)) {
      return NextResponse.json({ message: 'Forbidden: Hanya Super Admin yang dapat mengubah data master' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { type, nama, kode, tipe } = body;

    if (!type || !nama) {
      return NextResponse.json({ message: 'Type dan nama wajib diisi di dalam body' }, { status: 400 });
    }

    const targetId = parseInt(id, 10);
    const trimmedKode = kode !== undefined ? (kode && String(kode).trim() !== '' ? String(kode).trim() : null) : undefined;
    let updatedData;
    let detailAudit = '';

    if (type === 'main') {
      const updatePayload: any = { nama };
      if (tipe) updatePayload.tipe = tipe;
      if (trimmedKode !== undefined) updatePayload.kode = trimmedKode;
      updatedData = await prisma.masterMain.update({
        where: { id: targetId },
        data: updatePayload,
      });
      detailAudit = `Mengubah Master Main (ID: ${targetId}) menjadi: ${trimmedKode ? `(${trimmedKode}) ` : ''}${nama}`;

    } else if (type === 'sub') {
      const updatePayload: any = { nama };
      if (tipe) updatePayload.tipe = tipe;
      if (trimmedKode !== undefined) updatePayload.kode = trimmedKode;
      updatedData = await prisma.masterSub.update({
        where: { id: targetId },
        data: updatePayload,
      });
      detailAudit = `Mengubah Master Sub (ID: ${targetId}) menjadi: ${trimmedKode ? `(${trimmedKode}) ` : ''}${nama}`;

    } else {
      return NextResponse.json({ message: 'Tipe data master tidak valid' }, { status: 400 });
    }

    if (adminId) {
      await prisma.auditTrail.create({
        data: {
          userId: parseInt(adminId, 10),
          aksi: 'update_master_data',
          detail: `Super Admin - ${detailAudit}`,
        },
      });
    }

    clearCache('reimb:');
    clearCache('coa');

    return NextResponse.json({ message: 'Data master berhasil diperbarui', data: updatedData }, { status: 200 });

  } catch (error: any) {
    console.error('Update master data error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Data master tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    const adminId = req.headers.get('x-user-id');
    
    if (!isSuperAdmin(role)) {
      return NextResponse.json({ message: 'Forbidden: Hanya Super Admin yang dapat menghapus data master' }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); 

    if (!type) {
      return NextResponse.json({ message: 'Parameter type wajib disertakan (contoh: ?type=main)' }, { status: 400 });
    }

    const targetId = parseInt(id, 10);
    let detailAudit = '';

    if (type === 'main') {
      await prisma.masterMain.delete({ where: { id: targetId } });
      detailAudit = `Menghapus Master Main (ID: ${targetId})`;

    } else if (type === 'sub') {
      await prisma.masterSub.delete({ where: { id: targetId } });
      detailAudit = `Menghapus Master Sub (ID: ${targetId})`;

    } else {
      return NextResponse.json({ message: 'Tipe data master tidak valid' }, { status: 400 });
    }

    if (adminId) {
      await prisma.auditTrail.create({
        data: {
          userId: parseInt(adminId, 10),
          aksi: 'delete_master_data',
          detail: `Super Admin - ${detailAudit}`,
        },
      });
    }

    clearCache('reimb:');
    clearCache('coa');

    return NextResponse.json({ message: 'Data master berhasil dihapus' }, { status: 200 });

  } catch (error: any) {
    console.error('Delete master data error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Data master tidak ditemukan' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}