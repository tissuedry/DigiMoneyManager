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
    const { terminData } = body; // Berisi array data termin dari frontend

    if (!Array.isArray(terminData)) {
      return NextResponse.json({ message: 'Format data tidak valid' }, { status: 400 });
    }

    // Gunakan transaction Prisma agar aman
    await prisma.$transaction(async (tx) => {
      // 1. Opsi paling rapi untuk form "Edit Termin" massal:
      // Hapus dulu termin lama yang statusnya masih BELUM_DITERIMA pada proyek ini, 
      // lalu masukkan data yang baru dikirimkan dari frontend.
      // (Termin yang sudah DITERIMA aman tidak akan terhapus demi menjaga riwayat pencairan).
      
      await tx.terminPembayaran.deleteMany({
        where: { 
          proyekId, 
          status: 'BELUM_DITERIMA' 
        },
      });

      // 2. Masukkan ulang data termin yang diinput user
      for (let idx = 0; idx < terminData.length; idx++) {
        const t = terminData[idx];
        
        // Cek jika termin ini sebelumnya sudah ada ID-nya (misal sudah terdaftar di DB)
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
          // Jika benar-benar baru
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

  } catch (error: any) {
    console.error('Save termin error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
// PATCH: Konfirmasi pencairan termin — ubah status ke DITERIMA + update Budget
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