# Digi Money Manager

Digi Money Manager adalah aplikasi web untuk mengelola keuangan proyek: RAB, reimbursement, approval bertahap, jurnal akuntansi, laporan keuangan, audit trail, notifikasi, dan smart chat berbasis AI.

Kode aplikasi berada di folder `digi_app`. Semua perintah di panduan ini dijalankan dari folder tersebut, kecuali disebutkan lain.

## Daftar Isi

- [Tech Stack](#tech-stack)
- [Layanan AI yang Dipakai](#layanan-ai-yang-dipakai)
- [Fitur](#fitur)
- [Struktur Repository](#struktur-repository)
- [Panduan Setup](#panduan-setup)
  - [1. Prasyarat](#1-prasyarat)
  - [2. Clone dan install](#2-clone-dan-install)
  - [3. Buat file `.env`](#3-buat-file-env)
  - [4. Siapkan database](#4-siapkan-database)
  - [5. Jalankan aplikasi](#5-jalankan-aplikasi)
  - [6. Login pertama](#6-login-pertama)
- [Perintah Lain](#perintah-lain)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Catatan Keamanan](#catatan-keamanan)

## Tech Stack

| Bagian | Teknologi |
|---|---|
| Frontend & Backend | Next.js 16 (App Router), React 19 |
| Bahasa | TypeScript |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL |
| ORM | Prisma 7 (dengan driver adapter `pg`) |
| Autentikasi | JWT yang disimpan di cookie HttpOnly `auth_token` |
| OCR struk | Google Gemini API |
| Smart Chat | Groq API |
| Penyimpanan struk | Supabase Storage (atau folder lokal saat development) |
| Dokumentasi API | Swagger UI di `/api-docs` |

## Layanan AI yang Dipakai

Aplikasi ini memakai **dua layanan AI yang berbeda**, masing-masing dengan API key sendiri. Keduanya sering tertukar, jadi perhatikan pembagiannya:

| Fitur | Layanan | Model | Variabel `.env` |
|---|---|---|---|
| OCR struk/nota | **Google Gemini** (model vision buatan Google) | `gemini-3.5-flash-lite`, cadangan `gemini-3.1-flash-lite` | `GEMINI_API_KEY` |
| Smart Chat | **Groq** (penyedia inferensi, bukan bagian dari Google) | `openai/gpt-oss-120b` | `GROQ_API_KEY` |

Groq tidak dipakai untuk OCR, dan Gemini tidak dipakai untuk Smart Chat.

## Fitur

### Autentikasi & Role

- Login dengan email dan password; sesi berlaku 24 jam
- Akses halaman dan API dibatasi berdasarkan role
- Setiap role punya dashboard sendiri:

| Role | Dashboard |
|---|---|
| Karyawan | `/karyawan` (memilih proyek dulu di `/select-project`) |
| Project Manager | `/pm` |
| Tim Keuangan | `/keuangan` |
| Direktur / Manajemen | `/manager` |
| Superadmin | `/superadmin` |

### Manajemen Proyek

- Buat dan kelola proyek, termasuk tanggal mulai dan selesai
- Kelola anggota proyek dan role per user
- Atur RAB proyek, pos anggaran, dan termin pembayaran
- Pengajuan perubahan anggaran beserta review-nya

### Reimbursement

- Karyawan mengajukan reimbursement dan mengunggah struk/nota
- Data struk diekstrak otomatis dengan OCR (Google Gemini)
- Approval bertahap:
  1. Project Manager memvalidasi pengajuan
  2. Tim Keuangan menyetujui dan mengisi akun debit/kredit
- Karyawan dapat membatalkan pengajuan yang masih menunggu approval

### Akuntansi & Laporan

- Chart of Accounts
- Jurnal akuntansi otomatis saat reimbursement disetujui Tim Keuangan
- Pencatatan pemasukan proyek
- Laporan buku besar, neraca, dan laba rugi, dengan export JSON atau CSV

### Dashboard, Notifikasi & Audit

- Dashboard ringkas sesuai role
- Notifikasi pengajuan reimbursement baru
- Audit trail aktivitas penting

### Smart Chat

- Tanya data keuangan dengan bahasa sehari-hari, misalnya:
  - Berapa sisa budget proyek saat ini?
  - Apa pengeluaran terbesar proyek ini?
  - Tampilkan jurnal terbaru

## Struktur Repository

```txt
DigiMoneyManager/
├── .github/workflows/ci.yml     # CI: install, lint, build
├── digi_app/                    # Aplikasi Next.js
│   ├── app/
│   │   ├── api/                 # API routes
│   │   ├── api-docs/            # Swagger UI
│   │   ├── login/               # Halaman login
│   │   ├── select-project/      # Pilih proyek aktif
│   │   ├── karyawan/            # Halaman Karyawan
│   │   ├── pm/                  # Halaman Project Manager
│   │   ├── keuangan/            # Halaman Tim Keuangan
│   │   ├── manager/             # Halaman Direktur / Manajemen
│   │   └── superadmin/          # Halaman Superadmin
│   ├── components/              # Komponen UI
│   ├── hooks/                   # React hooks
│   ├── lib/                     # Auth, Prisma client, storage, validasi
│   ├── prisma/
│   │   ├── schema.prisma        # Schema database
│   │   ├── seed.js              # Data demo
│   │   └── seed_master_data.js  # Master kategori anggaran
│   ├── __tests__/               # Self-check Smart Chat
│   ├── prisma.config.ts         # Konfigurasi Prisma CLI
│   ├── proxy.ts                 # Pengecekan login dan role tiap request
│   └── package.json
└── README.md
```

## Panduan Setup

Ikuti langkah 1 sampai 6 secara berurutan.

### 1. Prasyarat

Wajib:

- **Node.js 20.19 atau lebih baru** (22.12+ dan 24+ juga didukung) beserta npm. Cek dengan `node -v`.
- **Git**
- **Database PostgreSQL** yang kosong. Boleh PostgreSQL lokal atau layanan cloud seperti [Supabase](https://supabase.com).

Opsional, sesuai fitur yang ingin dicoba:

| Kebutuhan | Untuk fitur | Tempat mendapatkannya |
|---|---|---|
| API key Google Gemini | OCR struk | [Google AI Studio](https://aistudio.google.com/apikey) |
| API key Groq | Smart Chat | [Groq Console](https://console.groq.com/keys) |
| Project Supabase + Storage bucket | Penyimpanan struk di cloud | [Supabase Dashboard](https://supabase.com/dashboard) |

Tanpa ketiganya aplikasi tetap bisa dijalankan. Lihat [perilaku tiap variabel](#perilaku-jika-variabel-tidak-diisi).

### 2. Clone dan install

```bash
git clone https://github.com/tissuedry/DigiMoneyManager.git
cd DigiMoneyManager/digi_app
npm install
```

`npm install` otomatis menjalankan `prisma generate`, jadi Prisma Client langsung siap dipakai.

### 3. Buat file `.env`

Buat file bernama `.env` di dalam folder `digi_app`. Nama filenya harus persis `.env`, bukan `.env.local`, karena Prisma CLI dan script seed hanya membaca `.env`.

Salin isi berikut, lalu ganti setiap nilai dengan milik Anda sendiri:

```env
# ---------- Database ----------
# Dipakai aplikasi saat berjalan
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
# Dipakai Prisma CLI (db push). Boleh dikosongkan jika sama dengan DATABASE_URL
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# ---------- Autentikasi ----------
# String acak yang panjang untuk menandatangani token login
JWT_SECRET="GANTI_DENGAN_STRING_ACAK"

# ---------- AI ----------
# OCR struk (Google Gemini)
GEMINI_API_KEY="GANTI_DENGAN_API_KEY_GEMINI"
# Smart Chat (Groq)
GROQ_API_KEY="GANTI_DENGAN_API_KEY_GROQ"

# ---------- Supabase Storage ----------
NEXT_PUBLIC_SUPABASE_URL="https://PROJECT_ID.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="GANTI_DENGAN_SERVICE_ROLE_KEY"
SUPABASE_STORAGE_BUCKET="struk-reimbursement"
```

#### Penjelasan tiap variabel

| Variabel | Wajib? | Keterangan |
|---|---|---|
| `DATABASE_URL` | Ya | Connection string PostgreSQL yang dipakai aplikasi. |
| `DIRECT_URL` | Tidak | Koneksi langsung untuk Prisma CLI. Jika kosong, Prisma CLI memakai `DATABASE_URL`. |
| `JWT_SECRET` | Ya | Kunci penanda tangan token login. Harus acak dan dirahasiakan. |
| `GEMINI_API_KEY` | Untuk OCR | API key Google Gemini. |
| `GROQ_API_KEY` | Untuk Smart Chat | API key Groq. |
| `NEXT_PUBLIC_SUPABASE_URL` | Untuk storage cloud | URL project Supabase Anda. |
| `SUPABASE_SERVICE_ROLE_KEY` | Untuk storage cloud | Service role key Supabase. Hanya dipakai di server, jangan dibagikan. |
| `SUPABASE_STORAGE_BUCKET` | Tidak | Nama bucket. Default: `struk-reimbursement`. |

#### Cara mengisi

- **`DATABASE_URL` untuk PostgreSQL lokal:** buat dulu database kosong, misalnya bernama `digi_money_manager`, lalu isi dengan format `postgresql://postgres:PASSWORD@localhost:5432/digi_money_manager`. `DIRECT_URL` boleh dihapus.
- **`DATABASE_URL` untuk Supabase:** ambil connection string dari tombol **Connect** di dashboard project. Pakai connection string *pooler* untuk `DATABASE_URL` dan connection string *direct* untuk `DIRECT_URL`. `prisma db push` bisa gagal atau macet jika dijalankan lewat pooler.
- **`JWT_SECRET`:** buat nilai acak dengan perintah berikut, lalu tempel hasilnya:

  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```

- **Supabase Storage:** buat bucket di menu **Storage** dan jadikan **public**, karena aplikasi menampilkan struk lewat URL publik. Samakan nama bucket dengan `SUPABASE_STORAGE_BUCKET`. URL project dan service role key ada di pengaturan API project.

#### Perilaku jika variabel tidak diisi

| Variabel kosong | Yang terjadi |
|---|---|
| `GEMINI_API_KEY` | OCR struk gagal dengan pesan bahwa API key belum dikonfigurasi. Fitur lain tetap berjalan. |
| `GROQ_API_KEY` | Smart Chat tetap menjawab, tetapi dengan jawaban simulasi berlabel "Simulated Assistant". |
| `SUPABASE_SERVICE_ROLE_KEY` | Struk disimpan di folder lokal `digi_app/public/uploads`. Cukup untuk development, tetapi tidak cocok untuk production. Jangan commit isi folder ini. |
| `JWT_SECRET` | Aplikasi memakai secret bawaan yang tertulis di kode sumber. Ini tidak aman, jadi selalu isi variabel ini. |

### 4. Siapkan database

**a. Buat tabel.** Repository ini tidak menyertakan folder migrations, jadi tabel dibuat langsung dari schema:

```bash
npx prisma db push
```

**b. Isi data demo (disarankan untuk development).**

```bash
npx prisma db seed
```

Perintah ini menjalankan `prisma/seed.js`, yang membuat:

- satu contoh proyek beserta budget dan pos anggarannya
- satu akun demo untuk tiap role: Karyawan, Project Manager, Tim Keuangan, dan Direktur / Manajemen
- contoh reimbursement, approval, dan jurnal

> **Perhatian:** seed **menghapus data yang sudah ada** (user, proyek, reimbursement, jurnal, dan lainnya) sebelum mengisi ulang. Jalankan hanya pada database baru atau database development.

Seed tidak membuat akun Superadmin. Cara membuatnya ada di [langkah 6](#6-login-pertama).

**c. Isi master kategori anggaran (opsional).**

```bash
node prisma/seed_master_data.js
```

Script ini menambah data tanpa menghapus yang lama. Jalankan **sekali saja**, karena menjalankannya lagi akan menggandakan data.

Untuk melihat isi database lewat browser, jalankan `npx prisma studio`.

### 5. Jalankan aplikasi

```bash
npm run dev
```

Buka <http://localhost:3000>. Jika belum login, Anda diarahkan ke halaman `/login`.

### 6. Login pertama

**Jika Anda menjalankan seed:** email dan password akun demo tertulis di `prisma/seed.js`. Login dengan salah satunya di `/login`. Setelah login, Anda diarahkan ke dashboard sesuai role. Akun Karyawan diminta memilih proyek lebih dulu.

**Jika Anda tidak menjalankan seed, atau butuh akun Superadmin:** aplikasi belum punya halaman register, jadi akun dibuat lewat API. Cara termudah adalah lewat Swagger UI:

1. Buka <http://localhost:3000/api-docs>.
2. Jalankan `POST /api/auth/register` dengan body seperti ini:

   ```json
   {
     "nama": "Nama Anda",
     "email": "email@contoh.com",
     "password": "PASSWORD_ANDA",
     "role": "Superadmin"
   }
   ```

3. Login di `/login` dengan email dan password tersebut.

Ketentuan body register:

- `password` minimal 6 karakter.
- `role` harus salah satu dari: `Karyawan`, `Project Manager`, `Tim Keuangan`, `Direktur / Manajemen`, `Superadmin`.
- `proyekId` opsional, untuk langsung memasukkan user ke sebuah proyek.

## Perintah Lain

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Development server |
| `npm run lint` | Cek kode dengan ESLint |
| `npm run build` | Build production (menjalankan `prisma generate` lebih dulu) |
| `npm start` | Jalankan hasil build |
| `npx prisma studio` | Lihat dan ubah isi database lewat browser |
| `npx prisma generate` | Generate ulang Prisma Client setelah schema berubah |
| `npx tsx __tests__/smart-chat.test.ts` | Self-check filter prompt injection Smart Chat |

CI di `.github/workflows/ci.yml` menjalankan install, lint, dan build pada setiap push dan pull request. Pastikan `npm run lint` dan `npm run build` lolos sebelum membuat pull request.

## API Documentation

Setelah server berjalan:

- Swagger UI: <http://localhost:3000/api-docs>
- Spesifikasi OpenAPI: <http://localhost:3000/api/openapi.json>

Hal yang perlu diketahui saat memanggil API:

- Hampir semua endpoint butuh login. Yang terbuka hanya `/api/auth/login`, `/api/auth/register`, dan `/api/auth/logout`.
- Token didapat dari response `POST /api/auth/login` (field `token`). Kirim sebagai header `Authorization: Bearer <token>`. Browser yang sudah login otomatis memakai cookie `auth_token`.
- Request `POST`, `PUT`, dan `PATCH` harus memakai `Content-Type: application/json` atau `multipart/form-data`. Selain itu ditolak dengan status 415.

### Endpoint Utama

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/auth/register` | Register pengguna baru |
| POST | `/api/auth/login` | Login dan mendapatkan JWT |
| GET | `/api/auth/me` | Data user yang sedang login |
| POST | `/api/auth/select-project` | Pilih proyek aktif |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/proyek` | Daftar proyek |
| POST | `/api/proyek` | Buat proyek baru |
| POST | `/api/proyek/{id}/budget` | Input RAB dan pos anggaran |
| GET | `/api/reimbursements` | Daftar reimbursement |
| POST | `/api/reimbursements` | Ajukan reimbursement |
| POST | `/api/reimbursements/{id}/approve` | Approve atau reject reimbursement |
| POST | `/api/reimbursements/{id}/cancel` | Batalkan reimbursement yang masih menunggu |
| POST | `/api/ocr` | Ekstrak data struk dengan Google Gemini |
| GET | `/api/coa` | Chart of Accounts |
| GET | `/api/laporan` | Generate laporan keuangan |
| GET | `/api/dashboard` | Ringkasan dashboard |
| GET | `/api/notifications` | Daftar notifikasi |
| GET | `/api/audit-trail` | Audit trail |
| POST | `/api/smart-chat` | Smart Chat (Groq) |

Daftar lengkap endpoint ada di Swagger UI.

## Troubleshooting

| Masalah | Penyebab dan solusi |
|---|---|
| `DATABASE_URL is not defined` saat seed | File `.env` belum ada di folder `digi_app`, atau namanya bukan `.env`. |
| Error Prisma Client tidak ditemukan | Jalankan `npx prisma generate`. |
| `prisma db push` gagal konek atau macet | Periksa `DIRECT_URL`/`DATABASE_URL`. Di Supabase, pakai koneksi *direct* untuk `DIRECT_URL`. |
| Error versi Node saat `npm install` atau Prisma | Perbarui Node.js ke 20.19 atau lebih baru. |
| Login selalu gagal setelah seed | Pastikan seed selesai tanpa error dan `DATABASE_URL` aplikasi menunjuk ke database yang sama. |
| Semua user tiba-tiba harus login ulang | `JWT_SECRET` berubah. Token lama otomatis tidak berlaku. |
| OCR struk gagal | `GEMINI_API_KEY` kosong atau tidak valid, atau kuota Gemini habis. |
| Smart Chat menjawab "Simulated Assistant" | `GROQ_API_KEY` kosong, tidak valid, atau Groq sedang bermasalah. |
| Struk tersimpan di `public/uploads`, bukan di Supabase | `SUPABASE_SERVICE_ROLE_KEY` kosong, bucket belum dibuat, atau nama bucket tidak cocok. |
| Gambar struk dari Supabase tidak tampil | Bucket belum diatur sebagai public. |
| API membalas status 415 | Tambahkan header `Content-Type: application/json` pada request. |

## Catatan Keamanan

- Jangan commit file `.env`, API key, atau kredensial database. File `.env` sudah ada di `.gitignore`.
- Selalu isi `JWT_SECRET` dengan nilai acak milik Anda sendiri.
- `SUPABASE_SERVICE_ROLE_KEY` memberi akses penuh ke project Supabase. Simpan hanya di server.
- Akun demo dari seed hanya untuk development. Jangan jalankan seed di database production.
- `POST /api/auth/register` terbuka tanpa login dan dapat membuat akun dengan role apa pun. Batasi atau nonaktifkan endpoint ini sebelum aplikasi dibuka ke publik.
- Gunakan HTTPS di production.
- Ganti (rotasi) kredensial yang pernah terpapar secara publik.
