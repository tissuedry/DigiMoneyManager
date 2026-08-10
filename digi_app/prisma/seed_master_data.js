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
  await prisma.masterSub.create({
    data: { mainId: main53.id, nama: 'Biaya Personil' }
  });

  // 5.3.02 Biaya Non Personil
  await prisma.masterSub.create({
    data: { mainId: main53.id, nama: 'Biaya Non Personil' }
  });

  // 5.3.03 Biaya Pengadaan Barang dan Jasa
  await prisma.masterSub.create({
    data: { mainId: main53.id, nama: 'Biaya Pengadaan Barang dan Jasa' }
  });

  // 5.3.04 Biaya Garansi
  await prisma.masterSub.create({
    data: { mainId: main53.id, nama: 'Biaya Garansi' }
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