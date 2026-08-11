import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET(request: Request) {
  try {
    // Ambil parameter tahun dari URL jika ada, jika tidak gunakan tahun saat ini
    const { searchParams } = new URL(request.url);
    const tahunParam = searchParams.get('tahun');
    const tahun = tahunParam ? parseInt(tahunParam) : new Date().getFullYear();

    // Ambil SEMUA data proyek beserta budget dan relasinya
    const proyekList = await prisma.proyek.findMany({
      include: {
        budget: {
          include: {
            mainAnggaran: {
              include: {
                subAnggaran: {
                  include: {
                    keterangan: {
                      include: {
                        reimbursements: {
                          where: {
                            status: "APPROVED",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!proyekList || proyekList.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada data proyek ditemukan." },
        { status: 404 }
      );
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Laporan Tahunan Perusahaan");

    // Pengaturan lebar kolom
    sheet.columns = [
      { key: "nama", width: 50 },
      { key: "alokasi", width: 20 },
      { key: "m1", width: 18 }, { key: "m2", width: 18 }, { key: "m3", width: 18 }, { key: "m4", width: 18 },
      { key: "m5", width: 18 }, { key: "m6", width: 18 }, { key: "m7", width: 18 }, { key: "m8", width: 18 },
      { key: "m9", width: 18 }, { key: "m10", width: 18 }, { key: "m11", width: 18 }, { key: "m12", width: 18 },
      { key: "total", width: 20 },
    ];

    // Definisi Styling
    const darkGreyFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF595959" } };
    const lightGreyFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF969696" } };
    const whiteFont = { bold: true, color: { argb: "FFFFFFFF" } };
    const blackFont = { bold: true, color: { argb: "FF000000" } };
    const titleFont = { bold: true, size: 11, color: { argb: "FF000000" } };

    // Row 1: Header Laporan Tahunan Perusahaan
    const row1 = sheet.addRow({
      nama: `Laporan Tahunan PT Metanouva Informatika Tahun ${tahun}`,
      alokasi: "ALOKASI",
      m1: "REALISASI",
    });
    row1.font = titleFont;
    sheet.mergeCells('C1:O1'); 
    sheet.getCell('B1').alignment = { horizontal: 'center' };
    sheet.getCell('C1').alignment = { horizontal: 'center' };

    // Row 2: Sub-judul Kolom Bulan
    const row2 = sheet.addRow({
      nama: "  5 BIAYA PROYEK / COST OF REVENUE",
      alokasi: "",
      m1: "JANUARI", m2: "FEBRUARI", m3: "MARET", m4: "APRIL",
      m5: "MEI", m6: "JUNI", m7: "JULI", m8: "AGUSTUS",
      m9: "SEPTEMBER", m10: "OKTOBER", m11: "NOVEMBER", m12: "DESEMBER", total: "TOTAL"
    });
    row2.font = whiteFont;
    row2.fill = darkGreyFill as ExcelJS.FillPattern;
    row2.alignment = { horizontal: 'center' };
    sheet.getCell('A2').alignment = { horizontal: 'left' };

    // --- PROSES AGREGASI SEMUA PROYEK ---
    let grandTotalAlokasi = 0;
    const grandTotalMonths = new Array(12).fill(0);
    let grandTotalRealisasi = 0;

    // Menggunakan Map untuk mengelompokkan kategori yang sama antar proyek
    const mainAnggaranMap = new Map();

    proyekList.forEach((proyek) => {
      if (!proyek.budget) return; 

      proyek.budget.mainAnggaran.forEach((main) => {
        // Normalisasi nama agar kategori yang sama mengelompok
        const mainKey = main.namaMain.trim().toUpperCase();
        
        if (!mainAnggaranMap.has(mainKey)) {
          mainAnggaranMap.set(mainKey, {
            namaOriginal: main.namaMain.trim(),
            alokasi: 0,
            months: new Array(12).fill(0),
            total: 0,
            subAnggaranMap: new Map(),
          });
        }
        
        const mainData = mainAnggaranMap.get(mainKey);
        const alokasiMain = Number(main.nominalAlokasi) || 0;
        
        mainData.alokasi += alokasiMain;
        grandTotalAlokasi += alokasiMain;

        main.subAnggaran.forEach((sub) => {
          const subKey = sub.namaSub.trim().toUpperCase();
          
          if (!mainData.subAnggaranMap.has(subKey)) {
            mainData.subAnggaranMap.set(subKey, {
              namaOriginal: sub.namaSub.trim(),
              alokasi: 0,
              months: new Array(12).fill(0),
              total: 0,
            });
          }
          
          const subData = mainData.subAnggaranMap.get(subKey);
          const alokasiSub = Number(sub.nominalAlokasi) || 0;
          subData.alokasi += alokasiSub;

          if (sub.keterangan && sub.keterangan.length > 0) {
            sub.keterangan.forEach((ket) => {
              if (ket.reimbursements && ket.reimbursements.length > 0) {
                ket.reimbursements.forEach((reimb) => {
                  
                  // PERUBAHAN DI SINI: Gunakan createdAt, bukan tanggalStruk
                  if (reimb.createdAt) {
                    const d = new Date(reimb.createdAt);
                    // Filter berdasarkan tahun createdAt
                    if (!isNaN(d.getTime()) && d.getFullYear() === tahun) {
                      const monthIndex = d.getMonth(); 
                      const nominal = Number(reimb.nominal) || 0;
                      
                      // Tambah ke akumulasi Sub Anggaran
                      subData.months[monthIndex] += nominal;
                      subData.total += nominal;

                      // Tambah ke akumulasi Main Anggaran
                      mainData.months[monthIndex] += nominal;
                      mainData.total += nominal;

                      // Tambah ke akumulasi Grand Total Perusahaan
                      grandTotalMonths[monthIndex] += nominal;
                      grandTotalRealisasi += nominal;
                    }
                  }
                  
                });
              }
            });
          }
        });
      });
    });

    // Row 3: Nilai Proyek Keseluruhan (Grand Total)
    const row3 = sheet.addRow({
      nama: "    NILAI PROYEK KESELURUHAN",
      alokasi: grandTotalAlokasi,
      m1: grandTotalMonths[0], m2: grandTotalMonths[1], m3: grandTotalMonths[2], m4: grandTotalMonths[3],
      m5: grandTotalMonths[4], m6: grandTotalMonths[5], m7: grandTotalMonths[6], m8: grandTotalMonths[7],
      m9: grandTotalMonths[8], m10: grandTotalMonths[9], m11: grandTotalMonths[10], m12: grandTotalMonths[11],
      total: grandTotalRealisasi,
    });
    row3.font = whiteFont;
    row3.fill = darkGreyFill as ExcelJS.FillPattern;

    // Convert Map kembali ke Array untuk di-render di Excel
    const mainAnggaranArray = Array.from(mainAnggaranMap.values());

    mainAnggaranArray.forEach((main: any, mIdx: number) => {
      const mainNum = `5.${mIdx + 1}`;
      
      // Baris Main Anggaran
      const mainRow = sheet.addRow({
        nama: `        ${mainNum} ${main.namaOriginal}`,
        alokasi: main.alokasi,
        m1: main.months[0], m2: main.months[1], m3: main.months[2], m4: main.months[3],
        m5: main.months[4], m6: main.months[5], m7: main.months[6], m8: main.months[7],
        m9: main.months[8], m10: main.months[9], m11: main.months[10], m12: main.months[11],
        total: main.total,
      });
      mainRow.font = whiteFont;
      mainRow.fill = lightGreyFill as ExcelJS.FillPattern;

      const subAnggaranArray = Array.from(main.subAnggaranMap.values());
      
      // Baris Sub Anggaran
      subAnggaranArray.forEach((sub: any, sIdx: number) => {
        const subNum = `${mainNum}.${String(sIdx + 1).padStart(2, '0')}`;
        
        const subRow = sheet.addRow({
          nama: `            ${subNum} ${sub.namaOriginal}`,
          alokasi: sub.alokasi,
          m1: sub.months[0], m2: sub.months[1], m3: sub.months[2], m4: sub.months[3],
          m5: sub.months[4], m6: sub.months[5], m7: sub.months[6], m8: sub.months[7],
          m9: sub.months[8], m10: sub.months[9], m11: sub.months[10], m12: sub.months[11],
          total: sub.total,
        });
        subRow.font = blackFont;
      });

      // Spasi per main anggaran agar rapi
      sheet.addRow({}); 
    });

    // Format Accounting Rupiah di Excel
    for (let i = 2; i <= 15; i++) {
      sheet.getColumn(i).numFmt = '_-* #,##0_-;-* #,##0_-;_-* "-"_-;_-@_-';
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="Laporan_Tahunan_Perusahaan_${tahun}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });

  } catch (error) {
    console.error("Excel generation error:", error);
    
    return NextResponse.json(
      { error: "Gagal membuat laporan tahunan perusahaan" },
      { status: 500 }
    );
  }
}