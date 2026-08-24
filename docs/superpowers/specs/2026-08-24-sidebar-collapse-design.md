# Design: Sidebar Collapse (Desktop)

## Tujuan

Sidebar di semua role/halaman dapat ditutup (collapse) sampai hanya menampilkan
ikon menu, dan dibuka kembali. Kondisi collapse bersifat persisten lintas halaman
dan refresh.

## Konteks Saat Ini

- `components/sidebar.tsx` adalah satu-satunya komponen Sidebar, dirender oleh semua
  page/layout (`karyawan`, `pm`, `keuangan`, `manager`, `superadmin`).
- Sidebar sudah punya perilaku mobile open/close lewat props `isSidebarOpen` (overlay)
  dan `onClose` (menutup).
- Di desktop (`lg:`), sidebar selalu tampil penuh `w-64` (tidak bisa di-collapse).
- Page `pm/page.tsx` merender `<Sidebar userRole="Project Manager" />` **tanpa** props
  open/close — sekaligus satu-satunya pemakai yang tidak mengisi state mobile.
- `PanelLeftClose` dan `PanelLeftOpen` tersedia di lucide-react versi terpasang.

## Keputusan

- **Pendekatan:** internal `collapsed` state di dalam `Sidebar`, tidak mengubah prop API.
- **Persistensi:** `localStorage` dengan key `dmm-sidebar-collapsed`.
- **Tombol toggle:** di dalam sidebar (pojok header sidebar), bukan di Header global.
- **Collapse hanya berlaku desktop (`lg:` ke atas).** Di layar `< lg`, perilaku overlay
  mobile yang ada sekarang tetap berfungsi; dobel-tombol (hamburger mobile + chevron
  collapse desktop) tidak bertabrakan karena masing-masing terlihat di breakpoint berbeda.

## Detail Desain

### State & Persistensi

- Tambah state `collapsed` (boolean) di `Sidebar`.
- Inisialisasi dari `localStorage` (guard `typeof window`), default `false`.
- `useEffect` menulis `collapsed` ke localStorage setiap kali berubah.
- Hanya aktif/lazily dibaca ketika ini adalah client (file sudah `"use client"`).

### Lebar & Struktur

- Lebar: `w-64` (expanded) ↔ `w-[72px]` (collapsed).
- Tambahkan kelas `lg:cursor-pointer` pada elemen `<a>` saat collapsed untuk sinyal
  bahwa bisa di-klik (tooltip via `title`/`group-hover`).

### Header Sidebar (logo)

- Saat collapsed: sembunyikan teks "Digi Money Manager" & "Sistem Keuangan Proyek",
  tampilkan hanya logo.
- Tombol toggle baru ditaruh di header sidebar: `PanelLeftClose` saat expanded,
  `PanelLeftOpen` saat collapsed, `onClick` men-toggle `collapsed`.
  - Hanya ditampilkan di `lg:` (kelas `lg:flex hidden`), karena mobile memakai hamburger.
  - Saat collapsed, tombol ditarik agar sejajar (icon saja, tanpa teks).

### Nav Menu

- Saat collapsed:
  - Setiap `Link` hanya menampilkan ikon, di-center-kan (`justify-center`), teks
    disembunyikan.
  - Badge tetap tampil (reposisi agar tidak terpotong, mis. `absolute`/`ml-auto` kecil).
  - Section label (mis. "SUPER ADMIN") disembunyikan saat collapsed.
  - Tambahkan atribut `title={item.name}` agar ikon punya tooltip saat hanya ikon.

### Perilaku Responsif

- Kelas responsif: kondisi `collapsed` hanya memengaruhi lebar pada `lg:` —
  pakai pattern `lg:w-[72px]` vs default `w-64`, sementara variants tergantung state.
- Baris mobile-open (translate overlay) tidak berubah.

## File yang Disentuh

- `digi_app/components/sidebar.tsx` — satu-satunya file diubah.

Tidak ada perubahan pada layout/page lain karena Sidebar mengelola state internal.

## Pengujian

- Manual: login sebagai tiap role → toggle collapse di desktop → hanya ikon tampil →
  badge tetap terlihat → klik ikon menavigasi → refresh/pindah halaman → tetap collapsed.
- Mobile: hamburger membuka overlay penuh; tombol collapse desktop tidak muncul.

## Dokumentasi

- Spesifikasi ini: `docs/superpowers/specs/2026-08-24-sidebar-collapse-design.md`

## Yang Tidak Termasuk (YAGNI)

- Hover-expand mengambang (flyout) — tidak diperlukan karena collapse persisten.
- State global lewat Context.
- Animasi ikon/tombol yang kompleks.
- Ubah API prop Sidebar.