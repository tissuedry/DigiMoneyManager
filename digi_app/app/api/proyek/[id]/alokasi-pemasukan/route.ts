import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearCache } from '@/lib/route-cache';

export const dynamic = 'force-dynamic';

async function checkAuthorization(req: NextRequest, proyekId: number) {
  const userId = req.headers.get('x-user-id');
  const userRole = req.headers.get('x-user-role');

  const isDirektur = userRole === 'Direktur / Manajemen';
  const isSuperAdmin = userRole === 'Superadmin' || userRole === 'superadmin';
  const isKeuangan = userRole === 'Tim Keuangan';

  const isMember = userId
    ? await prisma.userProyek.findFirst({
        where: { userId: parseInt(userId, 10), proyekId },
      })
    : null;

  return isDirektur || isSuperAdmin || isKeuangan || isMember;
}

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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const proyekId = parseInt(id, 10);

    const isAuthorized = await checkAuthorization(req, proyekId);
    if (!isAuthorized) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { mainAnggaranId, subAnggaranId, alokasiBaru, namaMain, namaSub, nominal } = body;

    if (namaMain && !namaSub && !mainAnggaranId) {
      const nominalNum = Number(nominal) || 0;
      if (!namaMain || nominalNum <= 0) {
        return NextResponse.json(
          { message: 'Nama Main dan Nominal harus diisi dengan benar' },
          { status: 400 }
        );
      }

      const budget = await prisma.budget.findUnique({ where: { proyekId } });
      if (!budget) {
        return NextResponse.json({ message: 'Budget belum diinisialisasi untuk proyek ini' }, { status: 404 });
      }

      const newMain = await prisma.mainAnggaran.create({
        data: {
          budgetId: budget.id,
          namaMain,
          nominalAlokasi: nominalNum,
          tipe: 'pemasukan',
        },
      });

      clearCache('proyek:');
      clearCache('dashboard:');
      return NextResponse.json({ success: true, data: newMain }, { status: 201 });
    }

    if (namaMain && namaSub) {
      const nominalNum = Number(nominal) || 0;
      if (!namaSub || nominalNum <= 0) {
        return NextResponse.json(
          { message: 'Nama Sub dan Nominal harus diisi dengan benar' },
          { status: 400 }
        );
      }

      const budget = await prisma.budget.findUnique({ where: { proyekId } });
      if (!budget) {
        return NextResponse.json({ message: 'Budget belum diinisialisasi untuk proyek ini' }, { status: 404 });
      }

      const mainAnggaran = await prisma.mainAnggaran.findFirst({
        where: { budgetId: budget.id, namaMain, tipe: 'pemasukan' },
        include: { subAnggaran: true },
      });

      if (!mainAnggaran) {
        return NextResponse.json({ message: 'Main Anggaran tidak ditemukan' }, { status: 404 });
      }

      const totalSubSebelumnya = mainAnggaran.subAnggaran.reduce(
        (sum, sub) => sum + Number(sub.nominalAlokasi || 0),
        0
      );
      const sisaKuota = Number(mainAnggaran.nominalAlokasi || 0) - totalSubSebelumnya;
      if (nominalNum > sisaKuota) {
        return NextResponse.json(
          {
            message: `Total alokasi sub akan melewati batas MAIN "${namaMain}". Sisa kuota: Rp ${sisaKuota.toLocaleString('id-ID')}`,
          },
          { status: 400 }
        );
      }

      const newSub = await prisma.subAnggaran.create({
        data: {
          mainAnggaranId: mainAnggaran.id,
          namaSub,
          nominalAlokasi: nominalNum,
          tipe: 'pemasukan',
        },
      });

      clearCache('proyek:');
      clearCache('dashboard:');
      return NextResponse.json({ success: true, data: newSub }, { status: 201 });
    }

    if (!mainAnggaranId || alokasiBaru === undefined || alokasiBaru < 0) {
      return NextResponse.json(
        { message: 'mainAnggaranId dan alokasiBaru wajib diisi dengan benar' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const mainAnggaran = await tx.mainAnggaran.findUnique({
        where: { id: mainAnggaranId },
        include: { subAnggaran: true },
      });

      if (!mainAnggaran) {
        throw new Error('ValidationError: Main Anggaran tidak ditemukan');
      }

      if (subAnggaranId) {
        const subAnggaran = await tx.subAnggaran.findUnique({ where: { id: subAnggaranId } });
        if (!subAnggaran) throw new Error('ValidationError: Sub Anggaran tidak ditemukan');

        const updatedSub = await tx.subAnggaran.update({
          where: { id: subAnggaranId },
          data: { nominalAlokasi: alokasiBaru },
        });
        return { targetRecord: updatedSub };
      }

      const sumSub = mainAnggaran.subAnggaran.reduce(
        (acc, sub) => acc + Number(sub.nominalAlokasi || 0),
        0
      );
      if (alokasiBaru < sumSub) {
        throw new Error(
          `ValidationError: Alokasi baru tidak boleh kurang dari total sub anggaran (Rp ${sumSub.toLocaleString('id-ID')})`
        );
      }

      const budget = await tx.budget.findUnique({ where: { proyekId } });
      if (!budget) throw new Error('ValidationError: Budget tidak ditemukan');

      const selisihAlokasi = alokasiBaru - Number(mainAnggaran.nominalAlokasi || 0);
      const saldoTersedia = Number(budget.pemasukanBelumDialokasikan || 0);

      if (selisihAlokasi > 0 && selisihAlokasi > saldoTersedia) {
        throw new Error(
          'ValidationError: Penambahan alokasi melebihi sisa pemasukan yang belum dialokasikan.'
        );
      }

      const updatedMain = await tx.mainAnggaran.update({
        where: { id: mainAnggaranId },
        data: { nominalAlokasi: alokasiBaru },
      });

      await tx.budget.update({
        where: { proyekId },
        data: { pemasukanBelumDialokasikan: { decrement: selisihAlokasi } },
      });

      return { mainAnggaran: updatedMain };
    });

    clearCache('proyek:');
    clearCache('dashboard:');
    return NextResponse.json({ success: true, data: result }, { status: 200 });

  } catch (error: any) {
    console.error('Perubahan alokasi error:', error);
    if (error.message?.startsWith('ValidationError:')) {
      return NextResponse.json(
        { message: error.message.replace('ValidationError:', '').trim() },
        { status: 400 }
      );
    }
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
