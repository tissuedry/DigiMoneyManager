import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tahunParam = searchParams.get('tahun');
    const tahun = tahunParam ? parseInt(tahunParam) : new Date().getFullYear();

    const proyekList = await prisma.proyek.findMany({
      include: {
        terminPembayaran: true,
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
    
    // --- STYLING BERSAMA ---
    const darkGreyFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF595959" } } as ExcelJS.FillPattern;
    const lightGreyFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF969696" } } as ExcelJS.FillPattern;
    const whiteFont = { bold: true, color: { argb: "FFFFFFFF" } };
    const blackFont = { bold: true, color: { argb: "FF000000" } };
    const titleFont = { bold: true, size: 11, color: { argb: "FF000000" } };

    // Pemasukkan
    const sheetPem = workbook.addWorksheet("Pemasukan");

    sheetPem.columns = [
      { key: "nama", width: 50 },
      { key: "m1", width: 18 }, { key: "m2", width: 18 }, { key: "m3", width: 18 }, { key: "m4", width: 18 },
      { key: "m5", width: 18 }, { key: "m6", width: 18 }, { key: "m7", width: 18 }, { key: "m8", width: 18 },
      { key: "m9", width: 18 }, { key: "m10", width: 18 }, { key: "m11", width: 18 }, { key: "m12", width: 18 },
      { key: "total", width: 20 },
    ];

    const row1Pem = sheetPem.addRow({
      nama: `Laporan Pemasukan Tahunan PT Metanouva Informatika Tahun ${tahun}`,
      m1: "REALISASI",
    });
    row1Pem.font = titleFont;
    sheetPem.mergeCells('B1:N1'); 
    sheetPem.getCell('B1').alignment = { horizontal: 'center' };

    const row2Pem = sheetPem.addRow({
      nama: "  4 PENDAPATAN PROYEK / OPERATING REVENUE",
      m1: "JANUARI", m2: "FEBRUARI", m3: "MARET", m4: "APRIL", m5: "MEI", m6: "JUNI", 
      m7: "JULI", m8: "AGUSTUS", m9: "SEPTEMBER", m10: "OKTOBER", m11: "NOVEMBER", m12: "DESEMBER", total: "TOTAL"
    });
    row2Pem.font = whiteFont; row2Pem.fill = darkGreyFill; row2Pem.alignment = { horizontal: 'center' };
    sheetPem.getCell('A2').alignment = { horizontal: 'left' };

    const grandTotalMonthsPem = new Array(12).fill(0);
    let grandTotalRealisasiPem = 0;

    const mainPemMap = new Map();
    const terminFallbackMonths = new Array(12).fill(0);
    let terminFallbackRealisasi = 0;
    let useTerminFallback = false;

    // --- AGREGASI DATA PEMASUKAN ---
    proyekList.forEach((proyek) => {
      const pemasukanMains = proyek.budget?.mainAnggaran.filter(m => m.tipe === "pemasukan") || [];

      if (pemasukanMains.length > 0) {
        pemasukanMains.forEach((main) => {
          const mainKey = main.namaMain.trim().toUpperCase();
          
          if (!mainPemMap.has(mainKey)) {
            mainPemMap.set(mainKey, { namaOriginal: main.namaMain.trim(), months: new Array(12).fill(0), total: 0, subAnggaranMap: new Map() });
          }
          const mainData = mainPemMap.get(mainKey);
          
          main.subAnggaran.forEach((sub) => {
            const subKey = sub.namaSub.trim().toUpperCase();
            if (!mainData.subAnggaranMap.has(subKey)) {
              mainData.subAnggaranMap.set(subKey, { namaOriginal: sub.namaSub.trim(), months: new Array(12).fill(0), total: 0 });
            }
            const subData = mainData.subAnggaranMap.get(subKey);

            if (sub.keterangan && sub.keterangan.length > 0) {
              sub.keterangan.forEach((ket) => {
                if (ket.reimbursements && ket.reimbursements.length > 0) {
                  ket.reimbursements.forEach((reimb) => {
                    if (reimb.createdAt) {
                      const d = new Date(reimb.createdAt);

                      if (!isNaN(d.getTime()) && d.getFullYear() === tahun) {
                        const mIdx = d.getMonth();
                        const nominal = Number(reimb.nominal) || 0;
                        
                        subData.months[mIdx] += nominal;
                        subData.total += nominal;
                        mainData.months[mIdx] += nominal;
                        mainData.total += nominal;
                        
                        grandTotalMonthsPem[mIdx] += nominal;
                        grandTotalRealisasiPem += nominal;
                      }
                    }
                  });
                }
              });
            }
          });
        });
      } else if (proyek.terminPembayaran && proyek.terminPembayaran.length > 0) {

        useTerminFallback = true;
        
        proyek.terminPembayaran.forEach((termin) => {
          const nominal = Number(termin.nominal) || 0;

          const d = termin.tanggalPencairan ? new Date(termin.tanggalPencairan) : new Date(termin.createdAt);

          if (d.getFullYear() === tahun) {
            const mIdx = d.getMonth(); 
            terminFallbackMonths[mIdx] += nominal;
            terminFallbackRealisasi += nominal;
            
            grandTotalMonthsPem[mIdx] += nominal;
            grandTotalRealisasiPem += nominal;
          }
        });
      }
    });

    const row3Pem = sheetPem.addRow({
      nama: "    NILAI PROYEK KESELURUHAN",
      m1: grandTotalMonthsPem[0], m2: grandTotalMonthsPem[1], m3: grandTotalMonthsPem[2], m4: grandTotalMonthsPem[3],
      m5: grandTotalMonthsPem[4], m6: grandTotalMonthsPem[5], m7: grandTotalMonthsPem[6], m8: grandTotalMonthsPem[7],
      m9: grandTotalMonthsPem[8], m10: grandTotalMonthsPem[9], m11: grandTotalMonthsPem[10], m12: grandTotalMonthsPem[11],
      total: grandTotalRealisasiPem,
    });
    row3Pem.font = whiteFont; row3Pem.fill = darkGreyFill;

    let pemCounter = 1;
    const mainPemArray = Array.from(mainPemMap.values());
    
    mainPemArray.forEach((main: any) => {
      const mainNum = `4.${pemCounter++}`;
      const mainRow = sheetPem.addRow({
        nama: `        ${mainNum} ${main.namaOriginal.toUpperCase()}`,
        m1: main.months[0], m2: main.months[1], m3: main.months[2], m4: main.months[3], m5: main.months[4], m6: main.months[5],
        m7: main.months[6], m8: main.months[7], m9: main.months[8], m10: main.months[9], m11: main.months[10], m12: main.months[11], total: main.total,
      });
      mainRow.font = whiteFont; mainRow.fill = lightGreyFill;

      const subPemArray = Array.from(main.subAnggaranMap.values());
      subPemArray.forEach((sub: any, sIdx: number) => {
        const subRow = sheetPem.addRow({
          nama: `            ${mainNum}.${String(sIdx + 1).padStart(2, '0')} ${sub.namaOriginal}`,
          m1: sub.months[0], m2: sub.months[1], m3: sub.months[2], m4: sub.months[3], m5: sub.months[4], m6: sub.months[5],
          m7: sub.months[6], m8: sub.months[7], m9: sub.months[8], m10: sub.months[9], m11: sub.months[10], m12: sub.months[11], total: sub.total,
        });
        subRow.font = blackFont;
      });
      sheetPem.addRow({});
    });

    if (useTerminFallback) {
      const mainNum = `4.${pemCounter}`;
      const mainRow = sheetPem.addRow({
        nama: `        ${mainNum} PENDAPATAN TERMIN PEMBAYARAN`,
        m1: terminFallbackMonths[0], m2: terminFallbackMonths[1], m3: terminFallbackMonths[2], m4: terminFallbackMonths[3],
        m5: terminFallbackMonths[4], m6: terminFallbackMonths[5], m7: terminFallbackMonths[6], m8: terminFallbackMonths[7],
        m9: terminFallbackMonths[8], m10: terminFallbackMonths[9], m11: terminFallbackMonths[10], m12: terminFallbackMonths[11],
        total: terminFallbackRealisasi,
      });
      mainRow.font = whiteFont; mainRow.fill = lightGreyFill;

      const subRow = sheetPem.addRow({
        nama: `            ${mainNum}.01 Termin Proyek / Pencairan`,
        m1: terminFallbackMonths[0], m2: terminFallbackMonths[1], m3: terminFallbackMonths[2], m4: terminFallbackMonths[3],
        m5: terminFallbackMonths[4], m6: terminFallbackMonths[5], m7: terminFallbackMonths[6], m8: terminFallbackMonths[7],
        m9: terminFallbackMonths[8], m10: terminFallbackMonths[9], m11: terminFallbackMonths[10], m12: terminFallbackMonths[11],
        total: terminFallbackRealisasi,
      });
      subRow.font = blackFont;
      sheetPem.addRow({});
    }

    for (let i = 2; i <= 14; i++) sheetPem.getColumn(i).numFmt = '_-"Rp"* #,##0_-;-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-';

    // Pengeluaran
    const sheetPeng = workbook.addWorksheet("Pengeluaran");

    sheetPeng.columns = [
      { key: "nama", width: 50 }, { key: "alokasi", width: 20 },
      { key: "m1", width: 18 }, { key: "m2", width: 18 }, { key: "m3", width: 18 }, { key: "m4", width: 18 },
      { key: "m5", width: 18 }, { key: "m6", width: 18 }, { key: "m7", width: 18 }, { key: "m8", width: 18 },
      { key: "m9", width: 18 }, { key: "m10", width: 18 }, { key: "m11", width: 18 }, { key: "m12", width: 18 },
      { key: "total", width: 20 },
    ];

    const row1Peng = sheetPeng.addRow({
      nama: `Laporan Pengeluaran Tahunan PT Metanouva Informatika Tahun ${tahun}`, alokasi: "ALOKASI", m1: "REALISASI",
    });
    row1Peng.font = titleFont;
    sheetPeng.mergeCells('C1:O1'); 
    sheetPeng.getCell('B1').alignment = { horizontal: 'center' };
    sheetPeng.getCell('C1').alignment = { horizontal: 'center' };

    const row2Peng = sheetPeng.addRow({
      nama: "  5 BIAYA PROYEK / COST OF REVENUE", alokasi: "",
      m1: "JANUARI", m2: "FEBRUARI", m3: "MARET", m4: "APRIL", m5: "MEI", m6: "JUNI", 
      m7: "JULI", m8: "AGUSTUS", m9: "SEPTEMBER", m10: "OKTOBER", m11: "NOVEMBER", m12: "DESEMBER", total: "TOTAL"
    });
    row2Peng.font = whiteFont; row2Peng.fill = darkGreyFill; row2Peng.alignment = { horizontal: 'center' };
    sheetPeng.getCell('A2').alignment = { horizontal: 'left' };

    let grandTotalAlokasiPeng = 0;
    const grandTotalMonthsPeng = new Array(12).fill(0);
    let grandTotalRealisasiPeng = 0;

    const mainPengMap = new Map();

    proyekList.forEach((proyek) => {
      if (!proyek.budget) return; 

      const pengeluaranMains = proyek.budget.mainAnggaran.filter(m => m.tipe === "pengeluaran" || !m.tipe);

      pengeluaranMains.forEach((main) => {
        const mainKey = main.namaMain.trim().toUpperCase();
        
        if (!mainPengMap.has(mainKey)) {
          mainPengMap.set(mainKey, {
            namaOriginal: main.namaMain.trim(), alokasi: 0, months: new Array(12).fill(0), total: 0, subAnggaranMap: new Map(),
          });
        }
        
        const mainData = mainPengMap.get(mainKey);
        const alokasiMain = Number(main.nominalAlokasi) || 0;
        
        mainData.alokasi += alokasiMain;
        grandTotalAlokasiPeng += alokasiMain;

        main.subAnggaran.forEach((sub) => {
          const subKey = sub.namaSub.trim().toUpperCase();
          if (!mainData.subAnggaranMap.has(subKey)) {
            mainData.subAnggaranMap.set(subKey, { namaOriginal: sub.namaSub.trim(), alokasi: 0, months: new Array(12).fill(0), total: 0 });
          }
          
          const subData = mainData.subAnggaranMap.get(subKey);
          subData.alokasi += Number(sub.nominalAlokasi) || 0;

          if (sub.keterangan && sub.keterangan.length > 0) {
            sub.keterangan.forEach((ket) => {
              if (ket.reimbursements && ket.reimbursements.length > 0) {
                ket.reimbursements.forEach((reimb) => {
                  if (reimb.createdAt) {
                    const d = new Date(reimb.createdAt);
                    if (!isNaN(d.getTime()) && d.getFullYear() === tahun) {
                      const monthIndex = d.getMonth(); 
                      const nominal = Number(reimb.nominal) || 0;
                      
                      subData.months[monthIndex] += nominal;
                      subData.total += nominal;
                      mainData.months[monthIndex] += nominal;
                      mainData.total += nominal;
                      
                      grandTotalMonthsPeng[monthIndex] += nominal;
                      grandTotalRealisasiPeng += nominal;
                    }
                  }
                });
              }
            });
          }
        });
      });
    });

    const row3Peng = sheetPeng.addRow({
      nama: "    NILAI PROYEK KESELURUHAN", alokasi: grandTotalAlokasiPeng,
      m1: grandTotalMonthsPeng[0], m2: grandTotalMonthsPeng[1], m3: grandTotalMonthsPeng[2], m4: grandTotalMonthsPeng[3],
      m5: grandTotalMonthsPeng[4], m6: grandTotalMonthsPeng[5], m7: grandTotalMonthsPeng[6], m8: grandTotalMonthsPeng[7],
      m9: grandTotalMonthsPeng[8], m10: grandTotalMonthsPeng[9], m11: grandTotalMonthsPeng[10], m12: grandTotalMonthsPeng[11],
      total: grandTotalRealisasiPeng,
    });
    row3Peng.font = whiteFont; row3Peng.fill = darkGreyFill;

    const mainPengArray = Array.from(mainPengMap.values());

    mainPengArray.forEach((main: any, mIdx: number) => {
      const mainNum = `5.${mIdx + 1}`;
      const mainRow = sheetPeng.addRow({
        nama: `        ${mainNum} ${main.namaOriginal.toUpperCase()}`, alokasi: main.alokasi,
        m1: main.months[0], m2: main.months[1], m3: main.months[2], m4: main.months[3], m5: main.months[4], m6: main.months[5],
        m7: main.months[6], m8: main.months[7], m9: main.months[8], m10: main.months[9], m11: main.months[10], m12: main.months[11], total: main.total,
      });
      mainRow.font = whiteFont; mainRow.fill = lightGreyFill;

      const subPengArray = Array.from(main.subAnggaranMap.values());
      subPengArray.forEach((sub: any, sIdx: number) => {
        const subNum = `${mainNum}.${String(sIdx + 1).padStart(2, '0')}`;
        const subRow = sheetPeng.addRow({
          nama: `            ${subNum} ${sub.namaOriginal}`, alokasi: sub.alokasi,
          m1: sub.months[0], m2: sub.months[1], m3: sub.months[2], m4: sub.months[3], m5: sub.months[4], m6: sub.months[5],
          m7: sub.months[6], m8: sub.months[7], m9: sub.months[8], m10: sub.months[9], m11: sub.months[10], m12: sub.months[11], total: sub.total,
        });
        subRow.font = blackFont;
      });
      sheetPeng.addRow({}); 
    });

    for (let i = 2; i <= 15; i++) sheetPeng.getColumn(i).numFmt = '_-"Rp"* #,##0_-;-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-';

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