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

    const FONT_FAMILY = "Trebuchet MS";
    const FONT_SIZE = 11;

    const fillDark: ExcelJS.FillPattern = { type: "pattern", pattern: "solid", fgColor: { argb: "FF404040" } };
    const fillMain: ExcelJS.FillPattern = { type: "pattern", pattern: "solid", fgColor: { argb: "FF808080" } };
    const fillSub: ExcelJS.FillPattern = { type: "pattern", pattern: "solid", fgColor: { argb: "FFBFBFBF" } }; // Baris Sub (level 2)

    const fontWhite = { name: FONT_FAMILY, size: FONT_SIZE, bold: true, color: { argb: "FFFFFFFF" } };
    const fontBlack = { name: FONT_FAMILY, size: FONT_SIZE, bold: true, color: { argb: "FF000000" } };

    const hairBorder: Partial<ExcelJS.Borders> = {
      top: { style: "hair", color: { argb: "FF000000" } },
      bottom: { style: "hair", color: { argb: "FF000000" } },
      left: { style: "hair", color: { argb: "FF000000" } },
      right: { style: "hair", color: { argb: "FF000000" } },
    };

    const RP_FORMAT = '_-"Rp"* #,##0_-;-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-';
    const TEXT_FORMAT = "@";

    function styleFullRow(
      row: ExcelJS.Row,
      lastCol: number,
      fill: ExcelJS.FillPattern,
      font: Partial<ExcelJS.Font>,
      height = 15
    ) {
      row.height = height;
      for (let c = 1; c <= lastCol; c++) {
        const cell = row.getCell(c);
        cell.fill = fill;
        cell.font = font as ExcelJS.Font;
        cell.border = hairBorder;
        if (!cell.alignment) cell.alignment = { vertical: "middle" };
      }
    }

    const sheetPem = workbook.addWorksheet("Pemasukan");
    const LAST_COL_PEM = 17; // A..Q

    sheetPem.columns = [
      { key: "num", width: 6.1640625 },     // A
      { key: "kode", width: 6.1640625 },    // B
      { key: "sub", width: 8.5 },           // C
      { key: "nama", width: 50.83203125 },  // D
      { key: "m1", width: 20.83203125 }, { key: "m2", width: 20.83203125 }, { key: "m3", width: 20.83203125 },
      { key: "m4", width: 20.83203125 }, { key: "m5", width: 20.83203125 }, { key: "m6", width: 20.83203125 },
      { key: "m7", width: 20.83203125 }, { key: "m8", width: 20.83203125 }, { key: "m9", width: 20.83203125 },
      { key: "m10", width: 20.83203125 }, { key: "m11", width: 20.83203125 }, { key: "m12", width: 20.83203125 },
      { key: "total", width: 20.83203125 }, // Q
    ];

    const row1Pem = sheetPem.addRow({ kode: `Laporan Pemasukan Tahunan PT Metanouva Informatika Tahun ${tahun}` });
    styleFullRow(row1Pem, LAST_COL_PEM, fillDark, fontWhite);
    row1Pem.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
    const row2Pem = sheetPem.addRow({
      kode: "Bulan",
      m1: "JANUARI", m2: "FEBRUARI", m3: "MARET", m4: "APRIL", m5: "MEI", m6: "JUNI",
      m7: "JULI", m8: "AGUSTUS", m9: "SEPTEMBER", m10: "OKTOBER", m11: "NOVEMBER", m12: "DESEMBER",
      total: "TOTAL",
    });
    styleFullRow(row2Pem, LAST_COL_PEM, fillDark, fontWhite);
    row2Pem.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
    for (let c = 5; c <= LAST_COL_PEM; c++) row2Pem.getCell(c).alignment = { horizontal: "center", vertical: "middle" };

    const row3Pem = sheetPem.addRow({ num: 4, kode: "PENDAPATAN PROYEK / OPERATING REVENUE", m1: "REALISASI" });
    styleFullRow(row3Pem, LAST_COL_PEM, fillDark, fontWhite);
    row3Pem.getCell(1).alignment = { horizontal: "right", vertical: "middle" };
    row3Pem.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
    sheetPem.mergeCells(3, 5, 3, LAST_COL_PEM); // E3:Q3
    row3Pem.getCell(5).alignment = { horizontal: "center", vertical: "middle" };

    const grandTotalMonthsPem = new Array(12).fill(0);
    let grandTotalRealisasiPem = 0;

    const mainPemMap = new Map();

    proyekList.forEach((proyek) => {
      const pemasukanMains = proyek.budget?.mainAnggaran.filter(m => m.tipe === "pemasukan") || [];
      const hasPemasukan = pemasukanMains.length > 0;
      if (hasPemasukan) {
        pemasukanMains.forEach((main) => {
          const mainKey = main.namaMain.trim().toUpperCase();

          if (!mainPemMap.has(mainKey)) {
            mainPemMap.set(mainKey, {
              namaOriginal: main.namaMain.trim(),
              months: new Array(12).fill(0),
              total: 0,
              subAnggaranMap: new Map()
            });
          }
          const mainData = mainPemMap.get(mainKey);

          main.subAnggaran.forEach((sub) => {
            const subKey = sub.namaSub.trim().toUpperCase();
            if (!mainData.subAnggaranMap.has(subKey)) {
              mainData.subAnggaranMap.set(subKey, {
                namaOriginal: sub.namaSub.trim(),
                months: new Array(12).fill(0),
                total: 0
              });
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
      }

      if (proyek.terminPembayaran && proyek.terminPembayaran.length > 0) {
        proyek.terminPembayaran.forEach((termin) => {
          const nominal = Number(termin.nominal) || 0;
          const d = termin.tanggalPencairan ? new Date(termin.tanggalPencairan) : new Date(termin.createdAt);

          if (d.getFullYear() === tahun) {
            const mIdx = d.getMonth();

            const mainKey = "PENJUALAN JASA";
            if (!mainPemMap.has(mainKey)) {
              mainPemMap.set(mainKey, {
                namaOriginal: "Penjualan Jasa",
                months: new Array(12).fill(0),
                total: 0,
                subAnggaranMap: new Map()
              });
            }
            const mainData = mainPemMap.get(mainKey);

            const targetSubKey = "PENJUALAN JASA";
            if (!mainData.subAnggaranMap.has(targetSubKey)) {
              mainData.subAnggaranMap.set(targetSubKey, {
                namaOriginal: "Penjualan Jasa",
                months: new Array(12).fill(0),
                total: 0
              });
            }
            const subData = mainData.subAnggaranMap.get(targetSubKey);

            subData.months[mIdx] += nominal;
            subData.total += nominal;
            mainData.months[mIdx] += nominal;
            mainData.total += nominal;

            grandTotalMonthsPem[mIdx] += nominal;
            grandTotalRealisasiPem += nominal;
          }
        });
      }
    });

    let pemCounter = 1;
    let currentRowPem = 4; 
    const mainPemArray = Array.from(mainPemMap.values());

    mainPemArray.forEach((main: any) => {
      const mainNum = `4.${pemCounter++}`;
      const mainRow = sheetPem.addRow({
        kode: mainNum,
        sub: main.namaOriginal.toUpperCase(),
        m1: main.months[0], m2: main.months[1], m3: main.months[2], m4: main.months[3], m5: main.months[4], m6: main.months[5],
        m7: main.months[6], m8: main.months[7], m9: main.months[8], m10: main.months[9], m11: main.months[10], m12: main.months[11], total: main.total,
      });
      styleFullRow(mainRow, LAST_COL_PEM, fillMain, fontWhite);
      mainRow.getCell(2).alignment = { horizontal: "right", vertical: "middle" };
      mainRow.getCell(2).numFmt = TEXT_FORMAT;
      mainRow.getCell(3).alignment = { horizontal: "left", vertical: "middle" };
      for (let c = 5; c <= LAST_COL_PEM; c++) { mainRow.getCell(c).alignment = { horizontal: "right", vertical: "middle" }; mainRow.getCell(c).numFmt = RP_FORMAT; }
      currentRowPem++;

      const subPemArray = Array.from(main.subAnggaranMap.values());
      subPemArray.forEach((sub: any, sIdx: number) => {
        const subNum = `${mainNum}.${String(sIdx + 1).padStart(2, '0')}`;
        const subRow = sheetPem.addRow({
          sub: subNum,
          nama: sub.namaOriginal,
          m1: sub.months[0], m2: sub.months[1], m3: sub.months[2], m4: sub.months[3], m5: sub.months[4], m6: sub.months[5],
          m7: sub.months[6], m8: sub.months[7], m9: sub.months[8], m10: sub.months[9], m11: sub.months[10], m12: sub.months[11], total: sub.total,
        });
        styleFullRow(subRow, LAST_COL_PEM, fillSub, fontBlack);
        subRow.getCell(3).alignment = { horizontal: "right", vertical: "middle" };
        subRow.getCell(3).numFmt = TEXT_FORMAT;
        subRow.getCell(4).alignment = { horizontal: "left", vertical: "middle" };
        for (let c = 5; c <= LAST_COL_PEM; c++) { subRow.getCell(c).alignment = { horizontal: "right", vertical: "middle" }; subRow.getCell(c).numFmt = RP_FORMAT; }
        currentRowPem++;
      });

      sheetPem.addRow({});
      currentRowPem++;
    });
    const rowTotalPem = sheetPem.addRow({
      kode: "Total",
      m1: grandTotalMonthsPem[0], m2: grandTotalMonthsPem[1], m3: grandTotalMonthsPem[2], m4: grandTotalMonthsPem[3],
      m5: grandTotalMonthsPem[4], m6: grandTotalMonthsPem[5], m7: grandTotalMonthsPem[6], m8: grandTotalMonthsPem[7],
      m9: grandTotalMonthsPem[8], m10: grandTotalMonthsPem[9], m11: grandTotalMonthsPem[10], m12: grandTotalMonthsPem[11],
      total: grandTotalRealisasiPem,
    });
    styleFullRow(rowTotalPem, LAST_COL_PEM, fillDark, fontWhite);
    rowTotalPem.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
    for (let c = 5; c <= LAST_COL_PEM; c++) { rowTotalPem.getCell(c).alignment = { horizontal: "right", vertical: "middle" }; rowTotalPem.getCell(c).numFmt = RP_FORMAT; }


    const sheetPeng = workbook.addWorksheet("Pengeluaran");
    const LAST_COL_PENG = 17; // A..Q

    sheetPeng.columns = [
      { key: "num", width: 6.1640625 },     // A
      { key: "kode", width: 6.1640625 },    // B
      { key: "sub", width: 8.5 },           // C
      { key: "nama", width: 50.83203125 },  // D
      { key: "m1", width: 20.83203125 }, { key: "m2", width: 20.83203125 }, { key: "m3", width: 20.83203125 },
      { key: "m4", width: 20.83203125 }, { key: "m5", width: 20.83203125 }, { key: "m6", width: 20.83203125 },
      { key: "m7", width: 20.83203125 }, { key: "m8", width: 20.83203125 }, { key: "m9", width: 20.83203125 },
      { key: "m10", width: 20.83203125 }, { key: "m11", width: 20.83203125 }, { key: "m12", width: 20.83203125 },
      { key: "total", width: 20.83203125 }, // Q
    ];

    const row1Peng = sheetPeng.addRow({ kode: `Laporan Pengeluaran Tahunan PT Metanouva Informatika Tahun ${tahun}` });
    styleFullRow(row1Peng, LAST_COL_PENG, fillDark, fontWhite);
    row1Peng.getCell(2).alignment = { horizontal: "left", vertical: "middle" };

    const row2Peng = sheetPeng.addRow({
      kode: "Bulan",
      m1: "JANUARI", m2: "FEBRUARI", m3: "MARET", m4: "APRIL", m5: "MEI", m6: "JUNI",
      m7: "JULI", m8: "AGUSTUS", m9: "SEPTEMBER", m10: "OKTOBER", m11: "NOVEMBER", m12: "DESEMBER",
      total: "TOTAL",
    });
    styleFullRow(row2Peng, LAST_COL_PENG, fillDark, fontWhite);
    row2Peng.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
    for (let c = 5; c <= LAST_COL_PENG; c++) row2Peng.getCell(c).alignment = { horizontal: "center", vertical: "middle" };

    const row3Peng = sheetPeng.addRow({ num: 5, kode: "BIAYA PROYEK / COST OF REVENUE", m1: "REALISASI" });
    styleFullRow(row3Peng, LAST_COL_PENG, fillDark, fontWhite);
    row3Peng.getCell(1).alignment = { horizontal: "right", vertical: "middle" };
    row3Peng.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
    sheetPeng.mergeCells(3, 5, 3, LAST_COL_PENG); // E3:Q3
    row3Peng.getCell(5).alignment = { horizontal: "center", vertical: "middle" };

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
            namaOriginal: main.namaMain.trim(), months: new Array(12).fill(0), total: 0, subAnggaranMap: new Map(),
          });
        }

        const mainData = mainPengMap.get(mainKey);

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

    const mainPengArray = Array.from(mainPengMap.values());

    mainPengArray.forEach((main: any, mIdx: number) => {
      const mainNum = `5.${mIdx + 1}`;
      const mainRow = sheetPeng.addRow({
        kode: mainNum, sub: main.namaOriginal.toUpperCase(),
        m1: main.months[0], m2: main.months[1], m3: main.months[2], m4: main.months[3], m5: main.months[4], m6: main.months[5],
        m7: main.months[6], m8: main.months[7], m9: main.months[8], m10: main.months[9], m11: main.months[10], m12: main.months[11], total: main.total,
      });
      styleFullRow(mainRow, LAST_COL_PENG, fillMain, fontWhite);
      mainRow.getCell(2).alignment = { horizontal: "right", vertical: "middle" };
      mainRow.getCell(2).numFmt = TEXT_FORMAT;
      mainRow.getCell(3).alignment = { horizontal: "left", vertical: "middle" };
      for (let c = 5; c <= LAST_COL_PENG; c++) { mainRow.getCell(c).alignment = { horizontal: "right", vertical: "middle" }; mainRow.getCell(c).numFmt = RP_FORMAT; }

      const subPengArray = Array.from(main.subAnggaranMap.values());
      subPengArray.forEach((sub: any, sIdx: number) => {
        const subNum = `${mainNum}.${String(sIdx + 1).padStart(2, '0')}`;
        const subRow = sheetPeng.addRow({
          sub: subNum, nama: sub.namaOriginal,
          m1: sub.months[0], m2: sub.months[1], m3: sub.months[2], m4: sub.months[3], m5: sub.months[4], m6: sub.months[5],
          m7: sub.months[6], m8: sub.months[7], m9: sub.months[8], m10: sub.months[9], m11: sub.months[10], m12: sub.months[11], total: sub.total,
        });
        styleFullRow(subRow, LAST_COL_PENG, fillSub, fontBlack);
        subRow.getCell(3).alignment = { horizontal: "right", vertical: "middle" };
        subRow.getCell(3).numFmt = TEXT_FORMAT;
        subRow.getCell(4).alignment = { horizontal: "left", vertical: "middle" };
        for (let c = 5; c <= LAST_COL_PENG; c++) { subRow.getCell(c).alignment = { horizontal: "right", vertical: "middle" }; subRow.getCell(c).numFmt = RP_FORMAT; }
      });

      sheetPeng.addRow({});
    });

    const rowTotalPeng = sheetPeng.addRow({
      kode: "Total",
      m1: grandTotalMonthsPeng[0], m2: grandTotalMonthsPeng[1], m3: grandTotalMonthsPeng[2], m4: grandTotalMonthsPeng[3],
      m5: grandTotalMonthsPeng[4], m6: grandTotalMonthsPeng[5], m7: grandTotalMonthsPeng[6], m8: grandTotalMonthsPeng[7],
      m9: grandTotalMonthsPeng[8], m10: grandTotalMonthsPeng[9], m11: grandTotalMonthsPeng[10], m12: grandTotalMonthsPeng[11],
      total: grandTotalRealisasiPeng,
    });
    styleFullRow(rowTotalPeng, LAST_COL_PENG, fillDark, fontWhite);
    rowTotalPeng.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
    for (let c = 5; c <= LAST_COL_PENG; c++) { rowTotalPeng.getCell(c).alignment = { horizontal: "right", vertical: "middle" }; rowTotalPeng.getCell(c).numFmt = RP_FORMAT; }

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