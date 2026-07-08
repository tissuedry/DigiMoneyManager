import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCached, setCache, clearCache } from '@/lib/route-cache';

// GET: List all chart of accounts
export async function GET(req: NextRequest) {
  try {
    // ponytail: CoA is near-static — cache 5 minutes
    const cached = getCached('coa');
    if (cached) return NextResponse.json(cached);

    const coa = await prisma.chartOfAccounts.findMany({
      orderBy: { nomorAkun: 'asc' },
    });
    const resp = { coa };
    setCache('coa', resp);
    return NextResponse.json(resp);
  } catch (error: any) {
    console.error('Fetch CoA error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// POST: Create a new chart of accounts (Admin Keuangan only)
export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');
    const userId = req.headers.get('x-user-id');

    if (role !== 'Tim Keuangan') {
      return NextResponse.json({ message: 'Forbidden: Only Tim Keuangan can manage Chart of Accounts' }, { status: 403 });
    }

    const body = await req.json();

    // Check if bulk insert (array)
    if (Array.isArray(body)) {
      const createdCoas = [];
      const errors = [];

      for (const item of body) {
        const { nomorAkun, namaAkun, tipe } = item;
        const standar = item.standar || 'PSAK';

        if (!nomorAkun || !namaAkun || !tipe) {
          errors.push({ item, error: 'nomorAkun, namaAkun, and tipe are required' });
          continue;
        }

        const numAkun = parseInt(nomorAkun, 10);
        if (isNaN(numAkun)) {
          errors.push({ item, error: 'nomorAkun must be a number' });
          continue;
        }

        // Check duplicate
        const existing = await prisma.chartOfAccounts.findFirst({
          where: { nomorAkun: numAkun },
        });

        if (existing) {
          errors.push({ item, error: `Account number ${nomorAkun} already exists` });
          continue;
        }

        const newCoa = await prisma.chartOfAccounts.create({
          data: {
            id: `COA-${nomorAkun}`,
            nomorAkun: numAkun,
            namaAkun,
            tipe,
            standar,
          },
        });
        createdCoas.push(newCoa);
      }

      if (userId && createdCoas.length > 0) {
        await prisma.auditTrail.create({
          data: {
            userId: parseInt(userId, 10),
            aksi: 'import_coa',
            detail: `Mengimpor ${createdCoas.length} Chart of Accounts baru via CSV`,
          },
        });
      }

      return NextResponse.json({
        message: `Imported ${createdCoas.length} accounts successfully`,
        createdCount: createdCoas.length,
        errors,
      }, { status: 201 });
    }

    clearCache('coa');

    const { nomorAkun, namaAkun, tipe } = body;
    const standar = body.standar || 'PSAK';

    if (!nomorAkun || !namaAkun || !tipe) {
      return NextResponse.json({ message: 'nomorAkun, namaAkun, and tipe are required' }, { status: 400 });
    }

    // Check if account number already exists
    const existing = await prisma.chartOfAccounts.findFirst({
      where: { nomorAkun: parseInt(nomorAkun, 10) },
    });

    if (existing) {
      return NextResponse.json({ message: `Chart of Accounts with account number ${nomorAkun} already exists` }, { status: 400 });
    }

    const newCoa = await prisma.chartOfAccounts.create({
      data: {
        id: `COA-${nomorAkun}`,
        nomorAkun: parseInt(nomorAkun, 10),
        namaAkun,
        tipe,
        standar,
      },
    });

    // Write to audit trail
    if (userId) {
      await prisma.auditTrail.create({
        data: {
          userId: parseInt(userId, 10),
          aksi: 'create_coa',
          detail: `Membuat Chart of Accounts baru: ${nomorAkun} - ${namaAkun}`,
        },
      });
    }

    return NextResponse.json({ message: 'Chart of Accounts created successfully', coa: newCoa }, { status: 201 });
  } catch (error: any) {
    console.error('Create CoA error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
