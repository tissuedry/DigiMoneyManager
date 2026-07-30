import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCached, setCache, clearCache } from '@/lib/route-cache';
import sharp from 'sharp';

// Helper to convert image buffer or base64 data URL to WebP format using sharp
async function processImageToWebp(input: Buffer | string): Promise<string> {
  let buffer: Buffer;

  if (typeof input === 'string') {
    if (input.startsWith('data:image/')) {
      const parts = input.split(',');
      if (parts[1]) {
        buffer = Buffer.from(parts[1], 'base64');
      } else {
        return input;
      }
    } else {
      return input;
    }
  } else {
    buffer = input;
  }

  try {
    const webpBuffer = await sharp(buffer)
      .resize({
        width: 1920,
        height: 1920,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();

    return `data:image/webp;base64,${webpBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Failed to convert image to WebP with sharp:', error);
    if (Buffer.isBuffer(input)) {
      return `data:image/jpeg;base64,${input.toString('base64')}`;
    }
    return input;
  }
}

// Helper to map DB fields to client fields
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

// GET: Fetch reimbursement lists based on user role
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    const role = req.headers.get('x-user-role');
    const userProyekId = req.headers.get('x-user-proyek-id');

    if (!userId || !role) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const urlRole = searchParams.get('role') || role;

    const cacheKey = `reimb:${urlRole}:${userId}:${userProyekId || ''}`;
    const cached = getCached(cacheKey);
    if (cached) return NextResponse.json(cached);

    const filter: any = {};

    if (urlRole === 'Karyawan') {
      filter.userId = parseInt(userId, 10);
      if (userProyekId) {
        filter.proyekId = parseInt(userProyekId, 10);
      }
    } else if (urlRole === 'Project Manager') {
      const pmProyeks = await prisma.userProyek.findMany({
        where: { 
          userId: parseInt(userId, 10),
          role: 'Project Manager'
        },
        select: { proyekId: true },
      });
      const projectIds = pmProyeks.map((up) => up.proyekId);
      if (projectIds.length > 0) {
        filter.proyekId = { in: projectIds };
      } else {
        return NextResponse.json({ reimbursements: [] });
      }
    }

    const reimbursements = await prisma.reimbursement.findMany({
      where: filter,
      include: {
        user: { select: { id: true, nama: true, email: true, role: true } },
        proyek: true,
        keteranganAnggaran: {
          include: { subAnggaran: { include: { mainAnggaran: true } } },
        },
        approvals: {
          select: {
            id: true,
            level: true,
            status: true,
            catatan: true,
            alasan: true, 
            timestamp: true,
            approver: { select: { nama: true, role: true } }
          },
          orderBy: { timestamp: 'desc' },
        },
        jurnalAkuntansi: {
          include: { akunDebit: true, akunKredit: true },
        },
      },
      orderBy: { id: 'desc' },
    });

    const mapped = reimbursements.map(mapReimbursement);
    setCache(cacheKey, { reimbursements: mapped });
    return NextResponse.json({ reimbursements: mapped });
  } catch (error: any) {
    console.error('Fetch reimbursements error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// POST: Submit a reimbursement / realisasi (Supports both multipart/form-data and raw JSON)
export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    const role = req.headers.get('x-user-role');

    if (!userId || !role) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let proyekId = '';
    let keteranganAnggaranId = '';
    let nominal = 0;
    let strukUrl = '';
    let ocrData: any = {};
    
    // Variabel penampung hasil ekstrak
    let nama = '';
    let merchant = '';
    let tanggalStruk: Date | null = null;
    let kategoriBukti = '';
    let createdAt: Date | undefined = undefined; // Tambahan penampung createdAt

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      proyekId = formData.get('proyekId') as string;
      keteranganAnggaranId = (formData.get('keteranganAnggaranId') || formData.get('posAnggaranId')) as string;
      nominal = parseFloat(formData.get('nominal') as string);
      
      nama = (formData.get('nama') || formData.get('namaRealisasi')) as string || '';
      merchant = (formData.get('merchant') as string) || '';
      const rawTgl = formData.get('tanggalStruk') || formData.get('tanggal');
      if (rawTgl) tanggalStruk = new Date(rawTgl as string);
      kategoriBukti = (formData.get('kategoriBukti') as string) || '';

      // Ekstrak createdAt jika dikirim dari frontend
      const rawCreatedAt = formData.get('createdAt') || formData.get('submittedAt');
      if (rawCreatedAt) createdAt = new Date(rawCreatedAt as string);

      const ocrDataStr = formData.get('ocrData') as string;
      if (ocrDataStr) {
        try {
          ocrData = JSON.parse(ocrDataStr);
        } catch (e) {
          ocrData = { raw: ocrDataStr };
        }
      }

      const file = formData.get('file') as File | null;
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        strukUrl = await processImageToWebp(buffer);
      } else {
        const rawStrukUrl = (formData.get('strukUrl') as string) || '';
        strukUrl = rawStrukUrl ? await processImageToWebp(rawStrukUrl) : '/uploads/placeholder.png';
      }
    } else {
      const body = await req.json();
      proyekId = body.proyekId;
      keteranganAnggaranId = body.keteranganAnggaranId || body.posAnggaranId;
      nominal = parseFloat(body.nominal);
      
      nama = body.nama || body.namaRealisasi || '';
      merchant = body.merchant || '';
      if (body.tanggalStruk || body.tanggal) {
        tanggalStruk = new Date(body.tanggalStruk || body.tanggal);
      }
      kategoriBukti = body.kategoriBukti || '';

      // Ekstrak createdAt jika dikirim dari frontend
      if (body.createdAt || body.submittedAt) {
        createdAt = new Date(body.createdAt || body.submittedAt);
      }

      const rawStrukUrl = body.strukUrl || '';
      strukUrl = rawStrukUrl ? await processImageToWebp(rawStrukUrl) : '/uploads/placeholder.png';
      ocrData = body.ocrData || {};
    }

    if (!merchant && ocrData.merchant) merchant = ocrData.merchant;
    if (!kategoriBukti && ocrData.kategoriBukti) kategoriBukti = ocrData.kategoriBukti;
    if (!tanggalStruk && ocrData.tanggal) tanggalStruk = new Date(ocrData.tanggal);
    if (!nama && ocrData.keterangan) nama = ocrData.keterangan;
    
    // Set fallback createdAt dari ocrData jika ada
    if (!createdAt && ocrData.submittedAt) createdAt = new Date(ocrData.submittedAt);

    if (!proyekId || !keteranganAnggaranId || isNaN(nominal) || nominal <= 0) {
      return NextResponse.json({ message: 'proyekId, keteranganAnggaranId, and a positive nominal are required' }, { status: 400 });
    }

    const ket = await prisma.keteranganAnggaran.findUnique({
      where: { id: parseInt(keteranganAnggaranId, 10) },
      include: {
        subAnggaran: { include: { mainAnggaran: { include: { budget: true } } } },
      },
    });

    if (!ket || ket.subAnggaran.mainAnggaran.budget.proyekId !== parseInt(proyekId, 10)) {
      return NextResponse.json({ message: 'Invalid KeteranganAnggaran or Proyek match' }, { status: 400 });
    }

    // --- LOGIKA BYPASS UNTUK PM & PENENTUAN TIPE ---
    const isPM = role === 'Project Manager';
    const initialStatus = isPM ? 'APPROVED_BY_PM' : 'SUBMITTED';
    const tipePengajuan = isPM ? 'Realisasi Anggaran' : 'Reimbursement';
    // -----------------------------------------------

    const reimbursement = await prisma.reimbursement.create({
      data: {
        userId: parseInt(userId, 10),
        proyekId: parseInt(proyekId, 10),
        keteranganAnggaranId: parseInt(keteranganAnggaranId, 10),
        nominal,
        urlStruk: strukUrl,
        status: initialStatus,
        
        // Atribut tersendiri sesuai skema prisma
        nama: nama || null,
        tipe: tipePengajuan,
        merchant: merchant || null,
        tanggalStruk: (tanggalStruk && !isNaN(tanggalStruk.getTime())) ? tanggalStruk : null,
        kategoriBukti: kategoriBukti || null,
        
        // Simpan createdAt jika ada nilai yang valid dikirimkan
        ...(createdAt && !isNaN(createdAt.getTime()) && { createdAt }),
      },
      include: {
        user: { select: { nama: true } },
        proyek: { select: { nama: true } },
        keteranganAnggaran: {
          include: { subAnggaran: { include: { mainAnggaran: true } } },
        },
      },
    });

    await prisma.auditTrail.create({
      data: {
        userId: parseInt(userId, 10),
        aksi: 'submit_pengajuan',
        detail: `Mengajukan ${tipePengajuan} Rp ${nominal.toLocaleString()} untuk proyek ${reimbursement.proyek.nama}`,
      },
    });

    // --- LOGIKA NOTIFIKASI & APPROVAL OTOMATIS ---
    if (initialStatus === 'SUBMITTED') {
      const pmUsers = await prisma.user.findMany({
        where: {
          proyek: { some: { proyekId: parseInt(proyekId, 10), role: 'Project Manager' } },
        },
      });

      for (const pm of pmUsers) {
        await prisma.notification.create({
          data: {
            userId: pm.id,
            tipe: 'approval_request',
            pesan: `Pengajuan reimbursement baru dari ${reimbursement.user.nama} senilai Rp ${nominal.toLocaleString()} menunggu validasi Anda.`,
          },
        });
      }
    } else {
      await prisma.approval.create({
        data: {
          reimbursementId: reimbursement.id,
          approverId: parseInt(userId, 10),
          level: 'PM',
          status: 'APPROVED_BY_PM',
          catatan: 'Auto-approved (Pengajuan langsung oleh Project Manager)',
        },
      });

      const keuanganUsers = await prisma.user.findMany({
        where: { role: 'Tim Keuangan' },
      });

      for (const finance of keuanganUsers) {
        await prisma.notification.create({
          data: {
            userId: finance.id,
            tipe: 'approval_request',
            pesan: `Pengajuan Realisasi baru dari PM ${reimbursement.user.nama} (Proyek: ${reimbursement.proyek.nama}) menunggu pencairan Keuangan.`,
          },
        });
      }
    }
    // ---------------------------------------------

    const userIdInt = parseInt(userId, 10);
    clearCache(`reimb:Karyawan:${userIdInt}`);
    clearCache(`reimb:Project+Manager:`);
    clearCache('reimb:Tim Keuangan:');
    clearCache('dashboard:');
    clearCache('notif:');

    return NextResponse.json({
      message: `${tipePengajuan} submitted successfully`,
      reimbursement: mapReimbursement(reimbursement)
    }, { status: 201 });
  } catch (error: any) {
    console.error('Submit pengajuan error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}