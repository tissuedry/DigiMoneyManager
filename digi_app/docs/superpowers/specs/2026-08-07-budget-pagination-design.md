# Pagination Server-side di Halaman Budget

**Tanggal:** 2026-08-07
**Status:** Disetujui
**Cakupan:** Halaman `app/keuangan/budget/page.tsx` dan `app/superadmin/budget/page.tsx`, plus API `app/api/proyek/route.ts`.

## Latar Belakang / Masalah

Halaman Budget hanya menampilkan 4 proyek pada section "Budget Aktif" padahal ada lebih dari 4 proyek ber-budget. Akar masalah: API `/api/proyek` melakukan pagination server-side dengan default `limit=4`, sementara kedua halaman memanggilnya tanpa `limit`, sehingga hanya 4 proyek pertama yang dikembalikan.

Solusi awal (fetch `?limit=1000`) memunculkan kartu lengkap namun menarik seluruh data — tidak ideal saat jumlah proyek banyak. Desain ini menggantinya dengan pagination server-side per section.

## Tujuan

- Kedua section ("Perlu Diinisialisasi" dan "Budget Aktif") dapat berpindah halaman.
- Data yang diambil server hanya sejumlah kartu per halaman (bukan semua proyek).
- Angka summary selalu akurat (dari total, bukan dari potongan halaman).
- Perilaku lama (tanpa `budgetStatus`) tidak berubah.

## Non-Tujuan

- Tidak ada pagination pada halaman proyek lain (manager/superadmin proyek, dll).
- Tidak ada perubahan skema database.
- Tidak ada filter/search tambahan.

## Desain

### 1. API `app/api/proyek/route.ts` (GET)

- Query param baru: `budgetStatus` = `all` | `has` | `none`. Default `all`.
- `budgetStatus` dimasukkan ke `cacheKey` dan `finalWhere`:
  - `has` → `{ budget: { isNot: null } }`
  - `none` → `{ budget: { is: null } }`
  - `all` (default) → tidak menambah filter.
- `limit` default tetap `4` (tidak berubah).
- Response sudah memuat `pagination.totalItems`, `totalPages`, `currentPage`, `limit`.
- Mapping `budget.posAnggaran` tidak berubah.

### 2. Komponen baru `Pagination`

File baru kecil (mis. `app/keuangan/budget/Pagination.tsx`, atau komponen bersama). Props:

- `page: number`
- `totalPages: number`
- `onChange: (page: number) => void`

Render: tombol Prev (`ChevronLeft`), label `Halaman {page} dari {totalPages}`, tombol Next (`ChevronRight`). Tombol disabled di ujung. Gaya serasi dengan halaman (`border-stone-200`, `text-stone-600`, `hover:bg-stone-50`).

Dipakai bersama di kedua section di kedua halaman.

### 3. Halaman `keuangan/budget/page.tsx` dan `superadmin/budget/page.tsx`

State menggantikan `proyekList` tunggal:

- `noBudgetList: Proyek[]`, `noBudgetTotal: number`
- `hasBudgetList: Proyek[]`, `hasBudgetTotal: number`
- `pageNoBudget`, `pageHasBudget` (awal `1`)
- `loading`, `error`

Fetch:

- `fetchSection(status: 'has' | 'none', page: number)` → `fetch('/api/proyek?limit=4&budgetStatus=${status}&page=${page}')`, simpan `data.projects` dan `data.pagination.totalItems`.
- Dipanggil saat mount dan saat berpindah halaman (satu section fetch sendiri-sendiri; section lain tidak perlu di-refetch).

Summary cards:

- "Total Proyek Aktif" = `noBudgetTotal + hasBudgetTotal`
- "Budget Belum Diinisialisasi" = `noBudgetTotal`
- "Budget Aktif" = `hasBudgetTotal`

Section render kartu dari `noBudgetList` / `hasBudgetList`. `Pagination` tampil di bawah section hanya jika `totalPages > 1`.

Error: banner merah + tombol "Coba Lagi" bila fetch gagal.

Modal `BudgetFormModal` dan export Excel tidak berubah; kartu tetap memakai `key={p.id}`.

### 4. Catatan implementasi

- Ganti `?limit=1000` yang ditambahkan sebelumnya pada kedua halaman — sudah menjadi bagian dari pagination baru ini.
- `EditMainModal.tsx` tetap memakai `?limit=1000` (dropdown perlu semua proyek) — di luar cakupan.

## Error Handling

- Fetch gagal per section → `error` state; tampilkan pesan + tombol coba lagi. Tidak memblokir section lain.
- Sisa behavior (gagal menyimpan budget, export) tidak berubah.

## Testing

- Tidak ada logika uang/aritmetika baru; pagination adalah state UI + fetch.
- Verifikasi manual pada kedua halaman:
  1. Buka halaman, pastikan tiap section memuat 4 kartu atau kurang bila total ≤ 4.
  2. Pindah halaman → list berubah, `Halaman X dari Y` benar.
  3. Angka summary tidak berubah saat berpindah halaman.
  4. Section tanpa tombol pagination bila hanya 1 halaman.
  5. Tombol Prev/Next disabled di ujung.
