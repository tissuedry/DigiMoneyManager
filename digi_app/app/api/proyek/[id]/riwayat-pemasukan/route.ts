import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const proyekId = parseInt(id, 10);

    // Ambil hanya termin yang statusnya sudah DITERIMA (sudah dicairkan)
    const riwayatPencairan = await prisma.terminPembayaran.findMany({
      where: { 
        proyekId,
        status: 'DITERIMA' 
      },
      orderBy: { tanggalPencairan: 'desc' }, // Urutkan dari yang terbaru
    });

    return NextResponse.json({ success: true, data: riwayatPencairan });
  } catch (error: any) {
    console.error('Fetch riwayat pemasukan error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}