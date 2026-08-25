import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

function formatDateInput(d: Date | null): string | null {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    const role = req.headers.get('x-user-role');

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const isAuthorized =
      role === 'Tim Keuangan' ||
      role === 'Direktur / Manajemen' ||
      role === 'Superadmin' ||
      role === 'superadmin';

    if (!isAuthorized) {
      return NextResponse.json({ message: 'Forbidden: Khusus Tim Keuangan, Direktur, atau Superadmin' }, { status: 403 });
    }

    const projectsRaw = await prisma.proyek.findMany({
      orderBy: { id: 'desc' },
      include: {
        budget: {
          include: {
            mainAnggaran: {
              where: { tipe: 'pemasukan' },
              orderBy: { id: 'asc' },
              include: {
                subAnggaran: {
                  where: { tipe: 'pemasukan' },
                  orderBy: { id: 'asc' },
                  include: {
                    keterangan: {
                      orderBy: { id: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
        terminPembayaran: {
          orderBy: { urutan: 'asc' },
        },
        transaksiPemasukan: true,
        users: {
          include: {
            user: { select: { id: true, nama: true, email: true, role: true } },
          },
        },
      },
    });

    if (projectsRaw.length === 0) {
      return NextResponse.json({ projects: [] });
    }

    const warnaPalette = ['#004D34', '#008f5d', '#0284c7', '#2563eb', '#7c3aed', '#d97706', '#dc2626'];

    const projects = projectsRaw.map((p) => {
      const budget = p.budget;
      const pmUser = p.users.find((u) => u.role === 'Project Manager');
      const termins = p.terminPembayaran || [];

      // Calculate termin metrics
      let terminDiterimaNominal = 0;
      let terminDiterimaCount = 0;
      let terminBelumDiterimaNominal = 0;
      let terminBelumDiterimaCount = 0;
      let totalTerminNominal = 0;

      for (const t of termins) {
        const nominal = Number(t.nominal) || 0;
        totalTerminNominal += nominal;
        const statusUpper = (t.status || '').toUpperCase();
        if (['DITERIMA', 'PAID', 'SELESAI', 'APPROVED', 'LUNAS'].includes(statusUpper)) {
          terminDiterimaNominal += nominal;
          terminDiterimaCount += 1;
        } else {
          terminBelumDiterimaNominal += nominal;
          terminBelumDiterimaCount += 1;
        }
      }

      const projectTransaksis = (p as any).transaksiPemasukan || [];
      const totalTransaksiPemasukan = projectTransaksis.reduce(
        (sum: number, t: any) => sum + Number(t.nominal || 0),
        0
      );

      // Pos Pemasukan from mainAnggaran
      const rawPosPemasukan = budget?.mainAnggaran || [];
      let posAnggaran: any[] = [];

      if (rawPosPemasukan.length > 0) {
        posAnggaran = rawPosPemasukan.map((m, idx) => {
          const calculatedTerpakai = m.subAnggaran.reduce((sum: number, sub: any) => {
            const sName = (sub.namaSub || '').trim().toLowerCase();
            const isPenjSub =
              (sName.startsWith('penjualan') || sName.startsWith('pendapatan') || sName === (m.namaMain || '').trim().toLowerCase()) &&
              !sName.includes('diskon') &&
              !sName.includes('retur') &&
              !sName.includes('biaya') &&
              !sName.includes('potongan');

            const related = projectTransaksis.filter(
              (t: any) =>
                t.subCoaId === sub.id ||
                (t.kategori || '').toLowerCase() === (sub.namaSub || '').toLowerCase() ||
                (isPenjSub && ['penerimaan_penjualan', 'penjualan', 'keuntungan_proyek'].includes((t.kategori || '').toLowerCase())) ||
                (isPenjSub && (t.keterangan || '').toLowerCase().includes('selesai'))
            );
            const tSum = related.reduce((a: number, t: any) => a + Number(t.nominal || 0), 0);
            return sum + (isPenjSub ? (tSum > 0 ? tSum : Number(sub.nominalTerpakai || 0)) : tSum);
          }, 0);

          const terpakai = Math.max(Number(m.nominalTerpakai || 0), calculatedTerpakai);

          return {
            id: m.id,
            nama: m.namaMain,
            alokasi: Number(m.nominalAlokasi),
            terpakai,
            warna: warnaPalette[idx % warnaPalette.length],
            subAnggaran: m.subAnggaran.map((s) => {
              const sName = (s.namaSub || '').trim().toLowerCase();
              const isPenjSub =
                (sName.startsWith('penjualan') || sName.startsWith('pendapatan') || sName === (m.namaMain || '').trim().toLowerCase()) &&
                !sName.includes('diskon') &&
                !sName.includes('retur') &&
                !sName.includes('biaya') &&
                !sName.includes('potongan');

              const related = projectTransaksis.filter(
                (t: any) =>
                  t.subCoaId === s.id ||
                  (t.kategori || '').toLowerCase() === (s.namaSub || '').toLowerCase() ||
                  (isPenjSub && ['penerimaan_penjualan', 'penjualan', 'keuntungan_proyek'].includes((t.kategori || '').toLowerCase())) ||
                  (isPenjSub && (t.keterangan || '').toLowerCase().includes('selesai'))
              );
              const tSum = related.reduce((a: number, t: any) => a + Number(t.nominal || 0), 0);

              return {
                id: s.id,
                nama: s.namaSub,
                alokasi: Number(s.nominalAlokasi),
                terpakai: isPenjSub ? (tSum > 0 ? tSum : Number(s.nominalTerpakai || 0)) : tSum,
                keterangan: s.keterangan.map((k: any) => ({
                  id: k.id,
                  nama: k.keterangan,
                  alokasi: Number(k.nominalAlokasi),
                  realisasi: Number(k.nominalRealisasi || 0),
                })),
              };
            }),
          };
        });
      } else if (termins.length > 0) {
        // Synthesize fallback pos from termin if no mainAnggaran exists yet
        posAnggaran = [
          {
            id: -1,
            nama: 'Pendapatan Termin / Proyek',
            alokasi: totalTerminNominal > 0 ? totalTerminNominal : (budget ? Number(budget.nilaiKontrak) : 0),
            terpakai: terminDiterimaNominal,
            warna: '#008f5d',
            subAnggaran: termins.map((t) => ({
              id: t.id,
              nama: t.namaTermin,
              alokasi: Number(t.nominal),
              terpakai: ['DITERIMA', 'PAID', 'SELESAI', 'LUNAS'].includes(t.status.toUpperCase()) ? Number(t.nominal) : 0,
              keterangan: [],
            })),
          },
        ];
      }

      const totalRAB = budget ? Number(budget.nilaiKontrak) : (totalTerminNominal > 0 ? totalTerminNominal : 0);
      const totalPosTerpakai = posAnggaran.reduce((s, pos) => s + pos.terpakai, 0);
      const realisasiPemasukan = Math.max(terminDiterimaNominal, totalPosTerpakai, totalTransaksiPemasukan);

      return {
        id: p.id,
        nama: p.nama,
        kode: `PRJ-${new Date(p.tanggalMulai).getFullYear()}-${String(p.id).padStart(3, '0')}`,
        klien: p.deskripsi || '-',
        deskripsi: p.deskripsi,
        tanggalMulai: formatDateInput(p.tanggalMulai) || '',
        tanggalSelesai: formatDateInput(p.tanggalSelesai),
        pm: pmUser?.user.nama || '',
        status: p.status,
        totalRAB,
        totalPemasukan: totalRAB,
        realisasi: realisasiPemasukan,
        realisasiPemasukan,
        posAnggaran,
        terminPembayaran: termins.map((t) => ({
          id: t.id,
          namaTermin: t.namaTermin,
          urutan: t.urutan,
          persentaseProgress: Number(t.persentaseProgress),
          nominal: Number(t.nominal),
          status: t.status,
          tanggalPencairan: formatDateInput(t.tanggalPencairan),
          catatan: t.catatan || '',
        })),
        terminStats: {
          totalCount: termins.length,
          diterimaCount: terminDiterimaCount,
          diterimaNominal: terminDiterimaNominal,
          belumDiterimaCount: terminBelumDiterimaCount,
          belumDiterimaNominal: terminBelumDiterimaNominal,
        },
      };
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Get Keuangan proyek error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Internal server error', error: message }, { status: 500 });
  }
}
