import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');
    const { id } = await params;
    const proyekId = parseInt(id, 10);

    const isDirektur = userRole === 'Direktur / Manajemen';
    const isSuperAdmin = userRole === 'Superadmin' || userRole === 'superadmin';
    const isKeuangan = userRole === 'Tim Keuangan' || userRole === 'keuangan';
    
    const isMember = userId
      ? await prisma.userProyek.findFirst({
          where: { userId: parseInt(userId, 10), proyekId },
        })
      : null;

    if (!isDirektur && !isSuperAdmin && !isKeuangan && !isMember) {
      return NextResponse.json({ message: 'Forbidden: You must be a project member, Direktur, Keuangan, or Super Admin to access this data' }, { status: 403 });
    }

    const [mainAnggaran, masterMainList] = await Promise.all([
      prisma.mainAnggaran.findMany({
        where: { budget: { proyekId } },
        select: {
          id: true,
          namaMain: true,
          tipe: true,
          nominalAlokasi: true,
          nominalTerpakai: true,
          subAnggaran: {
            orderBy: { id: 'asc' },
            select: {
              id: true,
              namaSub: true,
              tipe: true,
              nominalAlokasi: true,
              nominalTerpakai: true,
              keterangan: {
                orderBy: { id: 'asc' },
                select: {
                  id: true,
                  keterangan: true,
                  nominalAlokasi: true,
                  nominalRealisasi: true,
                },
              },
            },
          },
        },
        orderBy: { id: 'asc' },
      }),
      prisma.masterMain.findMany({
        include: {
          MasterSub: true,
        },
      }),
    ]);

    const enrichedMain = mainAnggaran.map((m) => {
      const matchedMain = masterMainList.find(
        (mm) => mm.nama.toUpperCase().trim() === m.namaMain.toUpperCase().trim()
      );
      const mainKode = matchedMain?.kode || null;

      return {
        ...m,
        kode: mainKode,
        subAnggaran: m.subAnggaran.map((s) => {
          const matchedSub = matchedMain?.MasterSub?.find(
            (ms) => ms.nama.toUpperCase().trim() === s.namaSub.toUpperCase().trim()
          );
          return {
            ...s,
            kode: matchedSub?.kode || null,
          };
        }),
      };
    });

    return NextResponse.json({ posAnggaran: enrichedMain });
    
  } catch (error: any) {
    console.error('Fetch pos anggaran error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}