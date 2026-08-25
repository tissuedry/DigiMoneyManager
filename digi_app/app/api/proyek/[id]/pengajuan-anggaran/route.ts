import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

type ValidateArgs = { nilaiKontrak: number; sumLain: number; alokasiBaru: number; sumSub: number };

export function validateAlokasi({ nilaiKontrak, sumLain, alokasiBaru, sumSub }: ValidateArgs): boolean {
  if (alokasiBaru < sumSub) return false;
  if (sumLain + alokasiBaru > nilaiKontrak) return false;
  return true;
}

async function isPMOrSuperAdmin(userId: string | null, userRole: string | null, proyekId: number) {
  const isSuper = userRole === 'Superadmin' || userRole === 'superadmin';
  if (isSuper) return true;
  if (!userId) return false;
  return !!(await prisma.userProyek.findFirst({
    where: { userId: parseInt(userId, 10), proyekId, role: 'Project Manager' },
  }));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');
    const { id: proyekIdStr } = await params;
    const proyekId = parseInt(proyekIdStr, 10);

    if (!(await isPMOrSuperAdmin(userId, userRole, proyekId))) {
      return NextResponse.json({ message: 'Forbidden: Only the assigned Project Manager or Super Admin can submit proposals' }, { status: 403 });
    }

    const body = await req.json();
    const { mainAnggaranId, alokasiBaru, catatan } = body;
    const alokasi = Number(alokasiBaru);

    if (!mainAnggaranId || alokasi == null || alokasi < 0) {
      return NextResponse.json({ message: 'mainAnggaranId and alokasiBaru (>= 0) are required' }, { status: 400 });
    }

    const budget = await prisma.budget.findUnique({ where: { proyekId } });
    if (!budget) return NextResponse.json({ message: 'Budget untuk proyek ini belum diinisialisasi' }, { status: 400 });

    const main = await prisma.mainAnggaran.findUnique({
      where: { id: Number(mainAnggaranId) },
      include: { subAnggaran: { select: { nominalAlokasi: true } } },
    });
    if (!main) return NextResponse.json({ message: 'MainAnggaran not found' }, { status: 404 });
    if (main.budgetId !== budget.id) {
      return NextResponse.json({ message: 'MainAnggaran tidak berada di proyek ini' }, { status: 400 });
    }

    const existing = await prisma.pengajuanAnggaran.findFirst({
      where: { mainAnggaranId: Number(mainAnggaranId), status: 'PENDING' },
    });
    if (existing) {
      return NextResponse.json({ message: 'Main anggaran ini masih memiliki pengajuan yang menunggu persetujuan' }, { status: 409 });
    }

    const others = await prisma.mainAnggaran.aggregate({
      where: { budgetId: budget.id, id: { not: Number(mainAnggaranId) } },
      _sum: { nominalAlokasi: true },
    });
    const sumLain = Number(others._sum.nominalAlokasi || 0);
    const sumSub = main.subAnggaran.reduce((s, sub) => s + Number(sub.nominalAlokasi), 0);
    const nilaiKontrak = Number(budget.nilaiKontrak);

    if (!validateAlokasi({ nilaiKontrak, sumLain, alokasiBaru: alokasi, sumSub })) {
      return NextResponse.json({
        message: `Alokasi baru tidak valid: tidak boleh kurang dari total alokasi sub (Rp ${sumSub.toLocaleString('id-ID')}) dan total seluruh main tidak boleh melebihi Nilai Proyek (Rp ${nilaiKontrak.toLocaleString('id-ID')})`,
      }, { status: 400 });
    }

    const pengajuan = await prisma.pengajuanAnggaran.create({
      data: {
        proyekId,
        pengajuId: parseInt(userId!, 10),
        mainAnggaranId: Number(mainAnggaranId),
        judul: `Perubahan alokasi anggaran: ${main.namaMain}`,
        deskripsi: catatan?.trim() || null,
        alokasiLama: main.nominalAlokasi,
        alokasiBaru: alokasi,
      },
      include: { pengaju: { select: { id: true, nama: true } }, mainAnggaran: { select: { id: true, namaMain: true } } },
    });

    const reviewers = await prisma.user.findMany({
      where: { role: { in: ['Direktur / Manajemen', 'Superadmin', 'superadmin'] } },
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

    return NextResponse.json({ message: 'Pengajuan perubahan alokasi berhasil dikirim', pengajuan }, { status: 201 });
  } catch (error) {
    console.error('Create pengajuan error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Internal server error', error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');
    const { id: proyekIdStr } = await params;
    const proyekId = parseInt(proyekIdStr, 10);

    const isSuper = userRole === 'Direktur / Manajemen' || userRole === 'Superadmin' || userRole === 'superadmin';
    const isPM = userId
      ? await prisma.userProyek.findFirst({ where: { userId: parseInt(userId, 10), proyekId, role: 'Project Manager' } })
      : null;
    if (!isSuper && !isPM) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const where: any = { proyekId };
    if (status) where.status = status;

    const list = await prisma.pengajuanAnggaran.findMany({
      where,
      include: {
        pengaju: { select: { id: true, nama: true } },
        mainAnggaran: { select: { id: true, namaMain: true } },
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
