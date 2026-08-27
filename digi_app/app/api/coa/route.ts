import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCached, setCache, clearCache } from '@/lib/route-cache';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tipeParam = searchParams.get('tipe') || searchParams.get('type');
    const cacheKey = tipeParam ? `coa:${tipeParam.toLowerCase()}` : 'coa';

    const cached = getCached(cacheKey);
    if (cached) return NextResponse.json(cached);

    const whereCond: any = {};
    if (tipeParam && tipeParam !== 'all') {
      whereCond.tipe = tipeParam.toLowerCase();
    }

    const masterCategories = await prisma.masterMain.findMany({
      where: whereCond,
      include: {
        MasterSub: {
          where: whereCond,
          orderBy: { id: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
    });

    const coa: any[] = [];
    for (const main of masterCategories) {
      for (const sub of main.MasterSub) {
        const itemTipe = sub.tipe
          ? sub.tipe.charAt(0).toUpperCase() + sub.tipe.slice(1).toLowerCase()
          : main.tipe
          ? main.tipe.charAt(0).toUpperCase() + main.tipe.slice(1).toLowerCase()
          : 'Aset';

        coa.push({
          id: `COA-${sub.id}`,
          nomorAkun: sub.id,
          namaAkun: `${main.nama} - ${sub.nama}`,
          mainId: main.id,
          mainNama: main.nama,
          subId: sub.id,
          subNama: sub.nama,
          tipe: itemTipe,
          standar: 'PSAK',
        });
      }
    }

    const resp = { coa };
    setCache(cacheKey, resp);

    return NextResponse.json(resp);

  } catch (error: any) {
    console.error('Fetch CoA error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    clearCache('coa');

    const { namaAkun, mainId, tipe: bodyTipe } = body;
    if (!namaAkun) {
      return NextResponse.json({ message: 'namaAkun (nama sub) is required' }, { status: 400 });
    }

    const itemTipe = (bodyTipe || 'pemasukan').toLowerCase();

    let parentMainId = mainId;
    if (!parentMainId) {
      const defaultMainName = itemTipe === 'aset' ? 'Kas & Bank' : 'Kas & Bank';
      let mainKas = await prisma.masterMain.findFirst({ where: { nama: defaultMainName, tipe: itemTipe } });
      if (!mainKas) {
        mainKas = await prisma.masterMain.create({ data: { nama: defaultMainName, tipe: itemTipe } });
      }
      parentMainId = mainKas.id;
    }

    const newSub = await prisma.masterSub.create({
      data: {
        nama: namaAkun,
        mainId: parentMainId,
        tipe: itemTipe,
      },
    });

    const displayTipe = itemTipe.charAt(0).toUpperCase() + itemTipe.slice(1);

    await prisma.auditTrail.create({
      data: {
        userId: numericUserId,
        aksi: 'create_coa',
        detail: `Membuat Akun ${displayTipe} baru: ${namaAkun}`,
      },
    });

    return NextResponse.json({
      message: 'Chart of Accounts created successfully',
      coa: {
        id: `COA-${newSub.id}`,
        nomorAkun: newSub.id,
        namaAkun: newSub.nama,
        tipe: displayTipe,
      },
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Create CoA error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}