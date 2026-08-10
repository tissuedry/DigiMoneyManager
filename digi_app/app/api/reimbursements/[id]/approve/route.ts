import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearCache } from '@/lib/route-cache';

// POST: Process reimbursement/realisasi approval / rejection (PM, Keuangan, and Super Admin)
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
    const { action, catatan, alasan, noAkunDebit, noAkunKredit } = body; 

    if (!action || (action !== 'APPROVE' && action !== 'REJECT')) {
      return NextResponse.json({ message: "Action must be 'APPROVE' or 'REJECT'" }, { status: 400 });
    }

    const mapReimbursement = (r: any) => {
      if (!r) return null;

      return {
        ...r,
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
    
    const tipePengajuan = reimbursement.tipe || (reimbursement.user.role === 'Project Manager' ? 'Realisasi Anggaran' : 'Reimbursement');

    const isPM = await prisma.userProyek.findFirst({
      where: {
        userId: parseInt(userId, 10),
        proyekId: reimbursement.proyekId,
        role: 'Project Manager',
      },
    });

    const isDirektur = role === 'Direktur / Manajemen' || roles.includes('Direktur / Manajemen');
    const isKeuangan = role === 'Tim Keuangan' || roles.includes('Tim Keuangan');
    const isSuperAdmin = roles.includes('Superadmin') || roles.includes('superadmin');

    // TAHAP 1: APPROVAL PM / DIREKTUR / SUPER ADMIN
    if (isPM || isDirektur || (isSuperAdmin && reimbursement.status === 'SUBMITTED')) {
      if (reimbursement.status !== 'SUBMITTED') {
        if (!isKeuangan && !isSuperAdmin) {
          return NextResponse.json({ message: 'Pengajuan is not pending PM approval' }, { status: 400 });
        }

      } else {
        const nextStatus = action === 'APPROVE' ? 'APPROVED_BY_PM' : 'REJECTED';
        const actionText = action === 'APPROVE' ? 'menyetujui' : 'menolak';
        
        let approvalLevel = 'PM';
        if (isSuperAdmin) approvalLevel = 'SUPER ADMIN';
        else if (isDirektur) approvalLevel = 'DIREKTUR';

        const updated = await prisma.$transaction(async (tx) => {
          await tx.approval.create({
            data: {
              reimbursementId: parseInt(id, 10),
              approverId: parseInt(userId, 10),
              level: approvalLevel === 'SUPER ADMIN' ? 'SUPER_ADMIN' : approvalLevel,
              status: nextStatus,
              catatan: catatan || null,
              alasan: action === 'REJECT' ? (alasan || null) : null, 
            },
          });

          const rb = await tx.reimbursement.update({
            where: { id: parseInt(id, 10) },
            data: { status: nextStatus },
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

    // TAHAP 2: PENCAIRAN KEUANGAN / SUPER ADMIN
    if (isKeuangan || isSuperAdmin) {
      if (reimbursement.status !== 'APPROVED_BY_PM') {
        return NextResponse.json({ message: 'Pengajuan is not pending Keuangan disbursement' }, { status: 400 });
      }

      const actorKeuangan = isSuperAdmin ? 'Superadmin' : 'Tim Keuangan';

      if (action === 'APPROVE') {
        const debNum = parseInt(noAkunDebit, 10) || 50001;
        const kreNum = parseInt(noAkunKredit, 10) || 1;

        let deb = await prisma.chartOfAccounts.findFirst({ where: { nomorAkun: debNum } });
        if (!deb) {
          deb = await prisma.chartOfAccounts.upsert({
            where: { id: `COA-${debNum}` },
            update: {},
            create: {
              id: `COA-${debNum}`,
              nomorAkun: debNum,
              namaAkun: 'Beban Operasional',
              tipe: 'Beban',
              standar: 'PSAK',
            },
          });
        }

        let kre = await prisma.chartOfAccounts.findFirst({ where: { nomorAkun: kreNum } });
        if (!kre) {
          const anyAset = await prisma.chartOfAccounts.findFirst({ where: { tipe: { in: ['Aset', 'asset', 'ASET'] } } });
          if (anyAset) {
            kre = anyAset;
          } else {
            kre = await prisma.chartOfAccounts.upsert({
              where: { id: `COA-${kreNum}` },
              update: {},
              create: {
                id: `COA-${kreNum}`,
                nomorAkun: kreNum,
                namaAkun: 'Kas / Bank',
                tipe: 'Aset',
                standar: 'PSAK',
              },
            });
          }
        }

        const result = await prisma.$transaction(async (tx) => {
          const budget = await tx.budget.findUnique({
            where: { proyekId: reimbursement.proyekId },
          });

          if (budget) {
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

            if (rabTotal > 0) {
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
            }
          }

          if (reimbursement.keteranganAnggaranId && reimbursement.keteranganAnggaran) {
            await tx.keteranganAnggaran.update({
              where: { id: reimbursement.keteranganAnggaranId },
              data: {
                nominalRealisasi: Number(reimbursement.keteranganAnggaran.nominalRealisasi || 0) + nominal,
              },
            });
          }

          const journal = await tx.jurnalAkuntansi.create({
            data: {
              reimbursementId: parseInt(id, 10),
              noAkunDebit: deb.id,
              noAkunKredit: kre.id,
              nominal,
              keterangan: `Pencairan ${tipePengajuan} ${id} - ${reimbursement.user.nama} untuk ${reimbursement.keteranganAnggaran?.keterangan || 'Pengajuan'}`,
            },
          });

          await tx.approval.create({
            data: {
              reimbursementId: parseInt(id, 10),
              approverId: parseInt(userId, 10),
              level: isSuperAdmin ? 'SUPER_ADMIN' : 'KEUANGAN',
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
              detail: `${actorKeuangan} mencairkan ${tipePengajuan} Rp ${nominal.toLocaleString()} oleh ${reimbursement.user.nama}. Jurnal Debit: ${noAkunDebit}, Kredit: ${noAkunKredit}`,
            },
          });

          await tx.notification.create({
            data: {
              userId: reimbursement.userId,
              tipe: 'disbursed',
              pesan: `Pengajuan ${tipePengajuan} Anda senilai Rp ${nominal.toLocaleString()} telah DICAIRKAN oleh ${actorKeuangan}.`,
            },
          });



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
              level: isSuperAdmin ? 'SUPER_ADMIN' : 'KEUANGAN',
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
              detail: `${actorKeuangan} menolak pengajuan ${tipePengajuan} Rp ${nominal.toLocaleString()} oleh ${reimbursement.user.nama}`,
            },
          });

          await tx.notification.create({
            data: {
              userId: reimbursement.userId,
              tipe: 'rejected',
              pesan: `Pengajuan ${tipePengajuan} Anda senilai Rp ${nominal.toLocaleString()} ditolak oleh ${actorKeuangan}. Alasan: ${alasan || 'Tidak ada alasan yang diberikan.'}`, 
            },
          });

          return rb;

        });

        clearCache('dashboard:');
        clearCache('proyek:');
        clearCache('reimb:');
        clearCache('notif:');

        return NextResponse.json({ message: `Pengajuan successfully rejected by ${actorKeuangan}.`, reimbursement: mapReimbursement(updated) });
      }
    }

    return NextResponse.json({ message: 'Forbidden: Unauthorized role for approval' }, { status: 403 });
    
  } catch (error: any) {
    console.error('Approve pengajuan error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}