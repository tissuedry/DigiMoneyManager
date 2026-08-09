# Perubahan Alokasi Anggaran MainAnggaran — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengubah alur "Edit Alokasi" pada MainAnggaran di DetailAnggaran PM menjadi pengajuan perubahan alokasi yang direview Direktur (approve/reject), dengan batas total = `rabTotal`, menggantikan total alur `PengajuanAnggaran` lama.

**Architecture:** Schema `PengajuanAnggaran` dirombak dari model item-based (PengajuanAnggaranItem dihapus) menjadi 1 pengajuan = 1 perubahan alokasi MainAnggaran. API `pengajuan-anggaran` (POST/GET) dan `review` ditulis ulang total. Frontend: PM pakai modal baru `PerubahanAlokasiModal` dari baris Main `DetailAnggaran`; Direktur pakai `PendingPmModal` baru (checkbox list + detail Anggaran Saat Ini vs Baru). Badge status ditambahkan di baris Main DetailAnggaran.

**Tech Stack:** Next.js 16 App Router (API route handlers), Prisma 7 + PostgreSQL (schema-only, `npx prisma db push`), React 19 + Tailwind 4 (client components), lucide-react icons, shared modals `ConfirmDialog`/`SuccessDialog`/`Toast`.

## Global Constraints

- Role strings verbatim: `'Direktur / Manajemen'`, `'Project Manager'`, `'Superadmin'`, `'superadmin'`.
- Status pengajuan stringly-typed: `'PENDING'` (default) | `'DISETUJUI'` | `'REJECT'`.
- Batas alokasi: jumlah alokasi semua Main ≤ `Budget.rabTotal`; `alokasiBaru` ≥ jumlah alokasi Sub child dari Main itu.
- **JANGAN menyentuh** `AjukanPos.tsx` (pm & superadmin), `EditAlokasi.tsx` (masih dipakai Sub/Keterangan), `app/keuangan/*`, `app/karyawan/*`.
- **JANGAN menyentuh file `app/superadmin/**`** (UI). Task 7 hanya dokumentasi untuk orang lain.
- Notifikasi tipe yang sudah ada: `PENGAJUAN_ANGGARAN` (ke Direktur saat ajukan), `PENGAJUAN_DISETUJUI` / `PENGAJUAN_DITOLAK` (ke pengaju). Dipakai ulang.
- Prisma migrations: **tidak ada folder `prisma/migrations`** — gunakan `npx prisma db push`. Data lama pengajuan dianggap dihapus user.
- Build/lint: `cd digi_app && npm run lint` (eslint) dan `npm run build` (prisma generate + next build).
- Default cache invalidation setelah tulis data: `clearCache('proyek:')` dan `clearCache('dashboard:')`.

---

### Task 1: Skema database — PengajuanAnggaran baru + hapus PengajuanAnggaranItem

**Files:**
- Modify: `digi_app/prisma/schema.prisma`
- Test: `digi_app/scripts/check-schema.ts` (script one-off, dijalankan dengan `npx tsx`)

**Interfaces:**
- Produces: model `PengajuanAnggaran` dengan field `id, proyekId, pengajuId, mainAnggaranId, judul, deskripsi, status, catatan, alokasiLama, alokasiBaru, createdAt, processedAt`. Relasi: `pengaju` → User, `proyek` → Proyek, `mainAnggaran` → MainAnggaran. Model `PengajuanAnggaranItem` dihapus.
- Consumes: model `MainAnggaran`, `Proyek`, `User` yang sudah ada.

- [x] **Step 1: Tulis schema baru**

Ganti seluruh blok `model PengajuanAnggaran`, hapus `model PengajuanAnggaranItem`, tambah relasi `pengajuanPerubahan` di `MainAnggaran`:

```prisma
model PengajuanAnggaran {
  id             Int           @id @default(autoincrement())
  proyekId       Int           @map("proyek_id")
  pengajuId      Int           @map("pengaju_id")
  mainAnggaranId Int           @map("main_anggaran_id")
  judul          String
  deskripsi      String?
  status         String        @default("PENDING")
  catatan        String?
  alokasiLama    Decimal       @map("alokasi_lama") @db.Decimal(15, 2)
  alokasiBaru    Decimal       @map("alokasi_baru") @db.Decimal(15, 2)
  createdAt      DateTime      @default(now()) @map("created_at")
  processedAt    DateTime?     @map("diproses_pada")
  pengaju        User          @relation(fields: [pengajuId], references: [id], onDelete: Cascade)
  proyek         Proyek        @relation(fields: [proyekId], references: [id], onDelete: Cascade)
  mainAnggaran   MainAnggaran  @relation(fields: [mainAnggaranId], references: [id], onDelete: Cascade)

  @@index([proyekId, status])
  @@index([status, createdAt])
  @@index([mainAnggaranId, status])
  @@map("pengajuan_anggaran")
}
```

- [x] **Step 2: Terapkan schema** — `npx prisma db push` (dilakukan user)
- [x] **Step 3: Verifikasi** — `npx tsx scripts/check-schema.ts` → `schema-ok`
- [x] **Step 4: Commit**

### Task 2: API — POST/GET `/api/proyek/[id]/pengajuan-anggaran` (tulis ulang total)

- [x] Step 1: `scripts/test-pengajuan-api.ts` (test `validateAlokasi`)
- [x] Step 2: test gagal
- [x] Step 3: tulis ulang route (POST body `{ mainAnggaranId, alokasiBaru, catatan? }`, validasi rabTotal & blokir ganda, notifikasi ke Direktur; GET list include `mainAnggaran`+`pengaju`)
- [x] Step 4: test pass
- [x] Step 5: tsc + lint
- [x] Step 6: commit

### Task 3: API — PUT `/api/pengajuan-anggaran/[id]/review` (tulis ulang total)

- [x] Step 1: `scripts/test-review-api.ts` (test `computeApproveError`)
- [x] Step 2: test gagal
- [x] Step 3: tulis ulang route (APPROVE: `$transaction` validasi batas + update `MainAnggaran.nominalAlokasi`; REJECT: status+catatan; notif + AuditTrail + clearCache; error 409 RACE / 422 VALIDATION)
- [x] Step 4: test pass
- [x] Step 5: tsc + lint
- [x] Step 6: commit

### Task 4: API — sesuaikan `pending` route + `pendingPmCount` + helpers

- [x] Step 1: `app/api/pengajuan-anggaran/pending/route.ts` (drop `items`)
- [x] Step 2: `app/api/proyek/[id]/route.ts` `pendingPmCount` → `count({ proyekId, status: 'PENDING' })`
- [x] Step 3: tsc
- [x] Step 4: commit

### Task 5: Frontend PM — `PerubahanAlokasiModal` baru + badge status di `DetailAnggaran`

- [x] Step 1: buat `app/pm/proyek/PerubahanAlokasiModal.tsx` (input alokasi baru, kartu Saat Ini vs Baru, validasi client, `POST pengajuan-anggaran`, ConfirmDialog + SuccessDialog)
- [x] Step 2: modifikasi `app/pm/proyek/DetailAnggaran.tsx` (fetch status pengajuan per main, badge status, baris Main buka modal baru + disabled saat PENDING; Sub/Ket tetap EditAlokasiModal)
- [x] Step 3: tsc + lint
- [x] Step 4: commit

### Task 6: Frontend Direktur — `PendingPmModal` baru (checkbox list)

- [x] Step 1: tulis ulang `app/manager/proyek/PendingPmModal.tsx` (checkbox list per pengajuan, expand detail Saat Ini vs Baru, Setujui/Tolak)
- [x] Step 2: update `app/manager/proyek/page.tsx` (sederhanakan `handleBulkReview`, `fetchPendingPengajuan`, rename props)
- [x] Step 3: tsc + lint
- [x] Step 4: commit

### Task 7: [DEFERRED — JANGAN DIIMPLEMENTASIKAN] Superadmin — mirror PendingPmModal + page.tsx

> ⚠️ TIDAK dikerjakan dalam scope ini. Ditulis untuk dokumentasi orang lain.
> Setelah Task 6 selesai, salin `app/manager/proyek/PendingPmModal.tsx` → `app/superadmin/proyek/PendingPmModal.tsx`
> dan update `app/superadmin/proyek/page.tsx` dengan cara yang sama seperti Task 6 (sederhanakan `handleBulkReview` + `fetchPendingPengajuan`, rename props `selectedIds`/`setSelectedIds`).

### Task 8: AI chat context — hapus referensi `items`

- [x] Step 1: `lib/temp-data-repo.ts` — include ganti `items` → `mainAnggaran`; mapping `pengajuanAnggaranContext` pakai `mainAnggaran`/`alokasiLama`/`alokasiBaru`
- [x] Step 2: `app/api/smart-chat/route.ts` — baris 174 pakai field baru
- [x] Step 3: tsc + lint
- [x] Step 4: commit

### Task 9: Verifikasi akhir

- [x] Step 1: `npx tsc --noEmit` + `npx eslint .` (0 errors)
- [x] Step 2: `npm run build` (sukses)
- [ ] Step 3: smoke test manual (PM ajukan → badge Menunggu; Direktur setujui → alokasi terupdate)
- [x] Step 4: hapus script sementara (`scripts/check-schema.ts`, `test-pengajuan-api.ts`, `test-review-api.ts`) + commit
