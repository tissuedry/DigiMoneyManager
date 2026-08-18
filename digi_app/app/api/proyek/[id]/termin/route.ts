import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearCache } from '@/lib/route-cache';

async function checkAuthorization(req: NextRequest, proyekId: number) {
  const userId = req.headers.get('x-user-id');
  const userRole = req.headers.get('x-user-role');

  const isDirektur = userRole === 'Direktur / Manajemen';
  const isSuperAdmin = userRole === 'Superadmin' || userRole === 'superadmin';

  const isMember = userId
    ? await prisma.userProyek.findFirst({
      where: { userId: parseInt(userId, 10), proyekId },
    })
    : null;

  return isDirektur || isSuperAdmin || isMember;
}

// GET: Mengambil daftar termin pembayaran
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const proyekId = parseInt(id, 10);

    const isAuthorized = await checkAuthorization(req, proyekId);
    if (!isAuthorized) {
      return NextResponse.json({ message: 'Forbidden: You must be a project member, Direktur, or Super Admin to access this data' }, { status: 403 });
    }

    const daftarTermin = await prisma.terminPembayaran.findMany({
      where: { proyekId },
      orderBy: { urutan: 'asc' },
    });

    return NextResponse.json({ termin: daftarTermin });

  } catch (error: any) {
    console.error('Fetch termin error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// POST: Menambah termin baru (status awal: BELUM_DITERIMA)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const proyekId = parseInt(id, 10);

    const isAuthorized = await checkAuthorization(req, proyekId);
    if (!isAuthorized) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { terminData, namaTermin, nominal, persentaseProgress, catatan, posAnggaranList } = body;

    // Skenario A: Update batch list termin (dari EditTerminModal)
    if (Array.isArray(terminData)) {
      await prisma.$transaction(async (tx) => {
        await tx.terminPembayaran.deleteMany({
          where: {
            proyekId,
            status: 'BELUM_DITERIMA'
          },
        });

        for (let idx = 0; idx < terminData.length; idx++) {
          const t = terminData[idx];

          if (t.id) {
            await tx.terminPembayaran.upsert({
              where: { id: t.id },
              update: {
                namaTermin: t.namaTermin,
                nominal: parseFloat(t.nominal),
                persentaseProgress: parseFloat(t.persentaseProgress),
                urutan: idx + 1,
              },
              create: {
                proyekId,
                namaTermin: t.namaTermin,
                nominal: parseFloat(t.nominal),
                persentaseProgress: parseFloat(t.persentaseProgress),
                status: 'BELUM_DITERIMA',
                urutan: idx + 1,
              }
            });
          } else {
            await tx.terminPembayaran.create({
              data: {
                proyekId,
                namaTermin: t.namaTermin,
                nominal: parseFloat(t.nominal),
                persentaseProgress: parseFloat(t.persentaseProgress),
                status: 'BELUM_DITERIMA',
                urutan: idx + 1,
              }
            });
          }
        }
      });

      clearCache('proyek:');
      return NextResponse.json({ success: true, message: 'Termin berhasil diperbarui' }, { status: 200 });
    }

    // Skenario B: Tambah single termin & main alokasi pemasukan (dari AddPenambaganTermin)
    if (namaTermin && nominal) {
      const nominalNum = parseFloat(String(nominal));
      const progressNum = persentaseProgress ? parseFloat(String(persentaseProgress)) : 0;

      await prisma.$transaction(async (tx) => {
        const countExisting = await tx.terminPembayaran.count({ where: { proyekId } });

        // 1. Buat record TerminPembayaran
        await tx.terminPembayaran.create({
          data: {
            proyekId,
            namaTermin,
            nominal: nominalNum,
            persentaseProgress: progressNum,
            catatan: catatan || null,
            status: 'BELUM_DITERIMA',
            urutan: countExisting + 1,
          },
        });

        // 2. Buat / Update MainAnggaran tipe='pemasukan' jika posAnggaranList dikirim
        if (Array.isArray(posAnggaranList) && posAnggaranList.length > 0) {
          let budget = await tx.budget.findUnique({ where: { proyekId } });
          if (!budget) {
            budget = await tx.budget.create({
              data: {
                proyekId,
                rabTotal: 0,
                sisaBudget: 0,
                totalPemasukan: 0,
                pemasukanBelumDialokasikan: 0,
              },
            });
          }

          for (const pos of posAnggaranList) {
            const posNama = (pos.deskripsi || pos.namaPos || pos.nama || '').trim();
            const rawNominal = typeof pos.nominalAlokasi === 'string'
              ? parseFloat(pos.nominalAlokasi.replace(/\./g, '').replace(',', '.'))
              : Number(pos.nominalAlokasi) || 0;

            if (posNama && rawNominal > 0) {
              const existingMain = await tx.mainAnggaran.findFirst({
                where: {
                  budgetId: budget.id,
                  namaMain: posNama,
                  tipe: 'pemasukan',
                },
              });

              if (existingMain) {
                await tx.mainAnggaran.update({
                  where: { id: existingMain.id },
                  data: { nominalAlokasi: rawNominal },
                });
              } else {
                await tx.mainAnggaran.create({
                  data: {
                    budgetId: budget.id,
                    namaMain: posNama,
                    nominalAlokasi: rawNominal,
                    tipe: 'pemasukan',
                  },
                });
              }
            }
          }
        }
      });

      clearCache('proyek:');
      clearCache('dashboard:');
      return NextResponse.json({ success: true, message: 'Termin dan Main Alokasi Pemasukan berhasil ditambahkan' }, { status: 201 });
    }

    return NextResponse.json({ message: 'Format data tidak valid' }, { status: 400 });

  } catch (error: any) {
    console.error('Save termin error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const proyekId = parseInt(id, 10);

    const isAuthorized = await checkAuthorization(req, proyekId);
    if (!isAuthorized) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { terminId, tanggalPencairan } = body;

    if (!terminId || !tanggalPencairan) {
      return NextResponse.json({ message: 'terminId dan tanggalPencairan wajib diisi' }, { status: 400 });
    }

    // Cari termin yang akan dicairkan
    const termin = await prisma.terminPembayaran.findFirst({
      where: { id: parseInt(terminId, 10), proyekId },
    });

    if (!termin) {
      return NextResponse.json({ message: 'Termin tidak ditemukan' }, { status: 404 });
    }

    if (termin.status === 'DITERIMA') {
      return NextResponse.json({ message: 'Termin ini sudah berstatus DITERIMA' }, { status: 400 });
    }

    // Transaksi atomik: update termin + update budget
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update status termin
      const updatedTermin = await tx.terminPembayaran.update({
        where: { id: termin.id },
        data: {
          status: 'DITERIMA',
          tanggalPencairan: new Date(tanggalPencairan),
        },
      });

      // 2. Update budget: tambahkan nominal ke totalPemasukan & pemasukanBelumDialokasikan
      const budget = await tx.budget.findUnique({ where: { proyekId } });
      if (budget) {
        await tx.budget.update({
          where: { proyekId },
          data: {
            totalPemasukan: { increment: Number(termin.nominal) },
            pemasukanBelumDialokasikan: { increment: Number(termin.nominal) },
          },
        });
      }

      return updatedTermin;
    });

    clearCache('proyek:');
    clearCache('dashboard:');
    return NextResponse.json({ success: true, data: result });

  } catch (error: any) {
    console.error('Pencairan termin error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// DELETE: Hapus termin (hanya jika statusnya BELUM_DITERIMA)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const proyekId = parseInt(id, 10);

    const isAuthorized = await checkAuthorization(req, proyekId);
    if (!isAuthorized) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const terminId = searchParams.get('terminId');

    if (!terminId) {
      return NextResponse.json({ message: 'terminId wajib disertakan' }, { status: 400 });
    }

    const termin = await prisma.terminPembayaran.findFirst({
      where: { id: parseInt(terminId, 10), proyekId },
    });

    if (!termin) {
      return NextResponse.json({ message: 'Termin tidak ditemukan' }, { status: 404 });
    }

    if (termin.status === 'DITERIMA') {
      return NextResponse.json({ message: 'Termin yang sudah DITERIMA tidak dapat dihapus' }, { status: 400 });
    }

    await prisma.terminPembayaran.delete({ where: { id: termin.id } });

    clearCache('proyek:');
    return NextResponse.json({ success: true, message: 'Termin berhasil dihapus' });

  } catch (error: any) {
    console.error('Delete termin error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}