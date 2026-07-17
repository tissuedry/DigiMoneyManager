import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: List proyek where current user is assigned as Project Manager
function formatDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // All projects where this user has UserProyek role = 'Project Manager'
    const userProyeks = await prisma.userProyek.findMany({
      where: { userId: parseInt(userId, 10), role: 'Project Manager' },
      include: {
        proyek: {
          include: {
            budget: {
              include: {
                mainAnggaran: {
                  include: { subAnggaran: { include: { keterangan: true } } },
                },
              },
            },
            users: {
              include: {
                user: { select: { id: true, nama: true, email: true, role: true } },
              },
            },
          },
        },
      },
    });

    if (userProyeks.length === 0) {
      return NextResponse.json({ projects: [] });
    }

    const proyekIds = userProyeks.map((up) => up.proyekId);

    // Batch all aggregates — ponytail: 2 queries instead of N+1 per project
    const [approvedList, pendingList] = await Promise.all([
      prisma.approval.findMany({
        where: {
          reimbursement: { proyekId: { in: proyekIds } },
          level: 'KEUANGAN',
          status: 'APPROVED',
        },
        select: { reimbursement: { select: { proyekId: true, nominal: true, status: true } } },
      }),
      prisma.reimbursement.findMany({
        where: { proyekId: { in: proyekIds }, status: { notIn: ['APPROVED', 'REJECTED'] } },
        select: { proyekId: true, nominal: true, status: true },
      }),
    ]);

    // Index hasil batch
    const realisasiByProyek: Record<number, number> = {};
    const approvedCount: Record<number, number> = {};
    for (const a of approvedList) {
      const pid = a.reimbursement.proyekId;
      realisasiByProyek[pid] = (realisasiByProyek[pid] || 0) + Number(a.reimbursement.nominal);
      approvedCount[pid] = (approvedCount[pid] || 0) + 1;
    }
    const pendingNominal: Record<number, number> = {};
    const pendingCount: Record<number, number> = {};
    for (const p of pendingList) {
      pendingNominal[p.proyekId] = (pendingNominal[p.proyekId] || 0) + Number(p.nominal);
      pendingCount[p.proyekId] = (pendingCount[p.proyekId] || 0) + 1;
    }

    const warnaPalette = ['#004D34', '#008f5d', '#D97706', '#DC6B19', '#7c3aed', '#6b7280'];

    const projects = userProyeks.map((up) => {
      const p = up.proyek;
      const budget = p.budget;
      const pmUser = p.users.find((u) => u.role === 'Project Manager');

      const posAnggaran = (budget?.mainAnggaran ?? []).map((m, idx) => ({
        id: m.id,
        nama: m.namaMain,
        alokasi: Number(m.nominalAlokasi),
        terpakai: Number(m.nominalTerpakai),
        warna: warnaPalette[idx % warnaPalette.length],
        subAnggaran: m.subAnggaran.map((s) => ({
          id: s.id,
          nama: s.namaSub,
          alokasi: Number(s.nominalAlokasi),
          terpakai: Number(s.nominalTerpakai),
          keterangan: s.keterangan.map((k) => ({
            id: k.id,
            nama: k.keterangan,
            alokasi: Number(k.nominalAlokasi),
            realisasi: Number(k.nominalRealisasi),
          })),
        })),
      }));

      const tim = p.users.map((u) => {
        const nama = u.user.nama;
        const words = nama.split(' ');
        const inisial = words.length >= 2
          ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
          : nama.slice(0, 2).toUpperCase();
        return { id: u.user.id, nama, inisial, role: u.role, divisi: u.divisi || '' };
      });

      return {
        id: p.id,
        nama: p.nama,
        kode: `PRJ-${new Date(p.tanggalMulai).getFullYear()}-${String(p.id).padStart(3, '0')}`,
        klien: p.deskripsi || '-',
        tanggalMulai: formatDateInput(p.tanggalMulai),
        tanggalSelesai: p.tanggalSelesai ? formatDateInput(p.tanggalSelesai) : null,
        pm: pmUser?.user.nama || '',
        status: p.status,
        totalRAB: budget ? Number(budget.rabTotal) : 0,
        realisasi: realisasiByProyek[p.id] || 0,
        posAnggaran,
        tim,
        reimbursementDisetujui: realisasiByProyek[p.id] || 0,
        reimbursementBelumDisetujui: pendingNominal[p.id] || 0,
        reimbursementDisetujuiCount: approvedCount[p.id] || 0,
        reimbursementBelumDisetujuiCount: pendingCount[p.id] || 0,
      };
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Get PM proyek error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Internal server error', error: message }, { status: 500 });
  }
}
