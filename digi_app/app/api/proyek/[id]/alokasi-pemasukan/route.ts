import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearCache } from '@/lib/route-cache';

async function checkAuthorization(req: NextRequest, proyekId: number) {
  const userId = req.headers.get('x-user-id');
  const userRole = req.headers.get('x-user-role');

  const isDirektur = userRole === 'Direktur / Manajemen';
  const isSuperAdmin = userRole === 'Superadmin' || userRole === 'superadmin';

  const isMember = userId
    ? await prisma.userProyek.findFirst({
        where: { userId: parseInt(userId, 10), proyekId },
      })
    : null;

  return isDirektur || isSuperAdmin || isMember;
}

// GET: Mengambil data alokasi pemasukan (MainAnggaran & SubAnggaran bertipe "pemasukan")
//      beserta saldo pemasukanBelumDialokasikan dari Budget
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const proyekId = parseInt(id, 10);

    const isAuthorized = await checkAuthorization(req, proyekId);
    if (!isAuthorized) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const budget = await prisma.budget.findUnique({
      where: { proyekId },
      include: {
        mainAnggaran: {
          where: { tipe: 'pemasukan' },
          orderBy: { id: 'asc' },
          include: {
            subAnggaran: {
              where: { tipe: 'pemasukan' },
              orderBy: { id: 'asc' },
            },
          },
        },
      },
    });

    if (!budget) {
      return NextResponse.json({ message: 'Budget belum diinisialisasi untuk proyek ini' }, { status: 404 });
    }

    // Ambil master data pemasukan untuk pilihan alokasi
    const masterPemasukan = await prisma.masterMain.findMany({
      where: { tipe: 'pemasukan' },
      include: {
        MasterSub: {
          where: { tipe: 'pemasukan' },
          orderBy: { id: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({
      totalPemasukan: budget.totalPemasukan,
      pemasukanBelumDialokasikan: budget.pemasukanBelumDialokasikan,
      alokasiPemasukan: budget.mainAnggaran,
      masterPemasukan,
    });

  } catch (error: any) {
    console.error('Fetch alokasi pemasukan error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// POST: Alokasikan nominal dari pemasukanBelumDialokasikan ke MainAnggaran / SubAnggaran tipe "pemasukan"
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const proyekId = parseInt(id, 10);

    const isAuthorized = await checkAuthorization(req, proyekId);
    if (!isAuthorized) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { namaMain, namaSub, nominal } = body;

    if (!namaMain || !nominal || parseFloat(nominal) <= 0) {
      return NextResponse.json({ message: 'namaMain dan nominal (> 0) wajib diisi' }, { status: 400 });
    }

    const nominalAlokasi = parseFloat(nominal);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Cek saldo yang tersedia
      const budget = await tx.budget.findUnique({ where: { proyekId } });
      if (!budget) {
        throw new Error('Budget tidak ditemukan');
      }

      const saldoTersedia = Number(budget.pemasukanBelumDialokasikan);
      if (nominalAlokasi > saldoTersedia) {
        throw new Error(`ValidationError: Nominal alokasi (Rp ${nominalAlokasi.toLocaleString('id-ID')}) melebihi saldo yang tersedia (Rp ${saldoTersedia.toLocaleString('id-ID')})`);
      }

      // 2. Cari atau buat MainAnggaran tipe pemasukan
      let mainAnggaran = await tx.mainAnggaran.findFirst({
        where: {
          budgetId: budget.id,
          namaMain,
          tipe: 'pemasukan',
        },
      });

      if (!mainAnggaran) {
        mainAnggaran = await tx.mainAnggaran.create({
          data: {
            budgetId: budget.id,
            namaMain,
            tipe: 'pemasukan',
            nominalAlokasi: 0,
            nominalTerpakai: 0,
          },
        });
      }

      let targetRecord: any;

      if (namaSub) {
        // Alokasi ke Sub Anggaran
        let subAnggaran = await tx.subAnggaran.findFirst({
          where: {
            mainAnggaranId: mainAnggaran.id,
            namaSub,
            tipe: 'pemasukan',
          },
        });

        if (!subAnggaran) {
          subAnggaran = await tx.subAnggaran.create({
            data: {
              mainAnggaranId: mainAnggaran.id,
              namaSub,
              tipe: 'pemasukan',
              nominalAlokasi: 0,
              nominalTerpakai: 0,
            },
          });
        }

        targetRecord = await tx.subAnggaran.update({
          where: { id: subAnggaran.id },
          data: { nominalAlokasi: { increment: nominalAlokasi } },
        });

        // Update nominalAlokasi MainAnggaran juga
        await tx.mainAnggaran.update({
          where: { id: mainAnggaran.id },
          data: { nominalAlokasi: { increment: nominalAlokasi } },
        });
      } else {
        // Alokasi langsung ke Main Anggaran
        targetRecord = await tx.mainAnggaran.update({
          where: { id: mainAnggaran.id },
          data: { nominalAlokasi: { increment: nominalAlokasi } },
        });
      }

      // 3. Kurangi saldo pemasukanBelumDialokasikan di Budget
      const updatedBudget = await tx.budget.update({
        where: { proyekId },
        data: {
          pemasukanBelumDialokasikan: { decrement: nominalAlokasi },
        },
      });

      return { targetRecord, budget: updatedBudget };
    });

    clearCache('proyek:');
    clearCache('dashboard:');
    return NextResponse.json({ success: true, data: result }, { status: 201 });

  } catch (error: any) {
    console.error('Alokasi pemasukan error:', error);
    if (error.message?.startsWith('ValidationError:')) {
      return NextResponse.json(
        { message: error.message.replace('ValidationError:', '').trim() },
        { status: 400 }
      );
    }
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
