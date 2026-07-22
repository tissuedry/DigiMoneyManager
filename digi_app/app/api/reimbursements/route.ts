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

    // ponytail: cache per role+user — 6 pages call this endpoint
    const cacheKey = `reimb:${urlRole}:${userId}`;
    const cached = getCached(cacheKey);
    if (cached) return NextResponse.json(cached);

    const filter: any = {};

    if (urlRole === 'Karyawan') {
      // Employees only see their own submissions
      filter.userId = parseInt(userId, 10);
    } else if (urlRole === 'Project Manager') {
      // PMs see submissions belonging to all projects where they are assigned as Project Manager
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
    // Tim Keuangan and Direktur / Manajemen see all records (no filter)

    const reimbursements = await prisma.reimbursement.findMany({
      where: filter,
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            email: true,
            role: true,
          },
        },
        proyek: true,
        keteranganAnggaran: {
          include: {
            subAnggaran: { include: { mainAnggaran: true } },
          },
        },
        approvals: {
          include: {
            approver: {
              select: { nama: true, role: true },
            },
          },
          orderBy: { timestamp: 'desc' },
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

// POST: Submit a reimbursement (Supports both multipart/form-data and raw JSON)
export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    const role = req.headers.get('x-user-role');

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let proyekId = '';
    let keteranganAnggaranId = '';
    let nominal = 0;
    let strukUrl = '';
    let ocrData: any = {};

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      proyekId = formData.get('proyekId') as string;
      keteranganAnggaranId = (formData.get('keteranganAnggaranId') || formData.get('posAnggaranId')) as string;
      nominal = parseFloat(formData.get('nominal') as string);
      
      const ocrDataStr = formData.get('ocrData') as string;
      if (ocrDataStr) {
        try {
          ocrData = JSON.parse(ocrDataStr);
        } catch (e) {
          ocrData = { raw: ocrDataStr };
        }
      }

      // Handle file upload & WebP conversion
      const file = formData.get('file') as File | null;
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        strukUrl = await processImageToWebp(buffer);
      } else {
        const rawStrukUrl = (formData.get('strukUrl') as string) || '';
        if (rawStrukUrl) {
          strukUrl = await processImageToWebp(rawStrukUrl);
        } else {
          strukUrl = '/uploads/placeholder.png';
        }
      }
    } else {
      // Parse as standard JSON
      const body = await req.json();
      proyekId = body.proyekId;
      keteranganAnggaranId = body.keteranganAnggaranId || body.posAnggaranId;
      nominal = parseFloat(body.nominal);
      const rawStrukUrl = body.strukUrl || '';
      if (rawStrukUrl) {
        strukUrl = await processImageToWebp(rawStrukUrl);
      } else {
        strukUrl = '/uploads/placeholder.png';
      }
      ocrData = body.ocrData || {};
    }

    if (!proyekId || !keteranganAnggaranId || isNaN(nominal) || nominal <= 0) {
      return NextResponse.json({ message: 'proyekId, keteranganAnggaranId, and a positive nominal are required' }, { status: 400 });
    }

    // Stamp the actual submission timestamp (date + time), distinct from the
    // receipt's transaction date (ocrData.tanggal)
    ocrData = { ...ocrData, submittedAt: new Date().toISOString() };

    // Verify keteranganAnggaran exists and belongs to the correct project
    const ket = await prisma.keteranganAnggaran.findUnique({
      where: { id: parseInt(keteranganAnggaranId, 10) },
      include: {
        subAnggaran: { include: { mainAnggaran: { include: { budget: true } } } },
      },
    });

    if (!ket || ket.subAnggaran.mainAnggaran.budget.proyekId !== parseInt(proyekId, 10)) {
      return NextResponse.json({ message: 'Invalid KeteranganAnggaran or Proyek match' }, { status: 400 });
    }

    // Create Reimbursement record in SUBMITTED state
    const reimbursement = await prisma.reimbursement.create({
      data: {
        userId: parseInt(userId, 10),
        proyekId: parseInt(proyekId, 10),
        keteranganAnggaranId: parseInt(keteranganAnggaranId, 10),
        nominal,
        urlStruk: strukUrl,
        ocrData,
        status: 'SUBMITTED',
      },
      include: {
        user: { select: { nama: true } },
        proyek: { select: { nama: true } },
        keteranganAnggaran: {
          include: { subAnggaran: { include: { mainAnggaran: true } } },
        },
      },
    });

    // Create Audit Trail
    await prisma.auditTrail.create({
      data: {
        userId: parseInt(userId, 10),
        aksi: 'submit_reimbursement',
        detail: `Mengajukan reimbursement Rp ${nominal.toLocaleString()} untuk proyek ${reimbursement.proyek.nama}`,
      },
    });

    // Create notification for the Project Manager of the project (if any)
    const pmUsers = await prisma.user.findMany({
      where: {
        proyek: {
          some: {
            proyekId: parseInt(proyekId, 10),
            role: 'Project Manager',
          },
        },
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

    // ponytail: invalidate caches that include this new reimbursement
    const userIdInt = parseInt(userId, 10);
    clearCache(`reimb:Karyawan:${userIdInt}`);
    clearCache(`reimb:Project+Manager:`);
    clearCache('reimb:Tim Keuangan:');
    clearCache('dashboard:');
    clearCache('notif:');

    return NextResponse.json({
      message: 'Reimbursement submitted successfully',
      reimbursement: mapReimbursement(reimbursement)
    }, { status: 201 });
  } catch (error: any) {
    console.error('Submit reimbursement error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
