const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

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
  console.log('Starting database seeding with pg adapter...');

  // 1. Clean up existing data to ensure seed is idempotent
  console.log('Clearing existing database records...');
  await prisma.jurnalAkuntansi.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.reimbursement.deleteMany();
  await prisma.posAnggaran.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.userProyek.deleteMany(); // Membersihkan tabel perantara baru
  await prisma.proyek.deleteMany();
  await prisma.auditTrail.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.chartOfAccounts.deleteMany();

  // 2. Hash default passwords
  console.log('Hashing passwords...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 3. Create Chart of Accounts (CoA)
  console.log('Seeding Chart of Accounts (CoA)...');
  const coaData = [
    { id: 'COA-KAS', nomorAkun: 10000, namaAkun: 'Kas & Bank', tipe: 'Asset', standar: 'IFRS' },
    { id: 'COA-EXP-ATK', nomorAkun: 50001, namaAkun: 'Beban Perlengkapan & ATK', tipe: 'Expense', standar: 'IFRS' },
    { id: 'COA-EXP-SIPIL', nomorAkun: 50002, namaAkun: 'Beban Bahan Bangunan & Sipil', tipe: 'Expense', standar: 'IFRS' },
    { id: 'COA-EXP-LOG', nomorAkun: 50003, namaAkun: 'Beban Transportasi & Logistik', tipe: 'Expense', standar: 'IFRS' },
    { id: 'COA-LIAB', nomorAkun: 21000, namaAkun: 'Utang Reimbursement Karyawan', tipe: 'Liability', standar: 'IFRS' },
  ];

  for (const coa of coaData) {
    await prisma.chartOfAccounts.create({ data: coa });
  }

  // 4. Create default active project (Proyek)
  console.log('Seeding initial project...');
  const project = await prisma.proyek.create({
    data: {
      nama: 'Renovasi Kantor Cabang Bandung',
      deskripsi: 'Proyek renovasi dan fitting out interior gedung kantor cabang baru Bandung.',
      status: 'AKTIF',
      tanggalMulai: new Date('2026-05-01T00:00:00Z'),
      tanggalSelesai: new Date('2026-10-31T00:00:00Z'),
    },
  });

  // 5. Create default users
  console.log('Seeding initial users...');
  const employee = await prisma.user.create({
    data: {
      nama: 'Taraka Yumna',
      email: 'karyawan@digi.com',
      passwordHash: hashedPassword,
      role: 'Karyawan',
      divisi: 'Site Operations',
    },
  });

  const pm = await prisma.user.create({
    data: {
      nama: 'Muhammad Alvin Ababil',
      email: 'pm@digi.com',
      passwordHash: hashedPassword,
      role: 'Project Manager',
      divisi: 'Project Management Office',
    },
  });

  const finance = await prisma.user.create({
    data: {
      nama: 'Daisaq Albar',
      email: 'keuangan@digi.com',
      passwordHash: hashedPassword,
      role: 'Tim Keuangan',
      divisi: 'Finance & Accounting',
    },
  });

  const director = await prisma.user.create({
    data: {
      nama: 'Ghanif Akbar',
      email: 'direktur@digi.com',
      passwordHash: hashedPassword,
      role: 'Direktur / Manajemen',
      divisi: 'Executive Board',
    },
  });

  // 6. Connect users to the project via UserProyek junction table
  console.log('Connecting users to the project...');
  await prisma.userProyek.createMany({
    data: [
      {
        userId: employee.id,
        proyekId: project.id,
        role: 'Anggota Lapangan',
        joinedAt: new Date(),
      },
      {
        userId: pm.id,
        proyekId: project.id,
        role: 'Project Manager',
        joinedAt: new Date(),
      },
    ],
  });

  // 7. Create budget and detailed post allocations for the project
  console.log('Seeding project budget & pos allocations...');
  await prisma.budget.create({
    data: {
      proyekId: project.id,
      rabTotal: 150000000.00, // Rp 150,000,000
      totalPengeluaran: 0.00,
      totalReimbursement: 0.00,
      sisaBudget: 150000000.00,
      posAnggaran: {
        create: [
          { namaPos: 'Perlengkapan & ATK', nominalAlokasi: 20000000.00, nominalTerpakai: 0.00 },
          { namaPos: 'Bahan Bangunan & Sipil', nominalAlokasi: 100000000.00, nominalTerpakai: 0.00 },
          { namaPos: 'Transportasi & Logistik', nominalAlokasi: 30000000.00, nominalTerpakai: 0.00 },
        ],
      },
    },
  });


  // 7b. Seed Reimbursements and Approvals
  console.log('Seeding initial reimbursements and approvals...');
  const posAnggaranList = await prisma.posAnggaran.findMany({
    where: { budget: { proyekId: project.id } }
  });
  const posATK = posAnggaranList.find(p => p.namaPos === 'Perlengkapan & ATK');
  const posSipil = posAnggaranList.find(p => p.namaPos === 'Bahan Bangunan & Sipil');
  const posLog = posAnggaranList.find(p => p.namaPos === 'Transportasi & Logistik');

  // RB 1: SUBMITTED (Perlengkapan & ATK)
  const rb1 = await prisma.reimbursement.create({
    data: {
      userId: employee.id,
      proyekId: project.id,
      posAnggaranId: posATK.id,
      nominal: 150000.00,
      urlStruk: '/bukti_struk.png',
      ocrData: {
        tanggal: '2026-05-18',
        merchant: 'Gramedia Merdeka',
        keterangan: 'Pembelian kertas A4, log book, dan papan klip untuk kebutuhan administrasi site.',
      },
      status: 'SUBMITTED',
    },
  });

  // RB 2: SUBMITTED (Transportasi & Logistik)
  const rb2 = await prisma.reimbursement.create({
    data: {
      userId: employee.id,
      proyekId: project.id,
      posAnggaranId: posLog.id,
      nominal: 450000.00,
      urlStruk: '/bukti_struk.png',
      ocrData: {
        tanggal: '2026-05-19',
        merchant: 'SPBU Pertamina 34.121',
        keterangan: 'BBM kendaraan operasional pertengahan April.',
      },
      status: 'SUBMITTED',
    },
  });

  // RB 3: APPROVED_BY_PM (Perlengkapan & ATK)
  const rb3 = await prisma.reimbursement.create({
    data: {
      userId: employee.id,
      proyekId: project.id,
      posAnggaranId: posATK.id,
      nominal: 120000.00,
      urlStruk: '/bukti_struk.png',
      ocrData: {
        tanggal: '2026-05-10',
        merchant: 'Fotocopy Bandung Jaya',
        keterangan: 'Fotocopy berkas gambar site layout.',
      },
      status: 'APPROVED_BY_PM',
    },
  });

  await prisma.approval.create({
    data: {
      reimbursementId: rb3.id,
      approverId: pm.id,
      level: 'PM',
      status: 'APPROVED_BY_PM',
      catatan: 'Disetujui untuk diteruskan.',
    },
  });

  // RB 4: APPROVED (Transportasi & Logistik)
  const rb4 = await prisma.reimbursement.create({
    data: {
      userId: employee.id,
      proyekId: project.id,
      posAnggaranId: posLog.id,
      nominal: 350000.00,
      urlStruk: '/bukti_struk.png',
      ocrData: {
        tanggal: '2026-05-05',
        merchant: 'Gojek Logistik',
        keterangan: 'Pengiriman sampel material beton.',
      },
      status: 'APPROVED',
    },
  });

  await prisma.approval.create({
    data: {
      reimbursementId: rb4.id,
      approverId: pm.id,
      level: 'PM',
      status: 'APPROVED_BY_PM',
      catatan: 'Ok, pengiriman beton penting.',
    },
  });

  await prisma.approval.create({
    data: {
      reimbursementId: rb4.id,
      approverId: finance.id,
      level: 'KEUANGAN',
      status: 'APPROVED',
      catatan: 'Telah ditransfer ke karyawan.',
    },
  });

  await prisma.jurnalAkuntansi.create({
    data: {
      reimbursementId: rb4.id,
      noAkunDebit: 'COA-EXP-LOG',
      noAkunKredit: 'COA-KAS',
      nominal: 350000.00,
      keterangan: 'Pencairan reimbursement Gojek Logistik - Taraka Yumna',
    },
  });

  // RB 5: REJECTED (Bahan Bangunan & Sipil)
  const rb5 = await prisma.reimbursement.create({
    data: {
      userId: employee.id,
      proyekId: project.id,
      posAnggaranId: posSipil.id,
      nominal: 1500000.00,
      urlStruk: '/bukti_struk.png',
      ocrData: {
        tanggal: '2026-05-02',
        merchant: 'Toko Besi Jaya',
        keterangan: 'Pembelian besi tambahan di luar RAB.',
      },
      status: 'REJECTED',
    },
  });

  await prisma.approval.create({
    data: {
      reimbursementId: rb5.id,
      approverId: pm.id,
      level: 'PM',
      status: 'REJECTED',
      catatan: 'Ditolak karena tidak ada persetujuan sebelumnya untuk pengeluaran besi tambahan.',
    },
  });

  // 8. Seed initial Audit log
  await prisma.auditTrail.create({
    data: {
      userId: pm.id,
      aksi: 'seed_database',
      detail: 'Sistem keuangan berhasil di-seed dengan data proyek, users, budget pos, dan CoA awal.',
    },
  });

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // close pool connection
  });