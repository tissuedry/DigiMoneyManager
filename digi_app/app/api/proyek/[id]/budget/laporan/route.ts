import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const proyekId = parseInt(resolvedParams.id, 10);

    if (isNaN(proyekId)) {
      return NextResponse.json(
        { error: "ID Proyek tidak valid." },
        { status: 400 }
      );
    }

    const [proyek, masterMainList] = await Promise.all([
      prisma.proyek.findUnique({
        where: { id: proyekId },
        include: {
          terminPembayaran: {
            orderBy: { urutan: "asc" },
          },
          transaksiPemasukan: {
            orderBy: { tanggalTransaksi: "asc" },
          },
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
                            include: {
                              user: true,
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
      }),
      prisma.masterMain.findMany({
        include: {
          MasterSub: true,
        },
      }),
    ]);

    if (!proyek || !proyek.budget) {
      return NextResponse.json(
        { error: "Budget belum diinisialisasi untuk proyek ini." },
        { status: 404 }
      );
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistem Manajemen Proyek";
    const FONT_FAMILY = "Trebuchet MS";

    const fillLevel1: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF404040" }, // Judul Proyek & Header Utama
    };
    const fillLevel2: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF7F7F7F" }, // Baris "Main" (mis. 1.1 / 2.1)
    };
    const fillLevel3: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFBFBFBF" }, // Baris "Sub" (mis. 1.1.01)
    };
    const fillLevel4: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9D9D9" }, // Baris Detail / Transaksi / Keterangan / Reimbursement
    };
    const fontWhiteBold: Partial<ExcelJS.Font> = {
      name: FONT_FAMILY,
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    const fontBlackBold: Partial<ExcelJS.Font> = {
      name: FONT_FAMILY,
      size: 11,
      bold: true,
      color: { argb: "FF000000" },
    };

    const fontNormal10: Partial<ExcelJS.Font> = {
      name: FONT_FAMILY,
      size: 10,
      bold: false,
      italic: false,
      color: { argb: "FF000000" },
    };

    const borderHair: Partial<ExcelJS.Borders> = {
      top: { style: "hair", color: { argb: "FF404040" } },
      bottom: { style: "hair", color: { argb: "FF404040" } },
      left: { style: "hair", color: { argb: "FF404040" } },
      right: { style: "hair", color: { argb: "FF404040" } },
    };

    const numFmtRupiah = '_-"Rp"* #,##0_-;-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-';

    const ROW_HEIGHT_PENDAPATAN = 14;
    const ROW_HEIGHT_BIAYA = 15;

    const isProyekDone =
      proyek.status?.toUpperCase() === "DONE" ||
      proyek.status?.toUpperCase() === "SELESAI";
    const transaksiList = proyek.transaksiPemasukan || [];
    const nilaiProyekTotal = Number(
      proyek.budget.nilaiKontrak || 0
    );

    const sheetPendapatan = workbook.addWorksheet("Pendapatan");

    sheetPendapatan.columns = [
      { width: 6.1640625 },  // A
      { width: 6.1640625 },  // B 
      { width: 8.5 },        // C
      { width: 50.83203125 },// D
      { width: 20.83203125 },// E
      { width: 6.1640625 },  // F 
    ];

    // Nama Proyek
    const row1Pem = sheetPendapatan.getRow(1);
    row1Pem.height = ROW_HEIGHT_PENDAPATAN;
    row1Pem.getCell(2).value = proyek.nama;
    for (let c = 1; c <= 5; c++) {
      const cell = row1Pem.getCell(c);
      cell.fill = fillLevel1;
      cell.font = fontWhiteBold;
      cell.border = borderHair;
    }
    row1Pem.getCell(2).alignment = { vertical: "middle", horizontal: "left" };

    // Header Pendapatan
    const row2Pem = sheetPendapatan.getRow(2);
    row2Pem.height = ROW_HEIGHT_PENDAPATAN;
    row2Pem.getCell(1).value = "1";
    row2Pem.getCell(2).value = "Pendapatan Proyek";
    row2Pem.getCell(5).value = "Realisasi";
    for (let c = 1; c <= 5; c++) {
      const cell = row2Pem.getCell(c);
      cell.fill = fillLevel1;
      cell.font = fontWhiteBold;
      cell.border = borderHair;
    }
    row2Pem.getCell(1).alignment = { vertical: "middle", horizontal: "right" };
    row2Pem.getCell(2).alignment = { vertical: "middle", horizontal: "left" };
    row2Pem.getCell(5).alignment = { vertical: "middle", horizontal: "left" };

    let pemasukanMains = proyek.budget.mainAnggaran.filter(
      (m) => m.tipe === "pemasukan"
    );

    if (pemasukanMains.length === 0) {
      pemasukanMains = [
        {
          id: 99999,
          budgetId: proyek.budget.id,
          namaMain: "Penjualan Barang / Jasa",
          nominalAlokasi: nilaiProyekTotal,
          tipe: "pemasukan",
          nominalTerpakai: 0,
          subAnggaran: [
            {
              id: 99999,
              mainAnggaranId: 99999,
              namaSub: "Penjualan Barang / Jasa",
              nominalAlokasi: nilaiProyekTotal,
              nominalTerpakai: 0,
              keterangan: [],
            },
          ],
        } as any,
      ];
    }

    let currentRowPem = 3;

    pemasukanMains.forEach((main, mIdx) => {
      const mainNum = `1.${mIdx + 1}`;
      let totalMain = 0;

      // Hitung sub
      const subsCalculated = main.subAnggaran.map((sub, sIdx) => {
        const subNum = `${mainNum}.${String(sIdx + 1).padStart(2, "0")}`;
        const sName = (sub.namaSub || "").trim().toLowerCase();
        const isPenjualanSub =
          (sName.startsWith("penjualan") ||
            sName.startsWith("pendapatan") ||
            sName === (main.namaMain || "").trim().toLowerCase()) &&
          !sName.includes("diskon") &&
          !sName.includes("retur") &&
          !sName.includes("biaya");

        const relatedTransaksis = transaksiList.filter(
          (t: any) =>
            t.subCoaId === sub.id ||
            (t.kategori || "").toLowerCase() === (sub.namaSub || "").toLowerCase() ||
            (isPenjualanSub &&
              ["penerimaan_penjualan", "penjualan", "keuntungan_proyek"].includes(
                (t.kategori || "").toLowerCase()
              ))
        );

        const transaksiTotal = relatedTransaksis.reduce(
          (acc: number, t: any) => acc + (Number(t.nominal) || 0),
          0
        );

        let totalSub = isPenjualanSub
          ? transaksiTotal > 0
            ? transaksiTotal
            : isProyekDone
              ? Math.max(Number(sub.nominalAlokasi || 0), Number(sub.nominalTerpakai || 0))
              : Math.max(Number(sub.nominalTerpakai || 0), transaksiTotal)
          : transaksiTotal;

        if (totalSub === 0 && isProyekDone && isPenjualanSub) {
          totalSub = nilaiProyekTotal;
        }

        totalMain += totalSub;
        return { ...sub, subNum, totalSub, relatedTransaksis, isPenjualanSub };
      });

      // Row Main (Level 2)
      const matchedMain = masterMainList.find(
        (mm) => mm.nama.toUpperCase().trim() === (main.namaMain || "").toUpperCase().trim()
      );
      const mainKode = matchedMain?.kode ? `(${matchedMain.kode}) ` : "";
      const displayMainName = `${mainKode}${main.namaMain}`;

      const mainRow = sheetPendapatan.getRow(currentRowPem++);
      mainRow.height = ROW_HEIGHT_PENDAPATAN;
      mainRow.getCell(2).value = mainNum;
      mainRow.getCell(3).value = displayMainName;
      mainRow.getCell(5).value = totalMain;
      mainRow.getCell(5).numFmt = numFmtRupiah;

      for (let c = 1; c <= 5; c++) {
        const cell = mainRow.getCell(c);
        cell.fill = fillLevel2;
        cell.font = fontWhiteBold;
        cell.border = borderHair;
      }
      mainRow.getCell(2).alignment = { vertical: "middle", horizontal: "right" };
      mainRow.getCell(5).alignment = { vertical: "middle", horizontal: "right" };

      // Rows Sub (Level 3) & Realisasi (Level 4)
      subsCalculated.forEach((sub) => {
        const matchedSub = matchedMain?.MasterSub?.find(
          (ms) => ms.nama.toUpperCase().trim() === (sub.namaSub || "").toUpperCase().trim()
        );
        const subKode = matchedSub?.kode ? `(${matchedSub.kode}) ` : "";
        const displaySubName = `${subKode}${sub.namaSub}`;

        const subRow = sheetPendapatan.getRow(currentRowPem++);
        subRow.height = ROW_HEIGHT_PENDAPATAN;
        subRow.getCell(3).value = sub.subNum;
        subRow.getCell(4).value = displaySubName;
        subRow.getCell(5).value = sub.totalSub;
        subRow.getCell(5).numFmt = numFmtRupiah;

        for (let c = 1; c <= 5; c++) {
          const cell = subRow.getCell(c);
          cell.fill = fillLevel3;
          cell.font = fontBlackBold;
          cell.border = borderHair;
        }
        subRow.getCell(3).alignment = { vertical: "middle", horizontal: "right" };
        subRow.getCell(4).alignment = { vertical: "middle", horizontal: "left" };
        subRow.getCell(5).alignment = { vertical: "middle", horizontal: "right" };

        // Detail Transaksi / Realisasi
        if (sub.relatedTransaksis && sub.relatedTransaksis.length > 0) {
          sub.relatedTransaksis.forEach((tr: any) => {
            const trRow = sheetPendapatan.getRow(currentRowPem++);
            trRow.height = ROW_HEIGHT_PENDAPATAN;
            let tglStr = "";
            if (tr.tanggalTransaksi) {
              const d = new Date(tr.tanggalTransaksi);
              if (!isNaN(d.getTime())) {
                tglStr = ` • ${d.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}`;
              }
            }
            const label = tr.keterangan || tr.namaRealisasi || "Realisasi Pemasukan";
            trRow.getCell(4).value = `${label}${tglStr}`;
            trRow.getCell(5).value = Number(tr.nominal) || 0;
            trRow.getCell(5).numFmt = numFmtRupiah;

            for (let c = 1; c <= 5; c++) {
              const cell = trRow.getCell(c);
              cell.fill = fillLevel4;
              cell.font = fontNormal10;
              cell.border = borderHair;
            }
            trRow.getCell(4).alignment = { vertical: "middle", horizontal: "left" };
            trRow.getCell(5).alignment = { vertical: "middle", horizontal: "right" };
          });
        }
      });
    });


    const sheetBiaya = workbook.addWorksheet("Biaya Proyek");

    sheetBiaya.columns = [
      { width: 6.1640625 },  // A
      { width: 6.1640625 },  // B 
      { width: 8.5 },        // C
      { width: 10.5 },       // D
      { width: 50.83203125 },// E
      { width: 20.83203125 },// F (Realisasi)
      { width: 20.83203125 },// G (Alokasi)
      { width: 20.83203125 },// H (Sisa)
      { width: 6.1640625 },  // I 
    ];

    // Nama Proyek
    const row1Biaya = sheetBiaya.getRow(1);
    row1Biaya.height = ROW_HEIGHT_BIAYA;
    row1Biaya.getCell(2).value = proyek.nama;
    for (let c = 1; c <= 8; c++) {
      const cell = row1Biaya.getCell(c);
      cell.fill = fillLevel1;
      cell.font = fontWhiteBold;
      cell.border = borderHair;
    }
    row1Biaya.getCell(2).alignment = { vertical: "middle", horizontal: "left" };

    // Header Biaya Proyek
    const row2Biaya = sheetBiaya.getRow(2);
    row2Biaya.height = ROW_HEIGHT_BIAYA;
    row2Biaya.getCell(1).value = "2";
    row2Biaya.getCell(2).value = "Biaya Proyek";
    row2Biaya.getCell(6).value = "Realisasi";
    row2Biaya.getCell(7).value = "Alokasi";
    row2Biaya.getCell(8).value = "Sisa";
    for (let c = 1; c <= 8; c++) {
      const cell = row2Biaya.getCell(c);
      cell.fill = fillLevel1;
      cell.font = fontWhiteBold;
      cell.border = borderHair;
    }
    row2Biaya.getCell(1).alignment = { vertical: "middle", horizontal: "right" };
    row2Biaya.getCell(2).alignment = { vertical: "middle", horizontal: "left" };
    row2Biaya.getCell(6).alignment = { vertical: "middle", horizontal: "left" };
    row2Biaya.getCell(7).alignment = { vertical: "middle", horizontal: "left" };
    row2Biaya.getCell(8).alignment = { vertical: "middle", horizontal: "left" };

    let currentRowBiaya = 3;
    const pengeluaranMains = proyek.budget.mainAnggaran.filter(
      (m) => m.tipe === "pengeluaran" || !m.tipe
    );

    pengeluaranMains.forEach((main, mIdx) => {
      const mainNum = `2.${mIdx + 1}`;
      let totalRealisasiMain = 0;
      const totalAlokasiMain = Number(main.nominalAlokasi) || 0;

      const matchedMain = masterMainList.find(
        (mm) => mm.nama.toUpperCase().trim() === (main.namaMain || "").toUpperCase().trim()
      );
      const mainKode = matchedMain?.kode ? `(${matchedMain.kode}) ` : "";
      const displayMainName = `${mainKode}${main.namaMain}`;

      const mainRowIndex = currentRowBiaya++;

      main.subAnggaran.forEach((sub, sIdx) => {
        const subNum = `${mainNum}.${String(sIdx + 1).padStart(2, "0")}`;
        let totalRealisasiSub = 0;
        const totalAlokasiSub = Number(sub.nominalAlokasi) || 0;

        const matchedSub = matchedMain?.MasterSub?.find(
          (ms) => ms.nama.toUpperCase().trim() === (sub.namaSub || "").toUpperCase().trim()
        );
        const subKode = matchedSub?.kode ? `(${matchedSub.kode}) ` : "";
        const displaySubName = `${subKode}${sub.namaSub}`;

        const subRowIndex = currentRowBiaya++;

        if (sub.keterangan && sub.keterangan.length > 0) {
          sub.keterangan.forEach((ket) => {
            let ketReimbsTotal = 0;

            const ketRowIndex = currentRowBiaya++;

            if (ket.reimbursements && ket.reimbursements.length > 0) {
              ket.reimbursements.forEach((reimb) => {
                const reimbRow = sheetBiaya.getRow(currentRowBiaya++);
                reimbRow.height = ROW_HEIGHT_BIAYA;
                let tglStr = "";
                if (reimb.tanggalStruk) {
                  const d = new Date(reimb.tanggalStruk);
                  if (!isNaN(d.getTime())) {
                    tglStr = ` • ${d.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}`;
                  }
                }

                const namaReimb = reimb.nama || "Pengajuan";
                const labelTipe =
                  reimb.tipe === "Realisasi Anggaran" ? "Realisasi" : "Reimb";
                const nominalReimb = Number(reimb.nominal) || 0;
                ketReimbsTotal += nominalReimb;

                // Level 5: Reimbursement
                reimbRow.getCell(5).value = `[${labelTipe}] ${namaReimb}${tglStr}`;
                reimbRow.getCell(6).value = nominalReimb;
                reimbRow.getCell(6).numFmt = numFmtRupiah;

                for (let c = 1; c <= 8; c++) {
                  const cell = reimbRow.getCell(c);
                  cell.fill = fillLevel4;
                  cell.font = fontNormal10;
                  cell.border = borderHair;
                }
                reimbRow.getCell(5).alignment = { vertical: "middle", horizontal: "left" };
                reimbRow.getCell(6).alignment = { vertical: "middle", horizontal: "right" };
              });
            }

            const nominalRealKet = Math.max(
              Number(ket.nominalRealisasi) || 0,
              ketReimbsTotal
            );
            totalRealisasiSub += nominalRealKet;
            const alokasiKet = Number(ket.nominalAlokasi) || 0;
            const sisaKet = Math.max(0, alokasiKet - nominalRealKet);

            // Level 4: Keterangan
            const ketRow = sheetBiaya.getRow(ketRowIndex);
            ketRow.height = ROW_HEIGHT_BIAYA;
            ketRow.getCell(4).value = ket.keterangan;
            ketRow.getCell(6).value = nominalRealKet;
            ketRow.getCell(7).value = alokasiKet;
            ketRow.getCell(8).value = sisaKet;
            ketRow.getCell(6).numFmt = numFmtRupiah;
            ketRow.getCell(7).numFmt = numFmtRupiah;
            ketRow.getCell(8).numFmt = numFmtRupiah;

            for (let c = 1; c <= 8; c++) {
              const cell = ketRow.getCell(c);
              cell.fill = fillLevel4;
              cell.font = fontNormal10;
              cell.border = borderHair;
            }
            ketRow.getCell(4).alignment = { vertical: "middle", horizontal: "right" };
            ketRow.getCell(6).alignment = { vertical: "middle", horizontal: "right" };
            ketRow.getCell(7).alignment = { vertical: "middle", horizontal: "right" };
            ketRow.getCell(8).alignment = { vertical: "middle", horizontal: "right" };
          });
        } else {
          totalRealisasiSub = Number(sub.nominalTerpakai) || 0;
        }

        totalRealisasiMain += totalRealisasiSub;
        const sisaSub = Math.max(0, totalAlokasiSub - totalRealisasiSub);

        const subRow = sheetBiaya.getRow(subRowIndex);
        subRow.height = ROW_HEIGHT_BIAYA;
        subRow.getCell(3).value = subNum;
        subRow.getCell(4).value = displaySubName;
        subRow.getCell(6).value = totalRealisasiSub;
        subRow.getCell(7).value = totalAlokasiSub;
        subRow.getCell(8).value = sisaSub;
        subRow.getCell(6).numFmt = numFmtRupiah;
        subRow.getCell(7).numFmt = numFmtRupiah;
        subRow.getCell(8).numFmt = numFmtRupiah;

        for (let c = 1; c <= 8; c++) {
          const cell = subRow.getCell(c);
          cell.fill = fillLevel3;
          cell.font = fontBlackBold;
          cell.border = borderHair;
        }
        subRow.getCell(3).alignment = { vertical: "middle", horizontal: "right" };
        subRow.getCell(4).alignment = { vertical: "middle", horizontal: "left" };
        subRow.getCell(6).alignment = { vertical: "middle", horizontal: "right" };
        subRow.getCell(7).alignment = { vertical: "middle", horizontal: "right" };
        subRow.getCell(8).alignment = { vertical: "middle", horizontal: "right" };
      });

      const finalRealisasiMain = Math.max(
        Number(main.nominalTerpakai) || 0,
        totalRealisasiMain
      );
      const sisaMain = Math.max(0, totalAlokasiMain - finalRealisasiMain);

      const mainRow = sheetBiaya.getRow(mainRowIndex);
      mainRow.height = ROW_HEIGHT_BIAYA;
      mainRow.getCell(2).value = mainNum;
      mainRow.getCell(3).value = displayMainName;
      mainRow.getCell(6).value = finalRealisasiMain;
      mainRow.getCell(7).value = totalAlokasiMain;
      mainRow.getCell(8).value = sisaMain;
      mainRow.getCell(6).numFmt = numFmtRupiah;
      mainRow.getCell(7).numFmt = numFmtRupiah;
      mainRow.getCell(8).numFmt = numFmtRupiah;

      for (let c = 1; c <= 8; c++) {
        const cell = mainRow.getCell(c);
        cell.fill = fillLevel2;
        cell.font = fontWhiteBold;
        cell.border = borderHair;
      }
      mainRow.getCell(2).alignment = { vertical: "middle", horizontal: "right" };
      mainRow.getCell(6).alignment = { vertical: "middle", horizontal: "right" };
      mainRow.getCell(7).alignment = { vertical: "middle", horizontal: "right" };
      mainRow.getCell(8).alignment = { vertical: "middle", horizontal: "right" };
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="Chart_of_Accounts_${proyek.nama.replace(/\s+/g, "_")}.xlsx"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Excel generation error:", error);
    return NextResponse.json(
      { error: "Gagal membuat laporan Excel" },
      { status: 500 }
    );
  }
}