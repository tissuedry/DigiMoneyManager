import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

function isSuperAdmin(role: string | null) {
  return role === 'Superadmin' || role === 'superadmin';
}

// GET: Mengambil daftar data master
export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');
    const { searchParams } = new URL(req.url);
    const mainId = searchParams.get("mainId");
    const subId = searchParams.get("subId");

    if (subId) {
      return NextResponse.json([]);
    }

    if (mainId) {
      const sub = await prisma.masterSub.findMany({
        where: { mainId: parseInt(mainId) },
        orderBy: { id: 'asc' }
      });
      return NextResponse.json(sub);
    }

    const type = searchParams.get('type') || 'all';

    if (type === 'all') {
      const data = await prisma.masterMain.findMany({
        include: {
          MasterSub: true,
        },
        orderBy: { id: 'asc' },
      });
      return NextResponse.json({ data });
    }

    if (type === 'main') {
      const data = await prisma.masterMain.findMany({ orderBy: { id: 'asc' } });
      return NextResponse.json({ data });

    } else if (type === 'sub') {
      const data = await prisma.masterSub.findMany({ orderBy: { id: 'asc' } });
      return NextResponse.json({ data });
    }

    return NextResponse.json({ message: 'Tipe data master tidak valid' }, { status: 400 });

  } catch (error: any) {
    console.error('Get master data error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
// POST: Menambahkan data master baru
export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');
    const adminId = req.headers.get('x-user-id');
    
    if (!isSuperAdmin(role)) {
      return NextResponse.json({ message: 'Forbidden: Hanya Super Admin yang dapat menambah data master' }, { status: 403 });
    }

    let body;
    try {
      // Amankan parsing JSON untuk menghindari "Unexpected end of JSON input"
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json({ message: 'Request body kosong atau JSON tidak valid' }, { status: 400 });
    }

    const { type, nama, parentId } = body;

    if (!type || !nama) {
      return NextResponse.json({ message: 'Type dan nama wajib diisi' }, { status: 400 });
    }

    let newData;
    let detailAudit = '';

    if (type === 'main') {
      newData = await prisma.masterMain.create({
        data: { nama },
      });
      detailAudit = `Menambahkan Master Main baru: ${nama}`;

    } else if (type === 'sub') {
      if (!parentId) return NextResponse.json({ message: 'parentId (mainId) wajib diisi untuk Master Sub' }, { status: 400 });
      newData = await prisma.masterSub.create({
        data: { nama, mainId: parseInt(parentId, 10) },
      });
      detailAudit = `Menambahkan Master Sub baru: ${nama}`;

    } else {
      return NextResponse.json({ message: 'Tipe data master tidak valid' }, { status: 400 });
    }

    // Catat ke Audit Trail
    if (adminId) {
      await prisma.auditTrail.create({
        data: {
          userId: parseInt(adminId, 10),
          aksi: 'create_master_data',
          detail: `Super Admin - ${detailAudit}`,
        },
      });
    }

    return NextResponse.json({ message: 'Data master berhasil ditambahkan', data: newData }, { status: 201 });
    
  } catch (error: any) {
    console.error('Create master data error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}