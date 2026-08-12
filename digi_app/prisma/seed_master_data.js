const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Load environment variables
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not defined in environment variables.');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Memulai proses penambahan Master Data...');

  // --- 5.1 BIAYA MARKETING PROYEK (PENGELUARAN) ---
  console.log('Menambahkan data 5.1...');
  const main51 = await prisma.masterMain.create({
    data: { nama: 'BIAYA MARKETING PROYEK', tipe: 'pengeluaran' }
  });
  await prisma.masterSub.createMany({
    data: [
      { mainId: main51.id, nama: 'Biaya Marketing Proyek', tipe: 'pengeluaran' },
      { mainId: main51.id, nama: 'Biaya Marketing Proyek Lainnya', tipe: 'pengeluaran' },
    ]
  });

  // --- 5.2 BIAYA ADMINISTRASI PROYEK (PENGELUARAN) ---
  console.log('Menambahkan data 5.2...');
  const main52 = await prisma.masterMain.create({
    data: { nama: 'BIAYA ADMINISTRASI PROYEK', tipe: 'pengeluaran' }
  });
  await prisma.masterSub.createMany({
    data: [
      { mainId: main52.id, nama: 'Biaya Jaminan Proyek', tipe: 'pengeluaran' },
      { mainId: main52.id, nama: 'Pembuatan Dokumen Kontrak', tipe: 'pengeluaran' },
      { mainId: main52.id, nama: 'Biaya Administrasi Proyek Lainnya', tipe: 'pengeluaran' },
    ]
  });

  // --- 5.3 BIAYA PRODUKSI PROYEK (PENGELUARAN) ---
  console.log('Menambahkan data 5.3...');
  const main53 = await prisma.masterMain.create({
    data: { nama: 'BIAYA PRODUKSI PROYEK', tipe: 'pengeluaran' }
  });

  await prisma.masterSub.createMany({
    data: [
      { mainId: main53.id, nama: 'Biaya Personil', tipe: 'pengeluaran' },
      { mainId: main53.id, nama: 'Biaya Non Personil', tipe: 'pengeluaran' },
      { mainId: main53.id, nama: 'Biaya Pengadaan Barang dan Jasa', tipe: 'pengeluaran' },
      { mainId: main53.id, nama: 'Biaya Garansi', tipe: 'pengeluaran' },
    ]
  });

  // --- 1.1 KAS & BANK (PEMASUKAN / ASET) ---
  console.log('Menambahkan data Master Pemasukan (Kas & Bank)...');
  const mainKas = await prisma.masterMain.create({
    data: { nama: 'Kas & Bank', tipe: 'pemasukan' }
  });
  await prisma.masterSub.createMany({
    data: [
      { mainId: mainKas.id, nama: 'BCA', tipe: 'pemasukan' },
      { mainId: mainKas.id, nama: 'Mandiri', tipe: 'pemasukan' },
      { mainId: mainKas.id, nama: 'BRI', tipe: 'pemasukan' },
      { mainId: mainKas.id, nama: 'Kas Kecil', tipe: 'pemasukan' },
    ]
  });

  // --- 1.2 PENDAPATAN PROYEK (PEMASUKAN) ---
  const mainPendapatan = await prisma.masterMain.create({
    data: { nama: 'Pendapatan Proyek', tipe: 'pemasukan' }
  });
  await prisma.masterSub.createMany({
    data: [
      { mainId: mainPendapatan.id, nama: 'Termin 1 (DP)', tipe: 'pemasukan' },
      { mainId: mainPendapatan.id, nama: 'Termin Pelunasan', tipe: 'pemasukan' },
    ]
  });

  console.log('Semua Master Data berhasil ditambahkan ke database!');
}

main()
  .catch((e) => {
    console.error('Terjadi error saat insert data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });