# Digi Money Manager

Digi Money Manager adalah aplikasi web untuk mengelola keuangan proyek, mulai dari RAB, reimbursement, approval, jurnal akuntansi, laporan keuangan, audit trail, notifikasi, hingga smart chat berbasis AI.

Project utama aplikasi berada di folder `digi_app`.

## Tech Stack

- **Frontend & Backend:** Next.js 16 App Router
- **Language:** TypeScript
- **UI Styling:** Tailwind CSS
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT + HttpOnly cookie
- **AI OCR:** Groq API untuk membaca struk/nota
- **API Documentation:** Swagger UI via `/api-docs`

## Fitur

### Autentikasi & Role

- Register dan login user
- JWT token disimpan dalam cookie `auth_token`
- Role-based access untuk:
  - Karyawan
  - Project Manager
  - Tim Keuangan
  - Direktur / Manajemen

### Manajemen Proyek

- Buat dan kelola proyek
- Atur tanggal mulai dan selesai proyek
- Kelola anggota proyek dan role per user
- Atur RAB proyek dan pos anggaran

### Reimbursement

- Karyawan dapat mengajukan reimbursement
- Upload struk/nota sebagai bukti
- OCR struk menggunakan Groq Vision AI
- Simpan hasil ekstraksi struk ke database
- Approval bertahap:
  1. Project Manager memvalidasi pengajuan
  2. Tim Keuangan menyetujui dan memasukkan akun debit/kredit
- Karyawan dapat membatalkan pengajuan yang masih menunggu approval

### Akuntansi & Laporan

- Chart of Accounts
- Jurnal akuntansi otomatis saat reimbursement disetujui Tim Keuangan
- Generate laporan:
  - Buku besar
  - Neraca
  - Laba rugi
- Export laporan ke JSON atau CSV

### Dashboard, Notifikasi & Audit

- Dashboard ringkas berdasarkan role pengguna
- Notifikasi pengajuan reimbursement baru
- Audit trail untuk mencatat aktivitas penting dalam sistem

### Smart Chat

- Fitur chat natural language untuk membantu membaca data keuangan
- Contoh pertanyaan:
  - Berapa sisa budget proyek saat ini?
  - Apa pengeluaran terbesar proyek ini?
  - Tampilkan jurnal terbaru

## Struktur Repository

```txt
Digi-Money-Manager/
├── digi_app/
│   ├── app/
│   │   ├── api/                 # API routes
│   │   ├── api-docs/            # Swagger UI
│   │   ├── karyawan/            # Halaman karyawan
│   │   ├── pm/                  # Halaman Project Manager
│   │   ├── manager/             # Halaman manajemen
│   │   ├── keuangan/            # Halaman Tim Keuangan
│   │   └── login/               # Halaman login
│   ├── components/              # Komponen UI
│   ├── lib/                     # Helper, auth, Prisma client
│   ├── prisma/
│   │   └── schema.prisma        # Schema database
│   ├── package.json
│   └── README.md
└── README.md
```

## Instalasi

Masuk ke folder aplikasi:

```bash
cd digi_app
```

Install dependencies:

```bash
npm install
```

Generate Prisma Client:

```bash
npx prisma generate
```

## Konfigurasi Environment

Buat file `.env` di dalam folder `digi_app`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
GROQ_API_KEY="your_groq_api_key"
```

## Setup Database

Jika database belum dibuat:

```bash
cd digi_app
npx prisma migrate dev --name init
```

Jika database sudah ada dan hanya perlu sinkronisasi schema:

```bash
cd digi_app
npx prisma db push
```

## Menjalankan Aplikasi

Jalankan development server dari folder `digi_app`:

```bash
cd digi_app
npm run dev
```

Buka aplikasi di browser:

```txt
http://localhost:3000
```

## Build Production

```bash
cd digi_app
npm run build
npm start
```

## API Documentation

Setelah server berjalan, buka Swagger UI:

```txt
http://localhost:3000/api-docs
```

Spesifikasi OpenAPI dapat diakses melalui:

```txt
http://localhost:3000/api/openapi.json
```

Untuk endpoint yang membutuhkan login, gunakan JWT token dari response `/api/auth/login` sebagai Bearer token.

## Endpoint Utama

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/auth/register` | Register pengguna baru |
| POST | `/api/auth/login` | Login dan mendapatkan JWT |
| GET | `/api/auth/me` | Ambil data user aktif |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/proyek` | Daftar proyek |
| POST | `/api/proyek` | Buat proyek baru |
| POST | `/api/proyek/{id}/budget` | Input RAB dan pos anggaran |
| GET | `/api/reimbursements` | Daftar reimbursement |
| POST | `/api/reimbursements` | Ajukan reimbursement |
| POST | `/api/reimbursements/{id}/approve` | Approve/reject reimbursement |
| POST | `/api/reimbursements/{id}/cancel` | Batalkan reimbursement yang masih submitted |
| POST | `/api/ocr` | Ekstrak data struk dengan AI |
| GET | `/api/laporan` | Generate laporan keuangan |
| GET | `/api/dashboard` | Ringkasan dashboard |
| GET | `/api/notifications` | Daftar notifikasi |
| POST | `/api/smart-chat` | Chat natural language |

## Catatan Keamanan

- Jangan menyimpan kredensial database atau API key di repository.
- Pastikan `.env` tidak di-commit ke GitHub.
- Gunakan HTTPS untuk environment production.
- Rotasi kredensial jika pernah terpapar secara publik.

## Lisensi

MIT
