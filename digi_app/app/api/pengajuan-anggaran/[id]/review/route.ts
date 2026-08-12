import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearCache } from '@/lib/route-cache';

// PUT: Direktur / Super Admin review pengajuan
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    
    if (role !== 'Direktur / Manajemen' && role !== 'Superadmin' && role !== 'superadmin') {
      return NextResponse.json({ message: 'Forbidden: Only Direktur or Super Admin can review proposals' }, { status: 403 });
    }

    const reviewerName = ( role === 'Superadmin' || role === 'superadmin') ? 'Superadmin' : 'Direktur';

    const { id: pengajuanIdStr } = await params;
    const pengajuanId = parseInt(pengajuanIdStr, 10);

    const body = await req.json();
    const { status: targetStatus, catatan, itemIds } = body;

    if (!['APPROVE', 'REJECT'].includes(targetStatus)) {
      return NextResponse.json({ message: 'status must be APPROVE or REJECT' }, { status: 400 });
    }

    const pengajuan = await prisma.pengajuanAnggaran.findUnique({
      where: { id: pengajuanId },
      include: { items: true, proyek: { select: { id: true, nama: true, budget: { select: { id: true, rabTotal: true, sisaBudget: true } } } } },
    });

    if (!pengajuan) {
      return NextResponse.json({ message: 'Pengajuan not found' }, { status: 404 });
    }

    if (pengajuan.status !== 'PENDING') {
      return NextResponse.json({ message: 'Pengajuan already processed' }, { status: 400 });
    }

    const targetItems = Array.isArray(itemIds) && itemIds.length > 0
      ? pengajuan.items.filter((i) => itemIds.includes(i.id))
      : pengajuan.items;

    if (targetItems.length === 0) {
      return NextResponse.json({ message: 'Tidak ada item yang cocok untuk diproses' }, { status: 400 });
    }

    const targetItemIds = targetItems.map((i) => i.id);
    const isPartial = targetItems.length < pengajuan.items.length;

    const userId = req.headers.get('x-user-id');
    const approverId = userId ? parseInt(userId, 10) : 0;

    // DITOLAK
    if (targetStatus === 'REJECT') {
      let closed: { status: string } | null = null;

      // Kalau yang ditolak adalah MAIN BARU / SUB BARU (draft, aksi TAMBAH) yang belum pernah ada di DB, item
      // yang masih pending di bawahnya otomatis ikut ditolak — parentId draft-nya tidak akan pernah valid.
      const cascadeIds = new Set<number>();
      targetItems.forEach((item) => {
        if (item.tipe === 'MAIN_ANGGARAN' && item.aksi === 'TAMBAH' && item.targetId) {
          const subTargetIds = new Set<number>();
          pengajuan.items.forEach((i) => {
            if (i.tipe === 'SUB_ANGGARAN' && i.parentId === item.targetId) {
              cascadeIds.add(i.id);
              if (i.targetId) subTargetIds.add(i.targetId);
            } else if (i.tipe === 'KETERANGAN' && i.parentId === item.targetId) {
              cascadeIds.add(i.id);
            }
          });
          pengajuan.items.forEach((i) => {
            if (i.tipe === 'KETERANGAN' && i.parentId && subTargetIds.has(i.parentId)) {
              cascadeIds.add(i.id);
            }
          });
        }
        if (item.tipe === 'SUB_ANGGARAN' && item.aksi === 'TAMBAH' && item.targetId) {
          pengajuan.items.forEach((i) => {
            if (i.tipe === 'KETERANGAN' && i.parentId === item.targetId) {
              cascadeIds.add(i.id);
            }
          });
        }
      });

      const deleteIds = Array.from(new Set([...targetItemIds, ...cascadeIds]));

      await prisma.$transaction(async (tx) => {
        const current = await tx.pengajuanAnggaran.findUnique({ where: { id: pengajuanId }, select: { status: true } });
        if (!current || current.status !== 'PENDING') {
          throw new Error('RACE_CONDITION');
        }

        await tx.pengajuanAnggaranItem.deleteMany({ where: { id: { in: deleteIds } } });

        const remaining = await tx.pengajuanAnggaranItem.count({ where: { pengajuanId } });

        if (remaining === 0) {
          await tx.pengajuanAnggaran.update({
            where: { id: pengajuanId },
            data: { status: 'REJECT', catatan: catatan?.trim() || null, processedAt: new Date() },
          });
          closed = { status: 'REJECT' };
        }
      });

      const cascadeNote = cascadeIds.size > 0 ? ` (beserta ${cascadeIds.size} keterangan turunannya)` : '';

      await prisma.notification.create({
        data: {
          userId: pengajuan.pengajuId,
          tipe: 'PENGAJUAN_DITOLAK',
          pesan: closed
            ? `Pengajuan "${pengajuan.judul}" untuk proyek ${pengajuan.proyek.nama} ditolak oleh ${reviewerName}.${catatan ? ` Alasan: ${catatan}` : ''}`
            : `${targetItems.length} item${cascadeNote} dari pengajuan "${pengajuan.judul}" untuk proyek ${pengajuan.proyek.nama} ditolak oleh ${reviewerName}.${catatan ? ` Alasan: ${catatan}` : ''} Sisa item lain masih menunggu review.`,
        },
      });

      if (approverId) {
        const itemSummary = targetItems.map((i) => `${i.aksi} ${i.tipe} ${i.nama || ''}`).join(', ');
        await prisma.auditTrail.create({
          data: {
            userId: approverId,
            aksi: 'review_pengajuan_anggaran',
            detail: `${reviewerName} menolak ${isPartial ? `sebagian item (${targetItems.length})${cascadeNote}` : 'seluruh item'} pada pengajuan "${pengajuan.judul}" untuk proyek ${pengajuan.proyek.nama}. Items: ${itemSummary}`,
          },
        });
      }

      const final = await prisma.pengajuanAnggaran.findUnique({
        where: { id: pengajuanId },
        include: { items: true, pengaju: { select: { id: true, nama: true } }, proyek: { select: { nama: true } } },
      });

      clearCache('proyek:');
      clearCache('dashboard:');

      return NextResponse.json({
        message: closed ? 'Pengajuan ditolak' : 'Item terpilih ditolak, sisa item masih menunggu review',
        pengajuan: final,
      });
    }

    // DISETUJUI — eksekusi perubahan dalam transaction.
    // Process MAIN_ANGGARAN -> SUB_ANGGARAN -> KETERANGAN agar real ID tersedia untuk turunan yg reference draft parents.
    type Item = { id: number; tipe: string; aksi: string; targetId: number | null; parentId: number | null; nama: string | null; nominalAlokasi: number | null };

    const mainItems = targetItems.filter((i) => i.tipe === 'MAIN_ANGGARAN') as Item[];
    const subItems = targetItems.filter((i) => i.tipe === 'SUB_ANGGARAN') as Item[];
    const ketItems = targetItems.filter((i) => i.tipe === 'KETERANGAN') as Item[];

    // Guard: SUB_ANGGARAN yang parent-nya masih berupa MAIN BARU draft wajib disetujui bersamaan
    const missingParentSub = subItems.find((sub) => {
      const parentDraftMain = pengajuan.items.find(
        (i) => i.tipe === 'MAIN_ANGGARAN' && i.aksi === 'TAMBAH' && i.targetId === sub.parentId,
      );
      return parentDraftMain && !targetItemIds.includes(parentDraftMain.id);
    });
    if (missingParentSub) {
      return NextResponse.json(
        { message: `Item "${missingParentSub.nama}" membutuhkan MAIN BARU induknya untuk disetujui dalam batch yang sama` },
        { status: 400 },
      );
    }

    // Guard: KETERANGAN yang parent-nya masih berupa SUB BARU (draft, belum punya ID asli) wajib
    // disetujui bersamaan dengan parent-nya dalam batch yang sama, karena resolving parentId hanya
    // mungkin kalau parent SUB_ANGGARAN turut diproses sekarang.
    const missingParentKet = ketItems.find((ket) => {
      const parentDraftSub = pengajuan.items.find(
        (i) => i.tipe === 'SUB_ANGGARAN' && i.aksi === 'TAMBAH' && i.targetId === ket.parentId,
      );
      return parentDraftSub && !targetItemIds.includes(parentDraftSub.id);
    });

    if (missingParentKet) {
      return NextResponse.json(
        { message: `Item "${missingParentKet.nama}" membutuhkan SUB BARU induknya untuk disetujui dalam batch yang sama` },
        { status: 400 },
      );
    }

    // Map untuk resolve draft parentId: Date.now()→real DB id
    const mainIdMap = new Map<number, number>();
    const subIdMap = new Map<number, number>();
    let closed = false;

    await prisma.$transaction(async (tx) => {
      const current = await tx.pengajuanAnggaran.findUnique({ where: { id: pengajuanId }, select: { status: true } });
      if (!current || current.status !== 'PENDING') {
        throw new Error('RACE_CONDITION');
      }

      const budget = await tx.budget.findUnique({ where: { proyekId: pengajuan.proyekId } });
      if (!budget) throw new Error(`Budget for proyek ${pengajuan.proyekId} not found`);

      // 1.5 Process MAIN_ANGGARAN first — bangun mainIdMap
      for (const item of mainItems) {
        if (item.aksi === 'TAMBAH') {
          const created = await tx.mainAnggaran.create({
            data: {
              budgetId: budget.id,
              namaMain: item.nama || '',
              nominalAlokasi: item.nominalAlokasi ?? 0,
            },
          });
          if (item.targetId) mainIdMap.set(item.targetId, created.id);
        } else if (item.aksi === 'UBAH') {
          if (!item.targetId) continue;
          await tx.mainAnggaran.update({
            where: { id: item.targetId },
            data: {
              ...(item.nama != null && { namaMain: item.nama }),
              ...(item.nominalAlokasi != null && { nominalAlokasi: item.nominalAlokasi }),
            },
          });
        } else if (item.aksi === 'HAPUS') {
          if (!item.targetId) continue;
          const hasSub = await tx.subAnggaran.count({ where: { mainAnggaranId: item.targetId } });
          if (hasSub > 0) {
            throw new Error(`MainAnggaran id=${item.targetId} masih memiliki ${hasSub} sub pos. Hapus sub pos-nya dulu.`);
          }
          await tx.mainAnggaran.delete({ where: { id: item.targetId } });
        }
      }

      for (const [draftId, realId] of mainIdMap.entries()) {
        await tx.pengajuanAnggaranItem.updateMany({
          where: { pengajuanId, parentId: draftId, id: { notIn: targetItemIds } },
          data: { parentId: realId },
        });
      }

      // 2. Process SUB_ANGGARAN — resolve draft main parentId
      for (const item of subItems) {
        let resolvedParentId = item.parentId;
        if (resolvedParentId && mainIdMap.has(resolvedParentId)) {
          resolvedParentId = mainIdMap.get(resolvedParentId)!;
        }

        if (item.aksi === 'TAMBAH') {
          if (!resolvedParentId) throw new Error('parentId required for SUB_ANGGARAN TAMBAH');
          const created = await tx.subAnggaran.create({
            data: {
              mainAnggaranId: resolvedParentId,
              namaSub: item.nama || '',
              nominalAlokasi: item.nominalAlokasi ?? 0,
            },
          });

          if (item.targetId) subIdMap.set(item.targetId, created.id);

        } else if (item.aksi === 'UBAH') {

          if (!item.targetId) continue;
          await tx.subAnggaran.update({
            where: { id: item.targetId },
            data: {
              ...(item.nama != null && { namaSub: item.nama }),
              ...(item.nominalAlokasi != null && { nominalAlokasi: item.nominalAlokasi }),
            },
          });

        } else if (item.aksi === 'HAPUS') {
          if (!item.targetId) continue;
          const hasKeterangan = await tx.keteranganAnggaran.count({ where: { subAnggaranId: item.targetId } });

          if (hasKeterangan > 0) {
            throw new Error(`SubAnggaran id=${item.targetId} masih memiliki ${hasKeterangan} keterangan. Hapus keterangannya dulu.`);
          }

          await tx.subAnggaran.delete({ where: { id: item.targetId } });
        }
      }

      for (const [draftId, realId] of subIdMap.entries()) {
        await tx.pengajuanAnggaranItem.updateMany({
          where: { pengajuanId, parentId: draftId, id: { notIn: targetItemIds } },
          data: { parentId: realId },
        });
      }

      for (const item of ketItems) {
        let resolvedParentId = item.parentId;
        if (resolvedParentId && subIdMap.has(resolvedParentId)) {
          resolvedParentId = subIdMap.get(resolvedParentId)!;
        }

        if (item.aksi === 'TAMBAH') {
          if (!resolvedParentId) throw new Error('parentId required for KETERANGAN TAMBAH');
          await tx.keteranganAnggaran.create({
            data: {
              subAnggaranId: resolvedParentId,
              keterangan: item.nama || '',
              nominalAlokasi: item.nominalAlokasi ?? 0,
            },
          });

        } else if (item.aksi === 'UBAH') {
          if (!item.targetId) continue;
          await tx.keteranganAnggaran.update({
            where: { id: item.targetId },
            data: {
              ...(item.nama != null && { keterangan: item.nama }),
              ...(item.nominalAlokasi != null && { nominalAlokasi: item.nominalAlokasi }),
            },
          });

        } else if (item.aksi === 'HAPUS') {
          if (!item.targetId) continue;
          const hasReimbs = await tx.reimbursement.count({ where: { keteranganAnggaranId: item.targetId } });
          if (hasReimbs > 0) {
            throw new Error(`KeteranganAnggaran id=${item.targetId} masih memiliki ${hasReimbs} data pengajuan (Reimbursement/Realisasi). Hapus/ganti dulu pengajuan terkait.`);
          }
          await tx.keteranganAnggaran.delete({ where: { id: item.targetId } });
        }
      }

      await tx.pengajuanAnggaranItem.deleteMany({ where: { id: { in: targetItemIds } } });

      const remaining = await tx.pengajuanAnggaranItem.count({ where: { pengajuanId } });
      if (remaining === 0) {
        await tx.pengajuanAnggaran.update({
          where: { id: pengajuanId },
          data: { status: 'DISETUJUI', catatan: catatan?.trim() || null, processedAt: new Date() },
        });
        closed = true;
      }
    });

    await prisma.notification.create({
      data: {
        userId: pengajuan.pengajuId,
        tipe: 'PENGAJUAN_DISETUJUI',
        pesan: closed
          ? `Pengajuan "${pengajuan.judul}" telah disetujui oleh ${reviewerName}`
          : `${targetItems.length} item dari pengajuan "${pengajuan.judul}" telah disetujui oleh ${reviewerName}. Sisa item lain masih menunggu review.`,
      },
    });

    if (approverId) {
      const itemSummary = [...subItems, ...ketItems].map((i) => `${i.aksi} ${i.tipe} ${i.nama || ''}`).join(', ');
      await prisma.auditTrail.create({
        data: {
          userId: approverId,
          aksi: 'review_pengajuan_anggaran',
          detail: `${reviewerName} menyetujui ${isPartial ? `sebagian item (${targetItems.length})` : 'seluruh item'} pada pengajuan "${pengajuan.judul}" untuk proyek ${pengajuan.proyek.nama}. Items: ${itemSummary}`,
        },
      });
    }

    const final = await prisma.pengajuanAnggaran.findUnique({
      where: { id: pengajuanId },
      include: { items: true, pengaju: { select: { id: true, nama: true } }, proyek: { select: { nama: true } } },
    });

    clearCache('proyek:');
    clearCache('dashboard:');
    return NextResponse.json({
      message: closed ? 'Pengajuan disetujui dan perubahan telah diterapkan' : 'Item terpilih disetujui, sisa item masih menunggu review',
      pengajuan: final,
    });

  } catch (error) {
    console.error('Review pengajuan error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'RACE_CONDITION') {
      return NextResponse.json({ message: 'Pengajuan sudah diproses oleh reviewer lain' }, { status: 409 });
    }
    
    return NextResponse.json({ message: 'Internal server error', error: message }, { status: 500 });
  }
}