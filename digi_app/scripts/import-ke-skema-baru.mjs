// IMPORT DATA — restore backup JSON ke schema anggaran baru
// Jalanin SETELAH `npx prisma db push --force-reset` && `npx prisma generate`
//
// Cara pakai: npx tsx scripts/import-ke-skema-baru.mjs
//
// Urutan insert (sesuai FK dependency):
//   1. user
//   2. proyek
//   3. userProyek
//   4. budget
//   5. chartOfAccounts
//   6. mainAnggaran       ← dari posAnggaran
//   7. subAnggaran        ← auto-generate 1 per main
//   8. keteranganAnggaran ← auto-generate 1 per sub
//   9. reimbursement      ← FK dipindah ke keteranganAnggaranId
//  10. approval
//  11. jurnalAkuntansi
//  12. auditTrail
//  13. notification

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { readFileSync } from 'fs';

const BACKUP_FILE = 'backup-2026-07-13.json';

const url = process.env.DATABASE_URL;
if (!url) { console.error('❌ DATABASE_URL not set'); process.exit(1); }

const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ── Helper: reset sequence setelah insert dengan ID eksplisit ──
async function resetSeq(tableName, maxId) {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"${tableName}"', 'id'), ${maxId}, true)`
  );
}

async function main() {
  // ── Baca backup ──
  let backup;
  try {
    backup = JSON.parse(readFileSync(BACKUP_FILE, 'utf-8'));
  } catch {
    console.error(`❌ File tidak ditemukan: ${BACKUP_FILE}`);
    process.exit(1);
  }

  const {
    user: users,
    proyek: proyeks,
    userProyek: userProyeks,
    budget: budgets,
    posAnggaran,
    reimbursement: reimbursements,
    approval: approvals,
    jurnalAkuntansi: jurnals,
    chartOfAccounts: coas,
    auditTrail: auditTrails,
    notification: notifications,
  } = backup;

  console.log('\n🚀 Memulai import data...\n');

  // ── 1. User ──
  await prisma.user.createMany({
    data: users.map(u => ({
      id:           u.id,
      nama:         u.nama,
      email:        u.email,
      passwordHash: u.passwordHash,
      role:         u.role,
    })),
  });
  await resetSeq('users', Math.max(...users.map(u => u.id)));
  console.log(`  ✓ [1/13] user: ${users.length} rows`);

  // ── 2. Proyek ──
  await prisma.proyek.createMany({
    data: proyeks.map(p => ({
      id:             p.id,
      nama:           p.nama,
      deskripsi:      p.deskripsi ?? null,
      status:         p.status,
      tanggalMulai:   new Date(p.tanggalMulai),
      tanggalSelesai: p.tanggalSelesai ? new Date(p.tanggalSelesai) : null,
    })),
  });
  await resetSeq('proyek', Math.max(...proyeks.map(p => p.id)));
  console.log(`  ✓ [2/13] proyek: ${proyeks.length} rows`);

  // ── 3. UserProyek ──
  await prisma.userProyek.createMany({
    data: userProyeks.map(up => ({
      id:       up.id,
      proyekId: up.proyekId,
      userId:   up.userId,
      role:     up.role,
      divisi:   up.divisi ?? null,
      joinedAt: new Date(up.joinedAt),
    })),
  });
  await resetSeq('user_proyek', Math.max(...userProyeks.map(u => u.id)));
  console.log(`  ✓ [3/13] userProyek: ${userProyeks.length} rows`);

  // ── 4. Budget ──
  await prisma.budget.createMany({
    data: budgets.map(b => ({
      id:                 b.id,
      proyekId:           b.proyekId,
      rabTotal:           b.rabTotal,
      totalPengeluaran:   b.totalPengeluaran,
      totalReimbursement: b.totalReimbursement,
      sisaBudget:         b.sisaBudget,
    })),
  });
  await resetSeq('budget', Math.max(...budgets.map(b => b.id)));
  console.log(`  ✓ [4/13] budget: ${budgets.length} rows`);

  // ── 5. ChartOfAccounts (PK = string, tidak perlu reset sequence) ──
  if (coas && coas.length > 0) {
    await prisma.chartOfAccounts.createMany({
      data: coas.map(c => ({
        id:        c.id,
        nomorAkun: c.nomorAkun,
        namaAkun:  c.namaAkun,
        tipe:      c.tipe,
        standar:   c.standar,
      })),
    });
    console.log(`  ✓ [5/13] chartOfAccounts: ${coas.length} rows`);
  } else {
    console.log(`  - [5/13] chartOfAccounts: kosong, skip`);
  }

  // ── 6. MainAnggaran (dari posAnggaran, preserve ID lama) ──
  const mainData = posAnggaran.map(p => ({
    id:              p.id,
    budgetId:        p.budgetId,
    namaMain:        p.namaPos,
    nominalAlokasi:  p.nominalAlokasi,
    nominalTerpakai: p.nominalTerpakai,
  }));
  await prisma.mainAnggaran.createMany({ data: mainData });
  await resetSeq('main_anggaran', Math.max(...mainData.map(m => m.id)));
  console.log(`  ✓ [6/13] mainAnggaran: ${mainData.length} rows`);

  // ── 7. SubAnggaran (auto-generate 1 per main, ID offset 1000) ──
  const subData = mainData.map((m, i) => ({
    id:              1000 + i,
    mainAnggaranId:  m.id,
    namaSub:         m.namaMain,
    nominalAlokasi:  m.nominalAlokasi,
    nominalTerpakai: m.nominalTerpakai,
  }));
  await prisma.subAnggaran.createMany({ data: subData });
  await resetSeq('sub_anggaran', Math.max(...subData.map(s => s.id)));
  console.log(`  ✓ [7/13] subAnggaran: ${subData.length} rows`);

  // ── 8. KeteranganAnggaran (auto-generate 1 per sub, ID offset 2000) ──
  const ketData = subData.map((s, i) => ({
    id:               2000 + i,
    subAnggaranId:    s.id,
    keterangan:       'Migrasi otomatis',
    nominalAlokasi:   mainData[i].nominalAlokasi,
    nominalRealisasi: mainData[i].nominalTerpakai,
  }));
  await prisma.keteranganAnggaran.createMany({ data: ketData });
  await resetSeq('keterangan_anggaran', Math.max(...ketData.map(k => k.id)));
  console.log(`  ✓ [8/13] keteranganAnggaran: ${ketData.length} rows`);

  // mapping: posAnggaranId lama → keteranganAnggaranId baru
  const fkMapping = new Map();
  mainData.forEach((m, i) => fkMapping.set(m.id, ketData[i].id));

  // ── 9. Reimbursement (FK dipindah ke keteranganAnggaranId) ──
  let skipR = 0;
  const reimbData = [];
  for (const r of reimbursements) {
    const newKetId = fkMapping.get(r.posAnggaranId);
    if (!newKetId) {
      console.warn(`    ⚠ reimbursement id=${r.id} posAnggaranId=${r.posAnggaranId} tidak ada di mapping, skip`);
      skipR++;
      continue;
    }
    reimbData.push({
      id:                   r.id,
      userId:               r.userId,
      proyekId:             r.proyekId,
      keteranganAnggaranId: newKetId,
      nominal:              r.nominal,
      urlStruk:             r.urlStruk,
      ocrData:              r.ocrData,
      fraudFlag:            r.fraudFlag,
      status:               r.status,
    });
  }
  await prisma.reimbursement.createMany({ data: reimbData });
  await resetSeq('reimbursement', Math.max(...reimbData.map(r => r.id)));
  console.log(`  ✓ [9/13] reimbursement: ${reimbData.length} rows (skip: ${skipR})`);

  // ── 10. Approval ──
  if (approvals && approvals.length > 0) {
    await prisma.approval.createMany({
      data: approvals.map(a => ({
        id:              a.id,
        reimbursementId: a.reimbursementId,
        approverId:      a.approverId,
        level:           a.level,
        status:          a.status,
        catatan:         a.catatan ?? null,
        timestamp:       new Date(a.timestamp),
      })),
    });
    await resetSeq('approval', Math.max(...approvals.map(a => a.id)));
    console.log(`  ✓ [10/13] approval: ${approvals.length} rows`);
  } else {
    console.log(`  - [10/13] approval: kosong, skip`);
  }

  // ── 11. JurnalAkuntansi ──
  if (jurnals && jurnals.length > 0) {
    await prisma.jurnalAkuntansi.createMany({
      data: jurnals.map(j => ({
        id:              j.id,
        reimbursementId: j.reimbursementId,
        noAkunKredit:    j.noAkunKredit,
        noAkunDebit:     j.noAkunDebit,
        nominal:         j.nominal,
        keterangan:      j.keterangan ?? null,
      })),
    });
    await resetSeq('jurnal_akuntansi', Math.max(...jurnals.map(j => j.id)));
    console.log(`  ✓ [11/13] jurnalAkuntansi: ${jurnals.length} rows`);
  } else {
    console.log(`  - [11/13] jurnalAkuntansi: kosong, skip`);
  }

  // ── 12. AuditTrail ──
  if (auditTrails && auditTrails.length > 0) {
    await prisma.auditTrail.createMany({
      data: auditTrails.map(a => ({
        id:        a.id,
        userId:    a.userId,
        aksi:      a.aksi,
        detail:    a.detail,
        timestamp: new Date(a.timestamp),
      })),
    });
    await resetSeq('audit_trail', Math.max(...auditTrails.map(a => a.id)));
    console.log(`  ✓ [12/13] auditTrail: ${auditTrails.length} rows`);
  } else {
    console.log(`  - [12/13] auditTrail: kosong, skip`);
  }

  // ── 13. Notification ──
  if (notifications && notifications.length > 0) {
    await prisma.notification.createMany({
      data: notifications.map(n => ({
        id:        n.id,
        userId:    n.userId,
        tipe:      n.tipe,
        pesan:     n.pesan,
        dibaca:    n.dibaca,
        timestamp: new Date(n.timestamp),
      })),
    });
    await resetSeq('notifications', Math.max(...notifications.map(n => n.id)));
    console.log(`  ✓ [13/13] notification: ${notifications.length} rows`);
  } else {
    console.log(`  - [13/13] notification: kosong, skip`);
  }

  // ── Verifikasi akhir ──
  const [cMain, cSub, cKet, cReimb, orphan] = await Promise.all([
    prisma.mainAnggaran.count(),
    prisma.subAnggaran.count(),
    prisma.keteranganAnggaran.count(),
    prisma.reimbursement.count(),
    prisma.reimbursement.count({ where: { keteranganAnggaranId: 0 } }),
  ]);

  console.log('\n✅ Import selesai!');
  console.log(`   MainAnggaran:        ${cMain}`);
  console.log(`   SubAnggaran:         ${cSub}`);
  console.log(`   KeteranganAnggaran:  ${cKet}`);
  console.log(`   Reimbursement total: ${cReimb}`);
  if (orphan > 0) {
    console.warn(`   ⚠ Reimbursement tanpa FK valid: ${orphan}`);
  } else {
    console.log(`   Reimbursement FK:    semua valid ✓`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
