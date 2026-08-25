import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

function formatDateInput(d: Date): string {
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

    const isSuperAdminOrDirektur = 
      role === 'Superadmin' || 
      role === 'superadmin' || 
      role === 'Direktur / Manajemen';

    let projectsRaw = [];

    if (isSuperAdminOrDirektur) {
      projectsRaw = await prisma.proyek.findMany({
        include: {
          budget: {
            include: {
              mainAnggaran: {
                orderBy: { id: 'asc' },
                include: {
                  subAnggaran: {
                    orderBy: { id: 'asc' },
                    include: {
                      keterangan: {
                        orderBy: { id: 'asc' },
                        include: { reimbursements: { include: { approvals: true } } },
                      },
                    },
                  },
                },
              },
            },
          },
          users: {
            include: {
              user: { select: { id: true, nama: true, email: true, role: true } },
            },
          },
        },
      });
    } else {
      const userProyeks = await prisma.userProyek.findMany({
        where: { userId: parseInt(userId, 10), role: 'Project Manager' },
        include: {
          proyek: {
            include: {
              budget: {
                include: {
                  mainAnggaran: {
                    orderBy: { id: 'asc' },
                    include: {
                      subAnggaran: {
                        orderBy: { id: 'asc' },
                        include: {
                          keterangan: {
                            orderBy: { id: 'asc' },
                            include: { reimbursements: { include: { approvals: true } } },
                          },
                        },
                      },
                    },
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
      projectsRaw = userProyeks.map((up) => up.proyek);
    }

    if (projectsRaw.length === 0) {
      return NextResponse.json({ projects: [] });
    }

    const proyekIds = projectsRaw.map((p) => p.id);

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

    const projects = projectsRaw.map((p) => {
      const budget = p.budget;
      const pmUser = p.users.find((u) => u.role === 'Project Manager');

      const posAnggaran = (budget?.mainAnggaran ?? [])
        .filter((m: any) => !m.tipe || m.tipe.toLowerCase() === 'pengeluaran')
        .map((m, idx) => {
          const calculatedTerpakai = (m.subAnggaran ?? []).reduce(
            (sum: number, sub: any) =>
              sum + (sub.keterangan ?? []).reduce(
                (s: number, ket: any) => s + Number(ket.nominalRealisasi || 0), 0
              ),
            0
          );

          const terpakai = Math.max(Number(m.nominalTerpakai || 0), calculatedTerpakai);

          return {
            id: m.id,
            nama: m.namaMain,
            tipe: m.tipe || 'pengeluaran',
            alokasi: Number(m.nominalAlokasi),
            terpakai,
            warna: warnaPalette[idx % warnaPalette.length],
            subAnggaran: (m.subAnggaran ?? [])
              .filter((s: any) => !s.tipe || s.tipe.toLowerCase() === 'pengeluaran')
              .map((s) => {
                const subTerpakai = (s.keterangan ?? []).reduce(
                  (s: number, ket: any) => s + Number(ket.nominalRealisasi || 0), 0
                );

                return {
                  id: s.id,
                  nama: s.namaSub,
                  tipe: s.tipe || 'pengeluaran',
                  alokasi: Number(s.nominalAlokasi),
                  terpakai: Math.max(Number(s.nominalTerpakai || 0), subTerpakai),
                  keterangan: (s.keterangan ?? []).map((k: any) => ({
                    id: k.id,
                    nama: k.keterangan,
                    alokasi: Number(k.nominalAlokasi),
                    realisasi: Number(k.nominalRealisasi),
                    reimbursements: (k.reimbursements ?? []).map((r: any) => ({
                      id: r.id,
                      nominal: Number(r.nominal),
                      urlStruk: r.urlStruk,
                      nama: r.nama,
                      tipe: r.tipe,
                      merchant: r.merchant,
                      tanggalStruk: r.tanggalStruk,
                      kategoriBukti: r.kategoriBukti,
                      createdAt: r.createdAt,
                      fraudFlag: r.fraudFlag,
                      status: r.status,
                      approvals: (r.approvals ?? []).map((a: any) => ({
                        id: a.id,
                        level: a.level,
                        status: a.status,
                      })),
                    })),
                  })),
                };
              }),
          };
        });

      const tim = p.users.map((u) => {
        const nama = u.user.nama;
        const words = nama.split(' ');
        const inisial = words.length >= 2
          ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
          : nama.slice(0, 2).toUpperCase();
        return { id: u.user.id, nama, inisial, role: u.role, divisi: u.divisi || '' };
      });

      const totalPosTerpakai = posAnggaran.reduce((s, pos) => s + pos.terpakai, 0);
      const totalRealisasi = Math.max(realisasiByProyek[p.id] || 0, totalPosTerpakai);

      return {
        id: p.id,
        nama: p.nama,
        kode: `PRJ-${new Date(p.tanggalMulai).getFullYear()}-${String(p.id).padStart(3, '0')}`,
        klien: p.deskripsi || '-',
        deskripsi: p.deskripsi,
        tanggalMulai: formatDateInput(p.tanggalMulai),
        tanggalSelesai: p.tanggalSelesai ? formatDateInput(p.tanggalSelesai) : null,
        pm: pmUser?.user.nama || '',
        status: p.status,
        totalRAB: budget ? Number(budget.nilaiKontrak) : 0,
        realisasi: totalRealisasi,
        posAnggaran,
        tim,
        reimbursementDisetujui: totalRealisasi,
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