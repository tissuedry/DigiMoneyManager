import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearCache } from '@/lib/route-cache';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    const rolesHeader = req.headers.get('x-user-roles') || role || '';
    const roles = rolesHeader.split(',').map((r) => r.trim());
    const userId = req.headers.get('x-user-id');
    const { id: proyekId } = await params;

    const isPM = await prisma.userProyek.findFirst({
      where: {
        userId: parseInt(userId || '0', 10),
        proyekId: parseInt(proyekId, 10),
        role: 'Project Manager',
      },
    });

    const isSuperAdmin = roles.includes('Superadmin') || roles.includes('superadmin') || role === 'Superadmin' || role === 'superadmin';
    const isAllowed = isPM || roles.includes('Tim Keuangan') || roles.includes('Direktur / Manajemen') || isSuperAdmin;

    if (!isAllowed) {
      return NextResponse.json(
        { message: 'Forbidden: You must be the assigned Project Manager, Tim Keuangan, Direktur / Manajemen, or Superadmin to modify this project budget' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { type, id, nominalAlokasi } = body;

    if (!type || !id || nominalAlokasi === undefined) {
      return NextResponse.json(
        { message: 'type, id, dan nominalAlokasi wajib diisi' },
        { status: 400 }
      );
    }

    const newAlokasi = Number(nominalAlokasi);
    if (isNaN(newAlokasi) || newAlokasi < 0) {
      return NextResponse.json({ message: 'Nominal Alokasi tidak Valid' }, { status: 400 });
    }

    const project = await prisma.proyek.findUnique({
      where: { id: parseInt(proyekId, 10) },
    });
    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    const numericId = parseInt(String(id), 10);
    let updated;

    if (type === 'main') {
      const main = await prisma.mainAnggaran.findUnique({ where: { id: numericId } });
      if (!main) {
        return NextResponse.json({ message: 'Pos main tidak ditemukan' }, { status: 404 });
      }
      const terpakai = Number(main.nominalTerpakai);
      if (newAlokasi < terpakai) {
        return NextResponse.json(
          { message: `Alokasi untuk pos "${main.namaMain}" tidak boleh kurang dari nominal yang sudah terpakai (Rp ${terpakai.toLocaleString('id-ID')})` },
          { status: 400 }
        );
      }
      updated = await prisma.mainAnggaran.update({
        where: { id: numericId },
        data: { nominalAlokasi: newAlokasi },
      });

      // Jika yang diubah adalah pos pengeluaran, otomatis sesuaikan pos pemasukan (Gross Profit)
      if (main.tipe === 'pengeluaran' || !main.tipe) {
        const budget = await prisma.budget.findUnique({
          where: { id: main.budgetId },
          include: {
            mainAnggaran: true,
          },
        });

        if (budget) {
          const totalPengeluaranAlokasi = budget.mainAnggaran
            .filter((m) => (m.tipe === 'pengeluaran' || !m.tipe))
            .reduce((sum, m) => sum + (m.id === numericId ? newAlokasi : Number(m.nominalAlokasi)), 0);

          const newTargetPemasukan = Math.max(0, Number(budget.nilaiKontrak) - totalPengeluaranAlokasi);

          await prisma.budget.update({
            where: { id: budget.id },
            data: { targetPemasukan: newTargetPemasukan },
          });

          const posPemasukan = budget.mainAnggaran.filter((m) => m.tipe === 'pemasukan');
          if (posPemasukan.length > 0) {
            const primaryPemasukan = posPemasukan[0];
            await prisma.mainAnggaran.update({
              where: { id: primaryPemasukan.id },
              data: { nominalAlokasi: newTargetPemasukan },
            });

            const primarySub = await prisma.subAnggaran.findFirst({
              where: { mainAnggaranId: primaryPemasukan.id, tipe: 'pemasukan' },
            });
            if (primarySub) {
              await prisma.subAnggaran.update({
                where: { id: primarySub.id },
                data: { nominalAlokasi: newTargetPemasukan },
              });
            }
          }
        }
      }
    } else if (type === 'sub') {
      const sub = await prisma.subAnggaran.findUnique({ where: { id: numericId } });
      if (!sub) {
        return NextResponse.json({ message: 'Pos sub tidak ditemukan' }, { status: 404 });
      }
      const terpakai = Number(sub.nominalTerpakai);
      if (newAlokasi < terpakai) {
        return NextResponse.json(
          { message: `Alokasi untuk pos "${sub.namaSub}" tidak boleh kurang dari nominal yang sudah terpakai (Rp ${terpakai.toLocaleString('id-ID')})` },
          { status: 400 }
        );
      }
      updated = await prisma.subAnggaran.update({
        where: { id: numericId },
        data: { nominalAlokasi: newAlokasi },
      });
    } else if (type === 'ket') {
      const ket = await prisma.keteranganAnggaran.findUnique({ where: { id: numericId } });
      if (!ket) {
        return NextResponse.json({ message: 'Pos keterangan tidak ditemukan' }, { status: 404 });
      }
      const realisasi = Number(ket.nominalRealisasi);
      if (newAlokasi < realisasi) {
        return NextResponse.json(
          { message: `Alokasi untuk pos "${ket.keterangan}" tidak boleh kurang dari nominal yang sudah terealisasi (Rp ${realisasi.toLocaleString('id-ID')})` },
          { status: 400 }
        );
      }
      updated = await prisma.keteranganAnggaran.update({
        where: { id: numericId },
        data: { nominalAlokasi: newAlokasi },
      });

      // Sync nominalAlokasi SubAnggaran parent = SUM semua keterangan-nya
      const siblingsKet = await prisma.keteranganAnggaran.findMany({
        where: { subAnggaranId: ket.subAnggaranId },
      });
      const totalAlokasiSub = siblingsKet.reduce((sum, k) => {
        const val = k.id === numericId ? newAlokasi : Number(k.nominalAlokasi);
        return sum + val;
      }, 0);
      await prisma.subAnggaran.update({
        where: { id: ket.subAnggaranId },
        data: { nominalAlokasi: totalAlokasiSub },
      });
    } else {
      return NextResponse.json({ message: 'type harus main, sub, atau ket' }, { status: 400 });
    }

    if (userId) {
      await prisma.auditTrail.create({
        data: {
          userId: parseInt(userId, 10),
          aksi: 'ubah_alokasi',
          detail: `Mengubah alokasi pos (${type} #${numericId}) proyek ${project.nama} menjadi Rp ${newAlokasi.toLocaleString('id-ID')}`,
        },
      });
    }

    clearCache('dashboard:');
    clearCache('proyek:');
    return NextResponse.json({ message: 'Alokasi berhasil diperbarui', data: updated });
  } catch (error: any) {
    console.error('Update alokasi error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    const rolesHeader = req.headers.get('x-user-roles') || role || '';
    const roles = rolesHeader.split(',').map((r) => r.trim());
    const userId = req.headers.get('x-user-id');
    const { id: proyekId } = await params;

    const isPM = await prisma.userProyek.findFirst({
      where: {
        userId: parseInt(userId || '0', 10),
        proyekId: parseInt(proyekId, 10),
        role: 'Project Manager',
      },
    });

    const isSuperAdmin = roles.includes('Superadmin') || roles.includes('superadmin') || role === 'Superadmin' || role === 'superadmin';
    const isAllowed = isPM || roles.includes('Tim Keuangan') || roles.includes('Direktur / Manajemen') || isSuperAdmin;

    if (!isAllowed) {
      return NextResponse.json(
        { message: 'Forbidden: You must be the assigned Project Manager, Tim Keuangan, Direktur / Manajemen, or Superadmin to modify this project budget' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const rawPosPengeluaran = body.posPengeluaran || body.posAnggaran;
    const rawPosPemasukan = body.posPemasukan;
    const { nilaiKontrak, targetPemasukan } = body;

    if (!rawPosPengeluaran && !rawPosPemasukan && nilaiKontrak === undefined && targetPemasukan === undefined) {
      return NextResponse.json(
        { message: 'Pos pengeluaran / pemasukan atau nilai anggaran wajib diisi' },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await prisma.proyek.findUnique({
      where: { id: parseInt(proyekId, 10) },
      include: {
        budget: {
          include: {
            mainAnggaran: {
              include: {
                subAnggaran: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    const existingBudget = project.budget;

    const parseNumber = (val: any) => {
      if (val === undefined || val === null) return 0;
      if (typeof val === 'number') return val;
      return parseFloat(String(val).replace(/[^0-9.-]+/g, '')) || 0;
    };

    let sumPengeluaran = 0;
    if (rawPosPengeluaran && Array.isArray(rawPosPengeluaran)) {
      sumPengeluaran = rawPosPengeluaran.reduce((sum: number, pos: any) => {
        return sum + parseNumber(pos.nominalAlokasi);
      }, 0);
    }

    let sumPemasukan = 0;
    if (rawPosPemasukan && Array.isArray(rawPosPemasukan)) {
      sumPemasukan = rawPosPemasukan.reduce((sum: number, pos: any) => {
        return sum + parseNumber(pos.nominalAlokasi);
      }, 0);
    }

    const parsedNilaiKontrak = nilaiKontrak !== undefined && nilaiKontrak !== null
      ? parseNumber(nilaiKontrak)
      : (existingBudget && Number(existingBudget.nilaiKontrak) > 0 ? Number(existingBudget.nilaiKontrak) : (sumPengeluaran + sumPemasukan));

    // Pendapatan otomatis mengikuti sisa anggaran (Gross Profit = Nilai Kontrak - Total Biaya)
    // jika rawPosPengeluaran disediakan dan tidak ada rawPosPemasukan eksplisit.
    const autoGrossProfit = Math.max(0, parsedNilaiKontrak - sumPengeluaran);

    const parsedTargetPemasukan = targetPemasukan !== undefined && targetPemasukan !== null
      ? parseNumber(targetPemasukan)
      : (rawPosPemasukan 
          ? sumPemasukan 
          : (rawPosPengeluaran 
              ? autoGrossProfit 
              : (existingBudget ? Number(existingBudget.targetPemasukan) : sumPemasukan)));

    const result = await prisma.$transaction(async (tx) => {
      if (existingBudget) {
        if (rawPosPengeluaran && Array.isArray(rawPosPengeluaran)) {
          const existingPengeluaran = existingBudget.mainAnggaran.filter(
            (m) => m.tipe === 'pengeluaran' || !m.tipe
          );

          for (const ext of existingPengeluaran) {
            const matchedIncoming = rawPosPengeluaran.find(
              (pos: any) =>
                (pos.deskripsi || pos.namaMain || pos.namaPos || '').trim().toLowerCase() ===
                ext.namaMain.trim().toLowerCase()
            );

            if (matchedIncoming) {
              const newAlokasi = parseNumber(matchedIncoming.nominalAlokasi);
              const nominalTerpakai = Number(ext.nominalTerpakai);

              if (newAlokasi < nominalTerpakai) {
                throw new Error(
                  `ValidationError: Alokasi untuk pos "${ext.namaMain}" tidak boleh kurang dari nominal yang sudah terpakai (Rp ${nominalTerpakai.toLocaleString('id-ID')})`
                );
              }

              await tx.mainAnggaran.update({
                where: { id: ext.id },
                data: {
                  nominalAlokasi: newAlokasi,
                  namaMain: (matchedIncoming.deskripsi || matchedIncoming.namaMain || matchedIncoming.namaPos).trim(),
                },
              });
            } else {
              await tx.mainAnggaran.delete({
                where: { id: ext.id },
              });
            }
          }

          for (const incoming of rawPosPengeluaran) {
            const incomingName = (incoming.deskripsi || incoming.namaMain || incoming.namaPos || '').trim();
            if (!incomingName) continue;

            const exists = existingPengeluaran.some(
              (ext) => ext.namaMain.trim().toLowerCase() === incomingName.toLowerCase()
            );

            if (!exists) {
              await tx.mainAnggaran.create({
                data: {
                  budgetId: existingBudget.id,
                  namaMain: incomingName,
                  nominalAlokasi: parseNumber(incoming.nominalAlokasi),
                  nominalTerpakai: 0,
                  tipe: 'pengeluaran',
                },
              });
            }
          }
        }

        if (rawPosPemasukan && Array.isArray(rawPosPemasukan)) {
          const existingPemasukan = existingBudget.mainAnggaran.filter((m) => m.tipe === 'pemasukan');

          for (const ext of existingPemasukan) {
            const matchedIncoming = rawPosPemasukan.find(
              (pos: any) =>
                (pos.deskripsi || pos.namaMain || pos.namaPos || '').trim().toLowerCase() ===
                ext.namaMain.trim().toLowerCase()
            );

            if (matchedIncoming) {
              const newAlokasi = parseNumber(matchedIncoming.nominalAlokasi);
              await tx.mainAnggaran.update({
                where: { id: ext.id },
                data: {
                  nominalAlokasi: newAlokasi,
                  namaMain: (matchedIncoming.deskripsi || matchedIncoming.namaMain || matchedIncoming.namaPos).trim(),
                },
              });
            } else {
              await tx.mainAnggaran.delete({
                where: { id: ext.id },
              });
            }
          }

          for (const incoming of rawPosPemasukan) {
            const incomingName = (incoming.deskripsi || incoming.namaMain || incoming.namaPos || '').trim();
            if (!incomingName) continue;

            const exists = existingPemasukan.some(
              (ext) => ext.namaMain.trim().toLowerCase() === incomingName.toLowerCase()
            );

            if (!exists) {
              await tx.mainAnggaran.create({
                data: {
                  budgetId: existingBudget.id,
                  namaMain: incomingName,
                  nominalAlokasi: parseNumber(incoming.nominalAlokasi),
                  nominalTerpakai: 0,
                  tipe: 'pemasukan',
                  subAnggaran: {
                    create: [
                      {
                        namaSub: incomingName,
                        nominalAlokasi: parseNumber(incoming.nominalAlokasi),
                        nominalTerpakai: 0,
                        tipe: 'pemasukan',
                      },
                    ],
                  },
                },
              });
            }
          }
        } else if (rawPosPengeluaran && Array.isArray(rawPosPengeluaran)) {
          // Pendapatan otomatis mengikuti perubahan pos biaya (Gross Profit = Nilai Kontrak - Total Biaya)
          const existingPemasukan = existingBudget.mainAnggaran.filter((m) => m.tipe === 'pemasukan');
          if (existingPemasukan.length > 0) {
            // Update pos pemasukan utama (pertama) dengan sisa gross profit
            const primaryPemasukan = existingPemasukan[0];
            await tx.mainAnggaran.update({
              where: { id: primaryPemasukan.id },
              data: { nominalAlokasi: parsedTargetPemasukan },
            });

            // Update juga subAnggaran terkait jika ada
            const primarySub = await tx.subAnggaran.findFirst({
              where: { mainAnggaranId: primaryPemasukan.id, tipe: 'pemasukan' },
            });
            if (primarySub) {
              await tx.subAnggaran.update({
                where: { id: primarySub.id },
                data: { nominalAlokasi: parsedTargetPemasukan },
              });
            }
          } else if (parsedTargetPemasukan > 0) {
            // Buat pos pemasukan default jika belum ada
            await tx.mainAnggaran.create({
              data: {
                budgetId: existingBudget.id,
                namaMain: 'Gross Profit',
                nominalAlokasi: parsedTargetPemasukan,
                nominalTerpakai: 0,
                tipe: 'pemasukan',
                subAnggaran: {
                  create: [
                    {
                      namaSub: 'Gross Profit',
                      nominalAlokasi: parsedTargetPemasukan,
                      nominalTerpakai: 0,
                      tipe: 'pemasukan',
                    },
                  ],
                },
              },
            });
          }
        }

        const totalPengeluaran = Number(existingBudget.totalPengeluaran);
        const updatedBudget = await tx.budget.update({
          where: { id: existingBudget.id },
          data: {
            nilaiKontrak: parsedNilaiKontrak,
            targetPemasukan: parsedTargetPemasukan,
            sisaBudget: parsedNilaiKontrak - totalPengeluaran,
          },
          include: {
            mainAnggaran: {
              include: {
                subAnggaran: true,
              },
            },
          },
        });

        return updatedBudget;
      } else {
        const createMainData: any[] = [];

        if (rawPosPengeluaran && Array.isArray(rawPosPengeluaran)) {
          for (const pos of rawPosPengeluaran) {
            const name = (pos.deskripsi || pos.namaMain || pos.namaPos || '').trim();
            if (name) {
              createMainData.push({
                namaMain: name,
                nominalAlokasi: parseNumber(pos.nominalAlokasi),
                nominalTerpakai: 0,
                tipe: 'pengeluaran',
              });
            }
          }
        }

        if (rawPosPemasukan && Array.isArray(rawPosPemasukan)) {
          for (const pos of rawPosPemasukan) {
            const name = (pos.deskripsi || pos.namaMain || pos.namaPos || '').trim();
            if (name) {
              createMainData.push({
                namaMain: name,
                nominalAlokasi: parseNumber(pos.nominalAlokasi),
                nominalTerpakai: 0,
                tipe: 'pemasukan',
                subAnggaran: {
                  create: [
                    {
                      namaSub: name,
                      nominalAlokasi: parseNumber(pos.nominalAlokasi),
                      nominalTerpakai: 0,
                      tipe: 'pemasukan',
                    },
                  ],
                },
              });
            }
          }
        } else if (rawPosPengeluaran && Array.isArray(rawPosPengeluaran) && parsedTargetPemasukan > 0) {
          createMainData.push({
            namaMain: 'Gross Profit',
            nominalAlokasi: parsedTargetPemasukan,
            nominalTerpakai: 0,
            tipe: 'pemasukan',
            subAnggaran: {
              create: [
                {
                  namaSub: 'Gross Profit',
                  nominalAlokasi: parsedTargetPemasukan,
                  nominalTerpakai: 0,
                  tipe: 'pemasukan',
                },
              ],
            },
          });
        }

        const newBudget = await tx.budget.create({
          data: {
            proyekId: parseInt(proyekId, 10),
            nilaiKontrak: parsedNilaiKontrak,
            targetPemasukan: parsedTargetPemasukan,
            sisaBudget: parsedNilaiKontrak,
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
                subAnggaran: true,
              },
            },
          },
        });

        return newBudget;
      }
    });

    if (userId) {
      await prisma.auditTrail.create({
        data: {
          userId: parseInt(userId, 10),
          aksi: 'input_rab',
          detail: `Mengatur budget proyek ${project.nama}: Nilai Kontrak Rp ${parsedNilaiKontrak.toLocaleString('id-ID')}, Target Pemasukan Rp ${parsedTargetPemasukan.toLocaleString('id-ID')}`,
        },
      });
    }

    const responseBudget = {
      ...result,
      posAnggaran: result.mainAnggaran.map((m: any) => ({
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
