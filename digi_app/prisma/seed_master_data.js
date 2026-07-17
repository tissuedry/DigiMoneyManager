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

  // --- 5.1 BIAYA MARKETING PROYEK ---
  console.log('Menambahkan data 5.1...');
  const main51 = await prisma.masterMain.create({
    data: { nama: 'BIAYA MARKETING PROYEK' }
  });
  await prisma.masterSub.createMany({
    data: [
      { mainId: main51.id, nama: 'Biaya Marketing Proyek' },
      { mainId: main51.id, nama: 'Biaya Marketing Proyek Lainnya' },
    ]
  });

  // --- 5.2 BIAYA ADMINISTRASI PROYEK ---
  console.log('Menambahkan data 5.2...');
  const main52 = await prisma.masterMain.create({
    data: { nama: 'BIAYA ADMINISTRASI PROYEK' }
  });
  await prisma.masterSub.createMany({
    data: [
      { mainId: main52.id, nama: 'Biaya Jaminan Proyek' },
      { mainId: main52.id, nama: 'Pembuatan Dokumen Kontrak' },
      { mainId: main52.id, nama: 'Biaya Administrasi Proyek Lainnya' },
    ]
  });

  // --- 5.3 BIAYA PRODUKSI PROYEK ---
  console.log('Menambahkan data 5.3...');
  const main53 = await prisma.masterMain.create({
    data: { nama: 'BIAYA PRODUKSI PROYEK' }
  });

  // 5.3.01 Biaya Personil
  const sub5301 = await prisma.masterSub.create({
    data: { mainId: main53.id, nama: 'Biaya Personil' }
  });
  await prisma.masterKeterangan.createMany({
    data: [
      { subId: sub5301.id, nama: 'Gaji Personil' },
      { subId: sub5301.id, nama: 'Biaya Personil lainnya' },
    ]
  });

  // 5.3.02 Biaya Non Personil
  const sub5302 = await prisma.masterSub.create({
    data: { mainId: main53.id, nama: 'Biaya Non Personil' }
  });
  await prisma.masterKeterangan.createMany({
    data: [
      { subId: sub5302.id, nama: 'Biaya Perjalanan Dinas' },
      { subId: sub5302.id, nama: 'Biaya Pembahasan / Presentasi' },
      { subId: sub5302.id, nama: 'Biaya Pelaporan' },
      { subId: sub5302.id, nama: 'Biaya Pelatihan' },
      { subId: sub5302.id, nama: 'Biaya Sosialisasi' },
      { subId: sub5302.id, nama: 'Biaya Non Personil Lainnya' },
    ]
  });

  // 5.3.03 Biaya Pengadaan Barang dan Jasa
  const sub5303 = await prisma.masterSub.create({
    data: { mainId: main53.id, nama: 'Biaya Pengadaan Barang dan Jasa' }
  });
  await prisma.masterKeterangan.createMany({
    data: [
      { subId: sub5303.id, nama: 'Pembelian Barang Kena Pajak' },
      { subId: sub5303.id, nama: 'Pembelian Jasa Kena Pajak' },
      { subId: sub5303.id, nama: 'Pembelian Software' },
      { subId: sub5303.id, nama: 'Pengadaan Jaringan' },
    ]
  });

  // 5.3.04 Biaya Garansi
  const sub5304 = await prisma.masterSub.create({
    data: { mainId: main53.id, nama: 'Biaya Garansi' }
  });
  await prisma.masterKeterangan.createMany({
    data: [
      { subId: sub5304.id, nama: 'Gaji Personil' },
      { subId: sub5304.id, nama: 'Biaya Perjalanan Dinas' },
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