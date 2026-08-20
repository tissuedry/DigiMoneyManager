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

  // --- 1.1 PENJUALAN JASA (PEMASUKAN) ---
  console.log('Menambahkan data Master Pemasukan (Penjualan Jasa)...');
  const mainJasa = await prisma.masterMain.create({
    data: { nama: 'Penjualan Jasa', tipe: 'pemasukan' }
  });
  await prisma.masterSub.createMany({
    data: [
      { mainId: mainJasa.id, nama: 'Penjualan Jasa', tipe: 'pemasukan' },
      { mainId: mainJasa.id, nama: 'Diskon Penjualan Jasa', tipe: 'pemasukan' },
      { mainId: mainJasa.id, nama: 'Retur Penjualan Jasa', tipe: 'pemasukan' },
      { mainId: mainJasa.id, nama: 'Biaya Penjualan Jasa Lainnya', tipe: 'pemasukan' },
    ]
  });

  // --- 1.2 PENJUALAN BARANG (PEMASUKAN) ---
  console.log('Menambahkan data Master Pemasukan (Penjualan Barang)...');
  const mainBarang = await prisma.masterMain.create({
    data: { nama: 'Penjualan Barang', tipe: 'pemasukan' }
  });
  await prisma.masterSub.createMany({
    data: [
      { mainId: mainBarang.id, nama: 'Penjualan Barang', tipe: 'pemasukan' },
      { mainId: mainBarang.id, nama: 'Diskon Penjualan Barang', tipe: 'pemasukan' },
      { mainId: mainBarang.id, nama: 'Retur Penjualan Barang', tipe: 'pemasukan' },
      { mainId: mainBarang.id, nama: 'Biaya Penjualan Barang Lainnya', tipe: 'pemasukan' },
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