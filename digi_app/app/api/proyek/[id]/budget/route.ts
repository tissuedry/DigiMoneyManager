import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearCache } from '@/lib/route-cache';

// POST: Input/Set RAB budget for a project (PM, Tim Keuangan, Direktur, atau Super Admin only)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    const rolesHeader = req.headers.get('x-user-roles') || role || '';
    const roles = rolesHeader.split(',');
    const userId = req.headers.get('x-user-id');
    const { id: proyekId } = await params;

    const isPM = await prisma.userProyek.findFirst({
      where: {
        userId: parseInt(userId || '0', 10),
        proyekId: parseInt(proyekId, 10),
        role: 'Project Manager',
      },
    });

    const isSuperAdmin = 
      roles.includes('Superadmin') || 
      roles.includes('superadmin');

    if (!isPM && !roles.includes('Tim Keuangan') && !roles.includes('Direktur / Manajemen') && !isSuperAdmin) {
      return NextResponse.json({ message: 'Forbidden: You must be the assigned Project Manager, Tim Keuangan, Direktur / Manajemen, or Super Admin to modify this project budget' }, { status: 403 });
    }
    
    const body = await req.json();
    const { 
      nilaiKontrak, 
      rabTotal, 
      targetPemasukan, 
      posAnggaran, 
      posPengeluaran, 
      posPemasukan 
    } = body;

    // Normalisasi input pos
    const rawPosPengeluaran = posPengeluaran !== undefined ? posPengeluaran : (posAnggaran !== undefined ? posAnggaran : null);
    const rawPosPemasukan = posPemasukan !== undefined ? posPemasukan : null;

    if (!rawPosPengeluaran && !rawPosPemasukan && rabTotal === undefined && targetPemasukan === undefined && nilaiKontrak === undefined) {
      return NextResponse.json({ message: 'Tidak ada data anggaran yang dikirim untuk diupdate' }, { status: 400 });
    }

    // Verify project exists
    const project = await prisma.proyek.findUnique({
      where: { id: parseInt(proyekId, 10) },
      include: {
        budget: {
          include: {
            mainAnggaran: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    const existingBudget = project.budget;
    const existingPengeluaran = existingBudget ? existingBudget.mainAnggaran.filter((m) => m.tipe !== 'pemasukan') : [];
    const existingPemasukan = existingBudget ? existingBudget.mainAnggaran.filter((m) => m.tipe === 'pemasukan') : [];

    // Hitung total pengeluaran
    let sumPengeluaran = 0;
    if (rawPosPengeluaran && Array.isArray(rawPosPengeluaran)) {
      sumPengeluaran = rawPosPengeluaran.reduce((sum: number, pos: any) => {
        const nom = typeof pos.nominalAlokasi === 'string'
          ? parseFloat(pos.nominalAlokasi.replace(/\./g, '').replace(',', '.')) || 0
          : Number(pos.nominalAlokasi) || 0;
        return sum + nom;
      }, 0);
    } else if (existingPengeluaran.length > 0) {
      sumPengeluaran = existingPengeluaran.reduce((sum, p) => sum + Number(p.nominalAlokasi), 0);
    }

    // Hitung total pemasukan
    let sumPemasukan = 0;
    if (rawPosPemasukan && Array.isArray(rawPosPemasukan)) {
      sumPemasukan = rawPosPemasukan.reduce((sum: number, pos: any) => {
        const nom = typeof pos.nominalAlokasi === 'string'
          ? parseFloat(pos.nominalAlokasi.replace(/\./g, '').replace(',', '.')) || 0
          : Number(pos.nominalAlokasi) || 0;
        return sum + nom;
      }, 0);
    } else if (existingPemasukan.length > 0) {
      sumPemasukan = existingPemasukan.reduce((sum, p) => sum + Number(p.nominalAlokasi), 0);
    }

    const parsedRabTotal = rabTotal !== undefined && rabTotal !== null
      ? (typeof rabTotal === 'number' ? rabTotal : parseFloat(String(rabTotal).replace(/[^0-9.-]+/g, '')) || 0)
      : (rawPosPengeluaran ? sumPengeluaran : (existingBudget ? Number(existingBudget.rabTotal) : sumPengeluaran));

    const parsedTargetPemasukan = targetPemasukan !== undefined && targetPemasukan !== null
      ? (typeof targetPemasukan === 'number' ? targetPemasukan : parseFloat(String(targetPemasukan).replace(/[^0-9.-]+/g, '')) || 0)
      : (rawPosPemasukan ? sumPemasukan : (existingBudget ? Number(existingBudget.targetPemasukan) : sumPemasukan));

    const parsedNilaiKontrak = nilaiKontrak !== undefined && nilaiKontrak !== null
      ? (typeof nilaiKontrak === 'number' ? nilaiKontrak : parseFloat(String(nilaiKontrak).replace(/[^0-9.-]+/g, '')) || 0)
      : (existingBudget ? Number(existingBudget.nilaiKontrak) : (parsedRabTotal + parsedTargetPemasukan));

    // Validasi alokasi tidak melebihi alokasi pengeluaran
    if (rawPosPengeluaran && sumPengeluaran > parsedRabTotal && parsedRabTotal > 0) {
      return NextResponse.json({
        message: `Total alokasi pengeluaran (Rp ${sumPengeluaran.toLocaleString('id-ID')}) tidak boleh melebihi budget RAB Pengeluaran (Rp ${parsedRabTotal.toLocaleString('id-ID')})`
      }, { status: 400 });
    }

    // Validasi total pengeluaran + pemasukan tidak melebihi nilai kontrak
    if ((parsedRabTotal + parsedTargetPemasukan) > parsedNilaiKontrak && parsedNilaiKontrak > 0) {
      return NextResponse.json({
        message: `Total Pengeluaran (Rp ${parsedRabTotal.toLocaleString('id-ID')}) + Pemasukan (Rp ${parsedTargetPemasukan.toLocaleString('id-ID')}) melebihi Nilai Perjanjian Proyek (Rp ${parsedNilaiKontrak.toLocaleString('id-ID')})`
      }, { status: 400 });
    }

    // Eksekusi transaksi penyimpanan budget & pos anggaran
    const result = await prisma.$transaction(async (tx) => {
      let budgetId: number;

      if (existingBudget) {
        budgetId = existingBudget.id;
        
        // 1. Sinkronisasi Pos Pengeluaran HANYA jika rawPosPengeluaran dikirim
        if (rawPosPengeluaran && Array.isArray(rawPosPengeluaran)) {
          for (const ext of existingPengeluaran) {
            const matchedIncoming = rawPosPengeluaran.find(
              (pos: any) => (pos.deskripsi || pos.namaPos || pos.namaMain || '').trim().toLowerCase() === ext.namaMain.trim().toLowerCase()
            );

            if (matchedIncoming) {
              const rawNom = typeof matchedIncoming.nominalAlokasi === 'string'
                ? parseFloat(matchedIncoming.nominalAlokasi.replace(/\./g, '').replace(',', '.')) || 0
                : Number(matchedIncoming.nominalAlokasi) || 0;

              await tx.mainAnggaran.update({
                where: { id: ext.id },
                data: {
                  nominalAlokasi: rawNom,
                  namaMain: (matchedIncoming.deskripsi || matchedIncoming.namaPos || matchedIncoming.namaMain || ext.namaMain).trim(),
                  tipe: 'pengeluaran',
                },
              });
            } else {
              const subs = await tx.subAnggaran.findMany({
                where: { mainAnggaranId: ext.id },
                select: { id: true },
              });
              const subIds = subs.map((s) => s.id);

              if (subIds.length > 0) {
                const kets = await tx.keteranganAnggaran.findMany({
                  where: { subAnggaranId: { in: subIds } },
                  select: { id: true },
                });
                const ketIds = kets.map((k) => k.id);

                if (ketIds.length > 0) {
                  await tx.reimbursement.deleteMany({
                    where: { keteranganAnggaranId: { in: ketIds } },
                  });
                  await tx.keteranganAnggaran.deleteMany({
                    where: { id: { in: ketIds } },
                  });
                }

                await tx.subAnggaran.deleteMany({
                  where: { mainAnggaranId: ext.id },
                });
              }

              await tx.mainAnggaran.delete({
                where: { id: ext.id },
              });
            }
          }

          for (const incoming of rawPosPengeluaran) {
            const incNama = (incoming.deskripsi || incoming.namaPos || incoming.namaMain || '').trim();
            if (!incNama) continue;

            const exists = existingPengeluaran.some(
              (ext) => ext.namaMain.trim().toLowerCase() === incNama.toLowerCase()
            );

            if (!exists) {
              const rawNom = typeof incoming.nominalAlokasi === 'string'
                ? parseFloat(incoming.nominalAlokasi.replace(/\./g, '').replace(',', '.')) || 0
                : Number(incoming.nominalAlokasi) || 0;

              await tx.mainAnggaran.create({
                data: {
                  budgetId: existingBudget.id,
                  namaMain: incNama,
                  nominalAlokasi: rawNom,
                  nominalTerpakai: 0,
                  tipe: 'pengeluaran',
                },
              });
            }
          }
        }

        // 2. Sinkronisasi Pos Pemasukan HANYA jika rawPosPemasukan dikirim
        if (rawPosPemasukan && Array.isArray(rawPosPemasukan)) {
          // Hapus atau perbarui yang ada
          for (const ext of existingPemasukan) {
            const matchedIncoming = rawPosPemasukan.find(
              (pos: any) => (pos.deskripsi || pos.namaPos || pos.namaMain || pos.nama || '').trim().toLowerCase() === ext.namaMain.trim().toLowerCase()
            );

            if (matchedIncoming) {
              const rawNom = typeof matchedIncoming.nominalAlokasi === 'string'
                ? parseFloat(matchedIncoming.nominalAlokasi.replace(/\./g, '').replace(',', '.')) || 0
                : Number(matchedIncoming.nominalAlokasi) || 0;

              const incNama = (matchedIncoming.deskripsi || matchedIncoming.namaPos || matchedIncoming.namaMain || ext.namaMain).trim();

              await tx.mainAnggaran.update({
                where: { id: ext.id },
                data: {
                  nominalAlokasi: rawNom,
                  namaMain: incNama,
                  tipe: 'pemasukan',
                },
              });

              const existingSub = await tx.subAnggaran.findFirst({
                where: { mainAnggaranId: ext.id, tipe: 'pemasukan' },
              });

              if (existingSub) {
                await tx.subAnggaran.update({
                  where: { id: existingSub.id },
                  data: {
                    namaSub: incNama,
                    nominalAlokasi: rawNom,
                  },
                });
              } else {
                await tx.subAnggaran.create({
                  data: {
                    mainAnggaranId: ext.id,
                    namaSub: incNama,
                    nominalAlokasi: rawNom,
                    nominalTerpakai: 0,
                    tipe: 'pemasukan',
                  },
                });
              }
            } else {
              // Jika dihapus dari list alokasi pemasukan
              await tx.subAnggaran.deleteMany({
                where: { mainAnggaranId: ext.id },
              });
              await tx.mainAnggaran.delete({
                where: { id: ext.id },
              });
            }
          }

          for (const inc of rawPosPemasukan) {
            const incNama = (inc.deskripsi || inc.namaPos || inc.namaMain || inc.nama || '').trim();
            if (!incNama) continue;

            const rawNom = typeof inc.nominalAlokasi === 'string'
              ? parseFloat(inc.nominalAlokasi.replace(/\./g, '').replace(',', '.')) || 0
              : Number(inc.nominalAlokasi) || 0;

            const extMatch = existingPemasukan.find((e) => e.namaMain.trim().toLowerCase() === incNama.toLowerCase());

            if (!extMatch) {
              await tx.mainAnggaran.create({
                data: {
                  budgetId: existingBudget.id,
                  namaMain: incNama,
                  nominalAlokasi: rawNom,
                  nominalTerpakai: 0,
                  tipe: 'pemasukan',
                  subAnggaran: {
                    create: [
                      {
                        namaSub: incNama,
                        nominalAlokasi: rawNom,
                        nominalTerpakai: 0,
                        tipe: 'pemasukan',
                      },
                    ],
                  },
                },
              });
            }
          }
        }

        const approvedReimbursements = await tx.reimbursement.findMany({
          where: {
            proyekId: parseInt(proyekId, 10),
            status: 'APPROVED',
          },
          select: { nominal: true },
        });

        const totalPengeluaran = approvedReimbursements.reduce(
          (sum, r) => sum + Number(r.nominal),
          0
        );

        const updatedBudget = await tx.budget.update({
          where: { id: existingBudget.id },
          data: {
            nilaiKontrak: parsedNilaiKontrak,
            rabTotal: parsedRabTotal,
            targetPemasukan: parsedTargetPemasukan,
            totalPengeluaran,
            sisaBudget: Number(parsedRabTotal) - totalPengeluaran,
          },
          include: {
            mainAnggaran: {
              include: {
                subAnggaran: {
                  include: { keterangan: true }
                }
              }
            },
          },
        });

        return updatedBudget;

      } else {
        const createMainData: any[] = rawPosPengeluaran
          .filter((pos: any) => (pos.deskripsi || pos.namaPos || pos.namaMain || '').trim() !== '')
          .map((pos: any) => ({
            namaMain: (pos.deskripsi || pos.namaPos || pos.namaMain).trim(),
            nominalAlokasi: typeof pos.nominalAlokasi === 'string'
              ? parseFloat(pos.nominalAlokasi.replace(/\./g, '').replace(',', '.')) || 0
              : Number(pos.nominalAlokasi) || 0,
            nominalTerpakai: 0,
            tipe: 'pengeluaran',
          }));

        if (rawPosPemasukan && rawPosPemasukan.length > 0) {
          for (const inc of rawPosPemasukan) {
            const incNama = (inc.deskripsi || inc.namaPos || inc.namaMain || inc.nama || '').trim();
            if (incNama) {
              const nom = typeof inc.nominalAlokasi === 'string'
                ? parseFloat(inc.nominalAlokasi.replace(/\./g, '').replace(',', '.')) || 0
                : Number(inc.nominalAlokasi) || 0;

              createMainData.push({
                namaMain: incNama,
                nominalAlokasi: nom,
                nominalTerpakai: 0,
                tipe: 'pemasukan',
                subAnggaran: {
                  create: [
                    {
                      namaSub: incNama,
                      nominalAlokasi: nom,
                      nominalTerpakai: 0,
                      tipe: 'pemasukan',
                    },
                  ],
                },
              });
            }
          }
        }

        const newBudget = await tx.budget.create({
          data: {
            proyekId: parseInt(proyekId, 10),
            nilaiKontrak: parsedNilaiKontrak,
            rabTotal: parsedRabTotal,
            targetPemasukan: parsedTargetPemasukan,
            sisaBudget: parsedRabTotal,
            totalPengeluaran: 0,
            totalReimbursement: 0,
            totalPemasukan: 0,
            pemasukanBelumDialokasikan: 0,
            mainAnggaran: {
              create: createMainData,
            },
          },
          include: {
            mainAnggaran: {
              include: {
                subAnggaran: {
                  include: { keterangan: true }
                }
              }
            },
          },
        });

        return newBudget;
      }
    });

    if (userId) {
      let actor = 'Project Manager';
      if (isSuperAdmin) actor = 'Super Admin';
      else if (roles.includes('Direktur / Manajemen')) actor = 'Direktur';
      else if (roles.includes('Tim Keuangan')) actor = 'Tim Keuangan';

      await prisma.auditTrail.create({
        data: {
          userId: parseInt(userId, 10),
          aksi: 'input_rab',
          detail: `${actor} menginput RAB proyek ${project.nama} senilai Rp ${parseFloat(rabTotal).toLocaleString()}`,
        },
      });
    }

    const responseBudget = {
      ...result,
      posAnggaran: result.mainAnggaran.map((m) => ({
        ...m,
        deskripsi: m.namaMain,
        namaPos: m.namaMain,
      })),
    };

    clearCache('dashboard:');
    clearCache('proyek:');
    return NextResponse.json({ message: 'RAB budget initialized successfully', budget: responseBudget }, { status: 201 });

  } catch (error: any) {
    console.error('Input budget error:', error);
    if (error.message && error.message.startsWith('ValidationError:')) {
      return NextResponse.json(
        { message: error.message.replace('ValidationError:', '').trim() },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// PATCH: Directly update a single pos alokasi (Main / Sub / Keterangan) — PM of project, Tim Keuangan, Direktur, atau Super Admin
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    const rolesHeader = req.headers.get('x-user-roles') || role || '';
    const roles = rolesHeader.split(',');
    const userId = req.headers.get('x-user-id');
    const { id: proyekIdStr } = await params;
    const proyekId = parseInt(proyekIdStr, 10);

    // Authorization: PM assigned to project, Tim Keuangan, Direktur, or Super Admin
    const isDirektur = roles.includes('Direktur / Manajemen') || role === 'Direktur / Manajemen';
    const isSuperAdmin = roles.includes('Superadmin') || roles.includes('superadmin') || role === 'Superadmin' || role === 'superadmin';
    const isKeuangan = roles.includes('Tim Keuangan') || role === 'Tim Keuangan';

    const isPM = userId
      ? await prisma.userProyek.findFirst({
          where: { userId: parseInt(userId, 10), proyekId, role: 'Project Manager' },
        })
      : null;

    if (!isDirektur && !isPM && !isSuperAdmin && !isKeuangan) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { type, id, nominalAlokasi } = body;

    if (!['main', 'sub', 'ket'].includes(type) || !id || nominalAlokasi == null || Number(nominalAlokasi) < 0) {
      return NextResponse.json({ message: 'type (main|sub|ket), id, and nominalAlokasi (>=0) are required' }, { status: 400 });
    }

    const newAlokasi = Number(nominalAlokasi);
    const posId = Number(id);

    if (type === 'main') {
      await prisma.mainAnggaran.update({ where: { id: posId }, data: { nominalAlokasi: newAlokasi } });
    } else if (type === 'sub') {
      await prisma.subAnggaran.update({ where: { id: posId }, data: { nominalAlokasi: newAlokasi } });
    } else {
      await prisma.keteranganAnggaran.update({ where: { id: posId }, data: { nominalAlokasi: newAlokasi } });
    }

    // Audit trail
    if (userId) {
      const actor = isSuperAdmin ? 'Super Admin' : (isDirektur ? 'Direktur' : (isKeuangan ? 'Tim Keuangan' : 'Project Manager'));
      
      await prisma.auditTrail.create({
        data: {
          userId: parseInt(userId, 10),
          aksi: 'edit_alokasi',
          detail: `${actor} mengedit alokasi ${type} id=${posId} pada proyek ${proyekId} menjadi Rp ${newAlokasi.toLocaleString('id-ID')}`,
        },
      });
    }

    clearCache('dashboard:');
    clearCache('proyek:');
    return NextResponse.json({ message: 'Alokasi berhasil diperbarui' });
    
  } catch (error: any) {
    console.error('PATCH alokasi error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}