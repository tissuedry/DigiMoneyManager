import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCached, setCache, clearCache } from '@/lib/route-cache';

// GET: List all pemasukan master accounts as COA
export async function GET(req: NextRequest) {
  try {
    const cached = getCached('coa');
    if (cached) return NextResponse.json(cached);

    const masterPemasukan = await prisma.masterMain.findMany({
      where: { tipe: 'pemasukan' },
      include: { MasterSub: true },
      orderBy: { id: 'asc' },
    });

    const coa: any[] = [];
    const counter = 1;
    for (const main of masterPemasukan) {
      for (const sub of main.MasterSub) {
        coa.push({
          id: `COA-${sub.id}`,
          nomorAkun: sub.id,
          namaAkun: `${main.nama} - ${sub.nama}`,
          mainId: main.id,
          mainNama: main.nama,
          subId: sub.id,
          subNama: sub.nama,
          tipe: 'Aset',
          standar: 'PSAK',
        });
      }
    }

    const resp = { coa };
    setCache('coa', resp);

    return NextResponse.json(resp);

  } catch (error: any) {
    console.error('Fetch CoA error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// POST: Create a new pemasukan account via master main / sub
export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');
    const userId = req.headers.get('x-user-id');

    if (role !== 'Tim Keuangan' && role !== 'Superadmin' && role !== 'superadmin') {
      return NextResponse.json({ message: 'Forbidden: Only Tim Keuangan and Super Admin can manage Chart of Accounts' }, { status: 403 });
    }

    const body = await req.json();
    clearCache('coa');

    const { namaAkun, mainId } = body;
    if (!namaAkun) {
      return NextResponse.json({ message: 'namaAkun (nama sub) is required' }, { status: 400 });
    }

    let parentMainId = mainId;
    if (!parentMainId) {
      let mainKas = await prisma.masterMain.findFirst({ where: { nama: 'Kas & Bank', tipe: 'pemasukan' } });
      if (!mainKas) {
        mainKas = await prisma.masterMain.create({ data: { nama: 'Kas & Bank', tipe: 'pemasukan' } });
      }
      parentMainId = mainKas.id;
    }

    const newSub = await prisma.masterSub.create({
      data: {
        nama: namaAkun,
        mainId: parentMainId,
        tipe: 'pemasukan',
      },
    });

    if (userId) {
      await prisma.auditTrail.create({
        data: {
          userId: parseInt(userId, 10),
          aksi: 'create_coa',
          detail: `Membuat Akun Pemasukan baru: ${namaAkun}`,
        },
      });
    }

    return NextResponse.json({
      message: 'Chart of Accounts created successfully',
      coa: {
        id: `COA-${newSub.id}`,
        nomorAkun: newSub.id,
        namaAkun: newSub.nama,
        tipe: 'Aset',
      },
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Create CoA error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}