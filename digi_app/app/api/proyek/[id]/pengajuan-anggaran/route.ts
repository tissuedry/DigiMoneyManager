import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

async function verifyCanAccessPengajuan(userId: string | null, userRole: string | null, proyekId: number) {
  if (
    userRole === 'Direktur / Manajemen' ||
    userRole === 'Superadmin' ||
    userRole === 'superadmin'
  ) 
  {
    return true;
  }
  
  if (!userId) return false;
  
  const up = await prisma.userProyek.findFirst({
    where: { userId: parseInt(userId, 10), proyekId, role: 'Project Manager' },
  });
  return !!up;
}

// POST: PM atau Super Admin mengajukan proposal perubahan anggaran
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');
    const { id: proyekIdStr } = await params;
    const proyekId = parseInt(proyekIdStr, 10);

    const isSuperAdmin = userRole === 'Super Admin' || userRole === 'Superadmin' || userRole === 'superadmin';
    const isPM = userId ? await prisma.userProyek.findFirst({
      where: { userId: parseInt(userId, 10), proyekId, role: 'Project Manager' },
    }) : false;

    if (!isPM && !isSuperAdmin) {
      return NextResponse.json(
        { message: 'Forbidden: Only the assigned Project Manager or Super Admin can submit proposals' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { judul, deskripsi, items } = body;

    if (!judul?.trim() || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: 'judul and items (non-empty array) are required' },
        { status: 400 },
      );
    }

    for (const [i, item] of items.entries()) {
      if (!['MAIN_ANGGARAN', 'SUB_ANGGARAN', 'KETERANGAN'].includes(item.tipe)) {
        return NextResponse.json({ message: `items[${i}].tipe must be MAIN_ANGGARAN, SUB_ANGGARAN or KETERANGAN` }, { status: 400 });
      }
      if (!['TAMBAH', 'UBAH', 'HAPUS'].includes(item.aksi)) {
        return NextResponse.json({ message: `items[${i}].aksi must be TAMBAH, UBAH, or HAPUS` }, { status: 400 });
      }
      if (item.aksi === 'TAMBAH' && item.tipe !== 'MAIN_ANGGARAN' && !item.parentId) {
        return NextResponse.json({ message: `items[${i}].parentId required for TAMBAH` }, { status: 400 });
      }
      if (item.aksi === 'UBAH' && !item.targetId) {
        return NextResponse.json({ message: `items[${i}].targetId required for UBAH` }, { status: 400 });
      }
      if (item.aksi === 'HAPUS' && !item.targetId) {
        return NextResponse.json({ message: `items[${i}].targetId required for HAPUS` }, { status: 400 });
      }
      
      if (['TAMBAH', 'UBAH'].includes(item.aksi)) {

        if (!item.nama?.trim()) {
          return NextResponse.json({ message: `items[${i}].nama is required for ${item.aksi}` }, { status: 400 });
        }

        if (item.nominalAlokasi == null || Number(item.nominalAlokasi) < 0) {
          return NextResponse.json({ message: `items[${i}].nominalAlokasi must be a non-negative number for ${item.aksi}` }, { status: 400 });
        }
      }
    }

    const pengajuan = await prisma.pengajuanAnggaran.create({
      data: {
        proyekId,
        pengajuId: parseInt(userId!, 10),
        judul: judul.trim(),
        deskripsi: deskripsi?.trim() || null,
        items: {
          create: items.map((item: any) => ({
            tipe: item.tipe,
            aksi: item.aksi,
            targetId: item.targetId || null,
            parentId: item.parentId || null,
            nama: item.nama?.trim() || null,
            nominalAlokasi: item.nominalAlokasi != null ? Number(item.nominalAlokasi) : null,
          })),
        },
      },
      include: { items: true },
    });

    const reviewers = await prisma.user.findMany({
      where: { 
        role: { 
          in: ['Direktur / Manajemen', 'Superadmin', 'superadmin'] 
        } 
      },
      select: { id: true },
    });
    
    if (reviewers.length > 0) {
      await prisma.notification.createMany({
        data: reviewers.map((u) => ({
          userId: u.id,
          tipe: 'PENGAJUAN_ANGGARAN',
          pesan: `Pengajuan anggaran baru: "${pengajuan.judul}" perlu direview`,
        })),
      });
    }

    return NextResponse.json({ message: 'Pengajuan anggaran berhasil dikirim', pengajuan }, { status: 201 });

  } catch (error) {
    console.error('Create pengajuan error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Internal server error', error: message }, { status: 500 });
  }
}

// GET: Daftar pengajuan anggaran untuk proyek ini
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');
    const { id: proyekIdStr } = await params;
    const proyekId = parseInt(proyekIdStr, 10);

    // Otomatis tervalidasi jika PM, Direktur, atau Super Admin
    if (!(await verifyCanAccessPengajuan(userId, userRole, proyekId))) {
      return NextResponse.json(
        { message: 'Forbidden: Only the assigned Project Manager, Direktur, or Super Admin can view proposals' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = { proyekId };
    if (status) where.status = status;

    const list = await prisma.pengajuanAnggaran.findMany({
      where,
      include: {
        items: true,
        pengaju: { select: { id: true, nama: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ pengajuan: list });
    
  } catch (error) {
    console.error('Get pengajuan list error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Internal server error', error: message }, { status: 500 });
  }
}