import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; 

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mainId = searchParams.get("mainId");
    const subId = searchParams.get("subId");

    if (subId) {
      const keterangan = await prisma.masterKeterangan.findMany({
        where: { subId: parseInt(subId) },
        orderBy: { id: 'asc' }
      });
      return NextResponse.json(keterangan);
    }

    if (mainId) {
      const sub = await prisma.masterSub.findMany({
        where: { mainId: parseInt(mainId) },
        orderBy: { id: 'asc' }
      });
      return NextResponse.json(sub);
    }

    const main = await prisma.masterMain.findMany({
      orderBy: { id: 'asc' }
    });
    
    return NextResponse.json(main);

  } catch (error) {
    console.error("Error fetching master data:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data master anggaran" },
      { status: 500 }
    );
  }
}