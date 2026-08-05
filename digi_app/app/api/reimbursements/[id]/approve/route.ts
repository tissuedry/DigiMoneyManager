import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearCache } from '@/lib/route-cache';

// POST: Process reimbursement/realisasi approval / rejection (PM and Keuangan)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get('x-user-role');
    const rolesHeader = req.headers.get('x-user-roles') || role || '';
    const roles = rolesHeader.split(',');
    const userId = req.headers.get('x-user-id');

    if (!userId || !role) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    // Ekstrak variabel `alasan` dari request body
    const { action, catatan, alasan, noAkunDebit, noAkunKredit } = body; 

    if (!action || (action !== 'APPROVE' && action !== 'REJECT')) {
      return NextResponse.json({ message: "Action must be 'APPROVE' or 'REJECT'" }, { status: 400 });
    }

    const mapReimbursement = (r: any) => {
      if (!r) return null;
      return {
        ...r, // Secara otomatis membawa field 'createdAt' dari database
        strukUrl: r.urlStruk,
        posAnggaran: r.keteranganAnggaran ? {
          ...r.keteranganAnggaran,
          deskripsi: r.keteranganAnggaran.keterangan,
          namaPos: r.keteranganAnggaran.subAnggaran?.mainAnggaran?.namaMain,
        } : null,
      };
    };

    const reimbursement = await prisma.reimbursement.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        user: { select: { nama: true, id: true, role: true } }, 
        proyek: { select: { nama: true, id: true } },
        keteranganAnggaran: {
          include: { subAnggaran: { include: { mainAnggaran: true } } },
        },
      },
    });

    if (!reimbursement) {
      return NextResponse.json({ message: 'Reimbursement not found' }, { status: 404 });
    }

    const nominal = Number(reimbursement.nominal);
    
    // Identifikasi apakah ini realisasi PM atau reimbursement staff berdasarkan kolom tipe di DB
    const tipePengajuan = reimbursement.tipe || (reimbursement.user.role === 'Project Manager' ? 'Realisasi Anggaran' : 'Reimbursement');

    const isPM = await prisma.userProyek.findFirst({
      where: {
        userId: parseInt(userId, 10),
        proyekId: reimbursement.proyekId,
        role: 'Project Manager',
      },
    });

    if (isPM || role === 'Direktur / Manajemen' || roles.includes('Direktur / Manajemen')) {
      if (reimbursement.status !== 'SUBMITTED') {
        if (role !== 'Tim Keuangan') {
          return NextResponse.json({ message: 'Pengajuan is not pending PM approval' }, { status: 400 });
        }
      } else {
        const nextStatus = action === 'APPROVE' ? 'APPROVED_BY_PM' : 'REJECTED';
        const actionText = action === 'APPROVE' ? 'menyetujui' : 'menolak';
        const approvalLevel = (role === 'Direktur / Manajemen' || roles.includes('Direktur / Manajemen')) ? 'DIREKTUR' : 'PM';

        const updated = await prisma.$transaction(async (tx) => {
          await tx.approval.create({
            data: {
              reimbursementId: parseInt(id, 10),
              approverId: parseInt(userId, 10),
              level: approvalLevel,
              status: nextStatus,
              catatan: catatan || null,
              alasan: action === 'REJECT' ? (alasan || null) : null, // Simpan alasan jika ditolak PM
            },
          });

          const rb = await tx.reimbursement.update({
            where: { id: parseInt(id, 10) },
            data: { status: nextStatus },
            // Include dikembalikan agar mapReimbursement memiliki struktur lengkap saat di output
            include: {
              user: { select: { nama: true, id: true, role: true } }, 
              proyek: { select: { nama: true, id: true } },
              keteranganAnggaran: {
                include: { subAnggaran: { include: { mainAnggaran: true } } },
              },
            }
          });

          await tx.auditTrail.create({
            data: {
              userId: parseInt(userId, 10),
              aksi: action === 'APPROVE' ? 'approve_pengajuan' : 'reject_pengajuan',
              detail: `${approvalLevel} ${actionText} pengajuan ${tipePengajuan} Rp ${nominal.toLocaleString()} oleh ${reimbursement.user.nama}`,
            },
          });

          await tx.notification.create({
            data: {
              userId: reimbursement.userId,
              tipe: 'status_update',
              pesan: `Pengajuan ${tipePengajuan} Anda senilai Rp ${nominal.toLocaleString()} telah ${action === 'APPROVE' ? `disetujui oleh ${approvalLevel}` : `ditolak oleh ${approvalLevel}`}.`,
            },
          });

          if (action === 'APPROVE') {
            const keuanganUsers = await tx.user.findMany({
              where: { role: 'Tim Keuangan' },
            });
            for (const finance of keuanganUsers) {
              await tx.notification.create({
                data: {
                  userId: finance.id,
                  tipe: 'approval_request',
                  pesan: `Pengajuan ${tipePengajuan} ${reimbursement.user.nama} (Proyek: ${reimbursement.proyek.nama}) disetujui ${approvalLevel}, menunggu pencairan Keuangan.`,
                },
              });
            }
          }

          return rb;
        });

        clearCache('dashboard:');
        clearCache('proyek:');
        clearCache('reimb:');
        clearCache('notif:');
        return NextResponse.json({ message: `Successfully processed approval: ${nextStatus}`, reimbursement: mapReimbursement(updated) });
      }
    }

    if (role === 'Tim Keuangan') {
      if (reimbursement.status !== 'APPROVED_BY_PM') {
        return NextResponse.json({ message: 'Pengajuan is not pending Keuangan disbursement' }, { status: 400 });
      }

      if (action === 'APPROVE') {
        if (!noAkunDebit || !noAkunKredit) {
          return NextResponse.json({ message: 'noAkunDebit and noAkunKredit are required for disbursement journal' }, { status: 400 });
        }

        const deb = await prisma.chartOfAccounts.findFirst({ where: { nomorAkun: parseInt(noAkunDebit, 10) } });
        const kre = await prisma.chartOfAccounts.findFirst({ where: { nomorAkun: parseInt(noAkunKredit, 10) } });

        if (!deb || !kre) {
          return NextResponse.json({ message: 'Invalid debit or credit account number' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
          const budget = await tx.budget.findUnique({
            where: { proyekId: reimbursement.proyekId },
          });

          if (!budget) {
            throw new Error(`Budget not configured for project ${reimbursement.proyek.nama}`);
          }

          const rabTotal = Number(budget.rabTotal);
          const prevSisa = Number(budget.sisaBudget);
          
          const newSisa = prevSisa - nominal;
          const newPengeluaran = Number(budget.totalPengeluaran) + nominal;
          const newReimbursementVal = Number(budget.totalReimbursement) + nominal;

          await tx.budget.update({
            where: { proyekId: reimbursement.proyekId },
            data: {
              sisaBudget: newSisa,
              totalPengeluaran: newPengeluaran,
              totalReimbursement: newReimbursementVal,
            },
          });

          await tx.keteranganAnggaran.update({
            where: { id: reimbursement.keteranganAnggaranId },
            data: {
              nominalRealisasi: Number(reimbursement.keteranganAnggaran.nominalRealisasi) + nominal,
            },
          });

          const journal = await tx.jurnalAkuntansi.create({
            data: {
              reimbursementId: parseInt(id, 10),
              noAkunDebit: deb.id,
              noAkunKredit: kre.id,
              nominal,
              keterangan: `Pencairan ${tipePengajuan} ${id} - ${reimbursement.user.nama} untuk ${reimbursement.keteranganAnggaran.keterangan}`,
            },
          });

          await tx.approval.create({
            data: {
              reimbursementId: parseInt(id, 10),
              approverId: parseInt(userId, 10),
              level: 'KEUANGAN',
              status: 'APPROVED',
              catatan: catatan || null,
            },
          });

          const rb = await tx.reimbursement.update({
            where: { id: parseInt(id, 10) },
            data: { status: 'APPROVED' },
            include: {
              user: { select: { nama: true, id: true, role: true } }, 
              proyek: { select: { nama: true, id: true } },
              keteranganAnggaran: {
                include: { subAnggaran: { include: { mainAnggaran: true } } },
              },
            }
          });

          await tx.auditTrail.create({
            data: {
              userId: parseInt(userId, 10),
              aksi: 'approve_keuangan',
              detail: `Pencairan ${tipePengajuan} Rp ${nominal.toLocaleString()} oleh ${reimbursement.user.nama}. Jurnal Debit: ${noAkunDebit}, Kredit: ${noAkunKredit}`,
            },
          });

          await tx.notification.create({
            data: {
              userId: reimbursement.userId,
              tipe: 'disbursed',
              pesan: `Pengajuan ${tipePengajuan} Anda senilai Rp ${nominal.toLocaleString()} telah DICAIRKAN oleh Tim Keuangan.`,
            },
          });

          const prevPercentage = (prevSisa / rabTotal) * 100;
          const newPercentage = (newSisa / rabTotal) * 100;
          const thresholds = [50, 25, 10, 5, 0];
          
          for (const T of thresholds) {
            if (prevPercentage > T && newPercentage <= T) {
              const alertMsg = `PERINGATAN BUDGET: Sisa budget proyek ${reimbursement.proyek.nama} telah mencapai batas/kurang dari ${T}% (Sisa: Rp ${newSisa.toLocaleString()})`;
              
              const pmUsers = await tx.user.findMany({
                where: {
                  proyek: {
                    some: {
                      proyekId: reimbursement.proyekId,
                      role: 'Project Manager',
                    },
                  },
                },
              });
              for (const pm of pmUsers) {
                await tx.notification.create({
                  data: {
                    userId: pm.id,
                    tipe: 'alert',
                    pesan: alertMsg,
                  },
                });
              }

              const keuanganUsers = await tx.user.findMany({
                where: { role: 'Tim Keuangan' },
              });
              for (const finance of keuanganUsers) {
                await tx.notification.create({
                  data: {
                    userId: finance.id,
                    tipe: 'alert',
                    pesan: alertMsg,
                  },
                });
              }
            }
          }

          return { rb, journal };
        });

        clearCache('dashboard:');
        clearCache('proyek:');
        clearCache('reimb:');
        clearCache('notif:');
        clearCache('coa');
        return NextResponse.json({
          message: 'Pengajuan successfully disbursed and journal entries generated.',
          reimbursement: mapReimbursement(result.rb),
          journal: result.journal
        });
      } else {
        const updated = await prisma.$transaction(async (tx) => {
          await tx.approval.create({
            data: {
              reimbursementId: parseInt(id, 10),
              approverId: parseInt(userId, 10),
              level: 'KEUANGAN',
              status: 'REJECTED',
              catatan: catatan || null,
              alasan: alasan || null, 
            },
          });

          const rb = await tx.reimbursement.update({
            where: { id: parseInt(id, 10) },
            data: { status: 'REJECTED' },
            include: {
              user: { select: { nama: true, id: true, role: true } }, 
              proyek: { select: { nama: true, id: true } },
              keteranganAnggaran: {
                include: { subAnggaran: { include: { mainAnggaran: true } } },
              },
            }
          });

          await tx.auditTrail.create({
            data: {
              userId: parseInt(userId, 10),
              aksi: 'reject_keuangan',
              detail: `Keuangan menolak pengajuan ${tipePengajuan} Rp ${nominal.toLocaleString()} oleh ${reimbursement.user.nama}`,
            },
          });

          await tx.notification.create({
            data: {
              userId: reimbursement.userId,
              tipe: 'rejected',
              pesan: `Pengajuan ${tipePengajuan} Anda senilai Rp ${nominal.toLocaleString()} ditolak oleh Tim Keuangan. Alasan: ${alasan || 'Tidak ada alasan yang diberikan.'}`, 
            },
          });

          return rb;
        });

        clearCache('dashboard:');
        clearCache('proyek:');
        clearCache('reimb:');
        clearCache('notif:');
        return NextResponse.json({ message: 'Pengajuan successfully rejected by Keuangan.', reimbursement: mapReimbursement(updated) });
      }
    }

    return NextResponse.json({ message: 'Forbidden: Unauthorized role for approval' }, { status: 403 });
  } catch (error: any) {
    console.error('Approve pengajuan error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}