import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearCache } from '@/lib/route-cache';

// PUT: Direktur review pengajuan (setujui / tolak)
// Body: { status: 'APPROVE'|'REJECT', catatan?: string, itemIds?: number[] }
// itemIds opsional — kalau diisi, hanya item tsb yang diproses; sisanya tetap PENDING
// di pengajuan yang sama. Pengajuan baru ditandai DISETUJUI/REJECT kalau semua itemnya sudah habis diproses.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    if (role !== 'Direktur / Manajemen') {
      return NextResponse.json({ message: 'Forbidden: Only Direktur can review proposals' }, { status: 403 });
    }

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

    // Kalau itemIds diisi, hanya proses item yang diminta. Kalau kosong/tidak ada, proses semua item (backward compatible).
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

    // DITOLAK — hapus item yang ditolak; tutup pengajuan hanya kalau sudah tidak ada item tersisa
    if (targetStatus === 'REJECT') {
      let closed: { status: string } | null = null;

      // Kalau yang ditolak adalah SUB BARU (draft, aksi TAMBAH) yang belum pernah ada di DB, keterangan
      // yang masih pending di bawahnya otomatis ikut ditolak — parentId draft-nya tidak akan pernah valid.
      const cascadeIds = new Set<number>();
      targetItems.forEach((item) => {
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
            ? `Pengajuan "${pengajuan.judul}" untuk proyek ${pengajuan.proyek.nama} ditolak.${catatan ? ` Alasan: ${catatan}` : ''}`
            : `${targetItems.length} item${cascadeNote} dari pengajuan "${pengajuan.judul}" untuk proyek ${pengajuan.proyek.nama} ditolak.${catatan ? ` Alasan: ${catatan}` : ''} Sisa item lain masih menunggu review.`,
        },
      });

      if (approverId) {
        const itemSummary = targetItems.map((i) => `${i.aksi} ${i.tipe} ${i.nama || ''}`).join(', ');
        await prisma.auditTrail.create({
          data: {
            userId: approverId,
            aksi: 'review_pengajuan_anggaran',
            detail: `Direktur menolak ${isPartial ? `sebagian item (${targetItems.length})${cascadeNote}` : 'seluruh item'} pada pengajuan "${pengajuan.judul}" untuk proyek ${pengajuan.proyek.nama}. Items: ${itemSummary}`,
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
    // Process SUB_ANGGARAN first agar real ID tersedia untuk KETERANGAN yg reference draft subs.
    type Item = { id: number; tipe: string; aksi: string; targetId: number | null; parentId: number | null; nama: string | null; nominalAlokasi: number | null };

    const subItems = targetItems.filter((i) => i.tipe === 'SUB_ANGGARAN') as Item[];
    const ketItems = targetItems.filter((i) => i.tipe === 'KETERANGAN') as Item[];

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

    let totalNewAlokasi = 0;
    // Map untuk resolve draft parentId: Date.now()→real DB id
    const subIdMap = new Map<number, number>();
    let closed = false;

    await prisma.$transaction(async (tx) => {
      // 1. Re-verify belum diproses (atomic guard)
      const current = await tx.pengajuanAnggaran.findUnique({ where: { id: pengajuanId }, select: { status: true } });
      if (!current || current.status !== 'PENDING') {
        throw new Error('RACE_CONDITION');
      }

      // 2. Process SUB_ANGGARAN first — bangun ID map
      for (const item of subItems) {
        if (item.aksi === 'TAMBAH') {
          if (!item.parentId) throw new Error('parentId required for SUB_ANGGARAN TAMBAH');
          const created = await tx.subAnggaran.create({
            data: {
              mainAnggaranId: item.parentId,
              namaSub: item.nama || '',
              nominalAlokasi: item.nominalAlokasi ?? 0,
            },
          });
          // Map draft ID (dari frontend Date.now()) → real DB id
          if (item.targetId) subIdMap.set(item.targetId, created.id);
          // ponytail: Number() wajib — item.nominalAlokasi adalah Prisma Decimal (string/Decimal.js),
          // tanpa ini `+=` jadi string concatenation → total membesar tak terhingga → numeric overflow.
          totalNewAlokasi += Number(item.nominalAlokasi ?? 0);
        } else if (item.aksi === 'UBAH') {
          if (!item.targetId) continue;
          const existing = await tx.subAnggaran.findUnique({ where: { id: item.targetId }, select: { nominalAlokasi: true } });
          await tx.subAnggaran.update({
            where: { id: item.targetId },
            data: {
              ...(item.nama != null && { namaSub: item.nama }),
              ...(item.nominalAlokasi != null && { nominalAlokasi: item.nominalAlokasi }),
            },
          });
          if (existing && item.nominalAlokasi != null) {
            totalNewAlokasi += item.nominalAlokasi - Number(existing.nominalAlokasi);
          }
        } else if (item.aksi === 'HAPUS') {
          if (!item.targetId) continue;
          const hasKeterangan = await tx.keteranganAnggaran.count({ where: { subAnggaranId: item.targetId } });
          if (hasKeterangan > 0) {
            throw new Error(`SubAnggaran id=${item.targetId} masih memiliki ${hasKeterangan} keterangan. Hapus keterangannya dulu.`);
          }
          await tx.subAnggaran.delete({ where: { id: item.targetId } });
        }
      }

      // 2.5. Item lain yang masih pending (belum ikut disetujui sekarang) tapi merujuk salah satu
      // draft sub yang baru saja dibuat harus di-repoint ke ID asli, supaya tidak jadi orphan
      // begitu draft ID-nya sudah tidak ada artinya.
      for (const [draftId, realId] of subIdMap.entries()) {
        await tx.pengajuanAnggaranItem.updateMany({
          where: { pengajuanId, parentId: draftId, id: { notIn: targetItemIds } },
          data: { parentId: realId },
        });
      }

      // 3. Process KETERANGAN — resolve draft parentIds
      for (const item of ketItems) {
        // Resolve parentId: kalau parentId adalah draft ID, ganti ke real ID
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
          // ponytail: Number() wajib — item.nominalAlokasi adalah Prisma Decimal (string/Decimal.js),
          // tanpa ini `+=` jadi string concatenation → total membesar tak terhingga → numeric overflow.
          totalNewAlokasi += Number(item.nominalAlokasi ?? 0);
        } else if (item.aksi === 'UBAH') {
          if (!item.targetId) continue;
          const existing = await tx.keteranganAnggaran.findUnique({ where: { id: item.targetId }, select: { nominalAlokasi: true } });
          await tx.keteranganAnggaran.update({
            where: { id: item.targetId },
            data: {
              ...(item.nama != null && { keterangan: item.nama }),
              ...(item.nominalAlokasi != null && { nominalAlokasi: item.nominalAlokasi }),
            },
          });
          if (existing && item.nominalAlokasi != null) {
            totalNewAlokasi += item.nominalAlokasi - Number(existing.nominalAlokasi);
          }
        } else if (item.aksi === 'HAPUS') {
          if (!item.targetId) continue;
          const hasReimbs = await tx.reimbursement.count({ where: { keteranganAnggaranId: item.targetId } });
          if (hasReimbs > 0) {
            throw new Error(`KeteranganAnggaran id=${item.targetId} masih memiliki ${hasReimbs} reimbursement. Hapus/ganti dulu reimbursement-nya.`);
          }
          await tx.keteranganAnggaran.delete({ where: { id: item.targetId } });
        }
      }

      // 4. Update budget totals kalau ada perubahan alokasi
      if (totalNewAlokasi !== 0 && pengajuan.proyek.budget) {
        const newRab = Number(pengajuan.proyek.budget.rabTotal) + totalNewAlokasi;
        const newSisa = Math.max(0, Number(pengajuan.proyek.budget.sisaBudget) + totalNewAlokasi);
        await tx.budget.update({
          where: { id: pengajuan.proyek.budget.id },
          data: { rabTotal: newRab, sisaBudget: newSisa },
        });
      }

      // 5. Item yang sudah diproses dihapus dari daftar pending (sudah masuk ke tabel budget asli)
      await tx.pengajuanAnggaranItem.deleteMany({ where: { id: { in: targetItemIds } } });

      // 6. Tutup pengajuan hanya kalau sudah tidak ada item tersisa
      const remaining = await tx.pengajuanAnggaranItem.count({ where: { pengajuanId } });
      if (remaining === 0) {
        await tx.pengajuanAnggaran.update({
          where: { id: pengajuanId },
          data: { status: 'DISETUJUI', catatan: catatan?.trim() || null, processedAt: new Date() },
        });
        closed = true;
      }
    });

    // Notify PM
    await prisma.notification.create({
      data: {
        userId: pengajuan.pengajuId,
        tipe: 'PENGAJUAN_DISETUJUI',
        pesan: closed
          ? `Pengajuan "${pengajuan.judul}" telah disetujui oleh Direktur`
          : `${targetItems.length} item dari pengajuan "${pengajuan.judul}" telah disetujui oleh Direktur. Sisa item lain masih menunggu review.`,
      },
    });

    // Audit trail
    if (approverId) {
      const itemSummary = [...subItems, ...ketItems].map((i) => `${i.aksi} ${i.tipe} ${i.nama || ''}`).join(', ');
      await prisma.auditTrail.create({
        data: {
          userId: approverId,
          aksi: 'review_pengajuan_anggaran',
          detail: `Direktur menyetujui ${isPartial ? `sebagian item (${targetItems.length})` : 'seluruh item'} pada pengajuan "${pengajuan.judul}" untuk proyek ${pengajuan.proyek.nama}. Items: ${itemSummary}`,
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
