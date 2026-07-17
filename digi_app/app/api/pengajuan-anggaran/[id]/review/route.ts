import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearCache } from '@/lib/route-cache';

// PUT: Direktur review pengajuan (setujui / tolak)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    if (role !== 'Direktur / Manajemen') {
      return NextResponse.json({ message: 'Forbidden: Only Direktur can review proposals' }, { status: 403 });
    }

    const { id: pengajuanIdStr } = await params;
    const pengajuanId = parseInt(pengajuanIdStr, 10);

    const body = await req.json();
    const { status: targetStatus, catatan } = body;

    if (!['APPROVE', 'REJECT'].includes(targetStatus)) {
      return NextResponse.json({ message: 'status must be APPROVE or REJECT' }, { status: 400 });
    }

    // ℹ️ Atomic check-and-set: cuma update kalau status masih PENDING.
    // Ini mencegah race condition — dua Direktur approve bersamaan.
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

    // DITOLAK — cukup update status + notif
    if (targetStatus === 'REJECT') {
      const updated = await prisma.pengajuanAnggaran.update({
        where: { id: pengajuanId },
        data: { status: 'REJECT', catatan: catatan?.trim() || null, processedAt: new Date() },
        include: { items: true, pengaju: { select: { id: true, nama: true } }, proyek: { select: { nama: true } } },
      });

      await prisma.notification.create({
        data: {
          userId: pengajuan.pengajuId,
          tipe: 'PENGAJUAN_DITOLAK',
          pesan: `Pengajuan "${pengajuan.judul}" untuk proyek ${updated.proyek.nama} ditolak.${catatan ? ` Alasan: ${catatan}` : ''}`,
        },
      });

      return NextResponse.json({ message: 'Pengajuan ditolak', pengajuan: updated });
    }

    const userId = req.headers.get('x-user-id');
    const approverId = userId ? parseInt(userId, 10) : 0;

    // DISETUJUI — eksekusi perubahan dalam transaction.
    // Process SUB_ANGGARAN first agar real ID tersedia untuk KETERANGAN yg reference draft subs.
    type Item = { tipe: string; aksi: string; targetId: number | null; parentId: number | null; nama: string | null; nominalAlokasi: number | null };

    const subItems = pengajuan.items.filter((i) => i.tipe === 'SUB_ANGGARAN') as Item[];
    const ketItems = pengajuan.items.filter((i) => i.tipe === 'KETERANGAN') as Item[];

    let totalNewAlokasi = 0;
    // Map untuk resolve draft parentId: Date.now()→real DB id
    const subIdMap = new Map<number, number>();

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

      // 5. Mark as approved
      await tx.pengajuanAnggaran.update({
        where: { id: pengajuanId },
        data: { status: 'DISETUJUI', catatan: catatan?.trim() || null, processedAt: new Date() },
      });
    });

    // Notify PM
    await prisma.notification.create({
      data: {
        userId: pengajuan.pengajuId,
        tipe: 'PENGAJUAN_DISETUJUI',
        pesan: `Pengajuan "${pengajuan.judul}" telah disetujui oleh Direktur`,
      },
    });

    // Audit trail
    if (approverId) {
      const itemSummary = [...subItems, ...ketItems].map((i) => `${i.aksi} ${i.tipe} ${i.nama || ''}`).join(', ');
      await prisma.auditTrail.create({
        data: {
          userId: approverId,
          aksi: 'review_pengajuan_anggaran',
          detail: `Direktur menyetujui pengajuan "${pengajuan.judul}" untuk proyek ${pengajuan.proyek.nama}. Items: ${itemSummary}`,
        },
      });
    }

    const final = await prisma.pengajuanAnggaran.findUnique({
      where: { id: pengajuanId },
      include: { items: true, pengaju: { select: { id: true, nama: true } }, proyek: { select: { nama: true } } },
    });

    clearCache('proyek:');
    clearCache('dashboard:');
    return NextResponse.json({ message: 'Pengajuan disetujui dan perubahan telah diterapkan', pengajuan: final });
  } catch (error) {
    console.error('Review pengajuan error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'RACE_CONDITION') {
      return NextResponse.json({ message: 'Pengajuan sudah diproses oleh reviewer lain' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error', error: message }, { status: 500 });
  }
}
