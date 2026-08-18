import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearCache } from '@/lib/route-cache';

// POST: Direct allocation of Main, Sub, and Keterangan pos (no approval needed)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const roleHeader = req.headers.get('x-user-role') || '';
    const rolesHeader = req.headers.get('x-user-roles') || roleHeader || '';
    const roles = rolesHeader.split(',').map((r) => r.trim().toLowerCase());
    const userId = req.headers.get('x-user-id');
    const { id: proyekIdStr } = await params;
    const proyekId = parseInt(proyekIdStr, 10);

    const isPM = await prisma.userProyek.findFirst({
      where: {
        userId: parseInt(userId || '0', 10),
        proyekId,
        role: 'Project Manager',
      },
    });

    const isSuperAdmin =
      roles.some((r) => r === 'superadmin' || r === 'super admin') ||
      roleHeader.toLowerCase().trim() === 'superadmin' ||
      roleHeader.toLowerCase().trim() === 'super admin';

    const isDirektur = roles.some((r) => r.includes('direktur') || r.includes('manajemen'));
    const isKeuangan = roles.some((r) => r.includes('keuangan'));

    if (!isPM && !isKeuangan && !isDirektur && !isSuperAdmin) {
      return NextResponse.json(
        { message: 'Forbidden: Hak akses tidak cukup untuk mengalokasikan pos pada proyek ini' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'items array is required and must not be empty' }, { status: 400 });
    }

    // Verify project and budget exist
    const budget = await prisma.budget.findUnique({
      where: { proyekId },
      include: {
        mainAnggaran: {
          include: {
            subAnggaran: {
              include: {
                keterangan: true,
              },
            },
          },
        },
      },
    });

    if (!budget) {
      return NextResponse.json(
        { message: 'Budget untuk proyek ini belum diinisialisasi' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const createdItems: any[] = [];
      const draftIdToRealId = new Map<number, number>();

      let runningMainTotal = budget.mainAnggaran.reduce(
        (sum, m) => sum + Number(m.nominalAlokasi),
        0
      );

      // Pass 1: Create MAIN_ANGGARAN items (superadmin/authorized roles)
      for (const item of items) {
        if (item.tipe === 'MAIN_ANGGARAN') {
          const newAlokasi = Number(item.nominalAlokasi);
          const itemTipe = item.tipeAnggaran || item.tipePos || 'pengeluaran';
          
          const sameTipeMains = budget.mainAnggaran.filter((m) => m.tipe === itemTipe);
          const runningTipeTotal = sameTipeMains.reduce((sum, m) => sum + Number(m.nominalAlokasi), 0);
          
          if (runningTipeTotal + newAlokasi > Number(budget.rabTotal)) {
            throw new Error(
              `Total alokasi Main Pos melebihi RAB proyek (Rp ${Number(budget.rabTotal).toLocaleString('id-ID')})`
            );
          }

          const mainAnggaran = await tx.mainAnggaran.create({
            data: {
              budgetId: budget.id,
              namaMain: item.nama.trim(),
              nominalAlokasi: newAlokasi,
              nominalTerpakai: 0,
              tipe: itemTipe,
            },
          });
          draftIdToRealId.set(item.targetId, mainAnggaran.id);
          runningMainTotal += newAlokasi;
          createdItems.push({ tipe: 'MAIN_ANGGARAN', id: mainAnggaran.id, nama: mainAnggaran.namaMain });
        }
      }

      // Pass 2: Create SUB_ANGGARAN items
      for (const item of items) {
        if (item.tipe === 'SUB_ANGGARAN') {
          let parentMainId = item.parentId;
          if (draftIdToRealId.has(item.parentId)) {
            parentMainId = draftIdToRealId.get(item.parentId)!;
          }

          const mainAnggaran = await tx.mainAnggaran.findUnique({
            where: { id: parentMainId },
            include: { subAnggaran: { select: { nominalAlokasi: true } } },
          });

          if (!mainAnggaran) {
            throw new Error(`MainAnggaran dengan id ${parentMainId} tidak ditemukan`);
          }

          const existingSubTotal = mainAnggaran.subAnggaran.reduce(
            (sum, s) => sum + Number(s.nominalAlokasi),
            0
          );
          const newAlokasi = Number(item.nominalAlokasi);
          if (existingSubTotal + newAlokasi > Number(mainAnggaran.nominalAlokasi)) {
            throw new Error(
              `Total alokasi sub pos melebihi alokasi main "${mainAnggaran.namaMain}" (Rp ${Number(mainAnggaran.nominalAlokasi).toLocaleString('id-ID')})`
            );
          }

          const itemTipe = item.tipeAnggaran || item.tipePos || mainAnggaran.tipe || 'pengeluaran';

          const subAnggaran = await tx.subAnggaran.create({
            data: {
              mainAnggaranId: parentMainId,
              namaSub: item.nama.trim(),
              nominalAlokasi: newAlokasi,
              nominalTerpakai: 0,
              tipe: itemTipe,
            },
          });
          draftIdToRealId.set(item.targetId, subAnggaran.id);
          createdItems.push({ tipe: 'SUB_ANGGARAN', id: subAnggaran.id, nama: subAnggaran.namaSub });
        }
      }

      // Pass 3: Create KETERANGAN items
      for (const item of items) {
        if (item.tipe === 'KETERANGAN') {
          let parentSubId = item.parentId;
          if (draftIdToRealId.has(item.parentId)) {
            parentSubId = draftIdToRealId.get(item.parentId)!;
          }

          const subAnggaran = await tx.subAnggaran.findUnique({
            where: { id: parentSubId },
            include: { keterangan: { select: { nominalAlokasi: true } } },
          });

          if (!subAnggaran) {
            throw new Error(`SubAnggaran dengan id ${parentSubId} tidak ditemukan`);
          }

          const existingKetTotal = subAnggaran.keterangan.reduce(
            (sum, k) => sum + Number(k.nominalAlokasi),
            0
          );
          const newAlokasi = Number(item.nominalAlokasi);
          if (existingKetTotal + newAlokasi > Number(subAnggaran.nominalAlokasi)) {
            throw new Error(
              `Total alokasi keterangan melebihi alokasi sub "${subAnggaran.namaSub}" (Rp ${Number(subAnggaran.nominalAlokasi).toLocaleString('id-ID')})`
            );
          }

          const keterangan = await tx.keteranganAnggaran.create({
            data: {
              subAnggaranId: parentSubId,
              keterangan: item.nama.trim(),
              nominalAlokasi: newAlokasi,
            },
          });
          createdItems.push({ tipe: 'KETERANGAN', id: keterangan.id, nama: keterangan.keterangan });
        }
      }

      return createdItems;
    });

    if (userId) {
      let actor = 'Project Manager';
      if (isSuperAdmin) actor = 'Super Admin';
      else if (isDirektur) actor = 'Direktur';
      else if (isKeuangan) actor = 'Tim Keuangan';

      const project = await prisma.proyek.findUnique({ where: { id: proyekId }, select: { nama: true } });

      await prisma.auditTrail.create({
        data: {
          userId: parseInt(userId, 10),
          aksi: 'alokasi_pos',
          detail: `${actor} mengalokasikan ${result.length} pos baru pada proyek ${project?.nama || proyekId}`,
        },
      });
    }

    clearCache('dashboard:');
    clearCache('proyek:');

    return NextResponse.json(
      { message: `Berhasil mengalokasikan ${result.length} pos baru`, items: result },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Alokasi pos error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: message || 'Internal server error' }, { status: 500 });
  }
}
