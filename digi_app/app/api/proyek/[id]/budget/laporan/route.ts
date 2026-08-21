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

    const proyek = await prisma.proyek.findUnique({
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
    });

    if (!proyek || !proyek.budget) {
      return NextResponse.json(
        { error: "Budget belum diinisialisasi untuk proyek ini." },
        { status: 404 }
      );
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistem Manajemen Proyek";

    // ==========================================
    // DEFINISI STYLE — DISALIN PERSIS DARI TEMPLATE COA
    // (warna hasil decode theme color + tint milik template asli)
    // ==========================================
    const FONT_FAMILY = "Trebuchet MS";

    // Fills (Tingkat Hirarki) — persis sesuai theme+tint template
    // Level 1 = theme dk1 (hitam) + tint 0.25   -> #404040
    // Level 2 = theme lt1 (putih) + tint -0.50  -> #7F7F7F ("Darker 50%")
    // Level 3 = theme lt1 (putih) + tint -0.25  -> #BFBFBF ("Darker 25%")
    // Level 4 = theme lt1 (putih) + tint -0.15  -> #D9D9D9 ("Darker 15%")
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

    // Fonts — semua Trebuchet MS sesuai template
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
    // Catatan: di template asli, baris Keterangan MAUPUN baris Reimbursement
    // sama-sama pakai font non-bold size 10, TIDAK italic. (Versi lama salah
    // memakai italic abu-abu untuk baris reimbursement — sudah diperbaiki.)
    const fontNormal10: Partial<ExcelJS.Font> = {
      name: FONT_FAMILY,
      size: 10,
      bold: false,
      italic: false,
      color: { argb: "FF000000" },
    };

    // Border hairline — warna mengikuti garis theme (#404040) di template
    const borderHair: Partial<ExcelJS.Borders> = {
      top: { style: "hair", color: { argb: "FF404040" } },
      bottom: { style: "hair", color: { argb: "FF404040" } },
      left: { style: "hair", color: { argb: "FF404040" } },
      right: { style: "hair", color: { argb: "FF404040" } },
    };

    const numFmtRupiah = '_-"Rp"* #,##0_-;-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-';

    // Tinggi baris persis sesuai template (Pendapatan=14, Biaya Proyek=15)
    const ROW_HEIGHT_PENDAPATAN = 14;
    const ROW_HEIGHT_BIAYA = 15;

    const isProyekDone =
      proyek.status?.toUpperCase() === "DONE" ||
      proyek.status?.toUpperCase() === "SELESAI";
    const transaksiList = proyek.transaksiPemasukan || [];
    const nilaiProyekTotal = Number(
      proyek.budget.nilaiKontrak || proyek.budget.rabTotal || 0
    );

    // ==========================================
    // SHEET 1: PENDAPATAN (5 Kolom Sesuai File)
    // Col A: Code Lv1 | Col B: Code Lv2 / Header | Col C: Code Lv3 / Lv2 Name | Col D: Lv3 Name / Transaksi | Col E: Realisasi
    // ==========================================
    const sheetPendapatan = workbook.addWorksheet("Pendapatan");

    // Lebar kolom persis sesuai template (termasuk kolom F kosong sisa dari sumber)
    sheetPendapatan.columns = [
      { width: 6.1640625 },  // A
      { width: 6.1640625 },  // B (default, tidak di-set khusus di template)
      { width: 8.5 },        // C
      { width: 50.83203125 },// D
      { width: 20.83203125 },// E
      { width: 6.1640625 },  // F (kolom sisa, tidak dipakai)
    ];

    // Baris 1: [Nama Proyek]
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

    // Baris 2: Header Utama Pendapatan
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
    // "Realisasi" pada header rata KIRI sesuai template (bukan kanan)
    row2Pem.getCell(5).alignment = { vertical: "middle", horizontal: "left" };

    // Data Pemasukan
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
      const mainRow = sheetPendapatan.getRow(currentRowPem++);
      mainRow.height = ROW_HEIGHT_PENDAPATAN;
      mainRow.getCell(2).value = mainNum;
      mainRow.getCell(3).value = main.namaMain;
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
        const subRow = sheetPendapatan.getRow(currentRowPem++);
        subRow.height = ROW_HEIGHT_PENDAPATAN;
        subRow.getCell(3).value = sub.subNum;
        subRow.getCell(4).value = sub.namaSub;
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


    // ==========================================
    // SHEET 2: BIAYA PROYEK (7 Kolom Sesuai File)
    // Col A: Code Lv1 | Col B: Code Lv2 / Judul | Col C: Code Lv3 / Lv2 Name | Col D: Lv3 Name / Lv4 Ket | Col E: Lv5 Detail | Col F: Realisasi | Col G: Alokasi
    // ==========================================
    const sheetBiaya = workbook.addWorksheet("Biaya Proyek");

    // Lebar kolom persis sesuai template (termasuk kolom H kosong sisa dari sumber)
    sheetBiaya.columns = [
      { width: 6.1640625 },  // A
      { width: 6.1640625 },  // B (default, tidak di-set khusus di template)
      { width: 8.5 },        // C
      { width: 10.5 },       // D
      { width: 50.83203125 },// E
      { width: 20.83203125 },// F
      { width: 20.83203125 },// G
      { width: 6.1640625 },  // H (kolom sisa, tidak dipakai)
    ];

    // Baris 1: [Nama Proyek]
    const row1Biaya = sheetBiaya.getRow(1);
    row1Biaya.height = ROW_HEIGHT_BIAYA;
    row1Biaya.getCell(2).value = proyek.nama;
    for (let c = 1; c <= 7; c++) {
      const cell = row1Biaya.getCell(c);
      cell.fill = fillLevel1;
      cell.font = fontWhiteBold;
      cell.border = borderHair;
    }
    row1Biaya.getCell(2).alignment = { vertical: "middle", horizontal: "left" };

    // Baris 2: Header Utama Biaya Proyek
    const row2Biaya = sheetBiaya.getRow(2);
    row2Biaya.height = ROW_HEIGHT_BIAYA;
    row2Biaya.getCell(1).value = "2";
    row2Biaya.getCell(2).value = "Biaya Proyek";
    row2Biaya.getCell(6).value = "Realisasi";
    row2Biaya.getCell(7).value = "Alokasi";
    for (let c = 1; c <= 7; c++) {
      const cell = row2Biaya.getCell(c);
      cell.fill = fillLevel1;
      cell.font = fontWhiteBold;
      cell.border = borderHair;
    }
    row2Biaya.getCell(1).alignment = { vertical: "middle", horizontal: "right" };
    row2Biaya.getCell(2).alignment = { vertical: "middle", horizontal: "left" };
    // "Realisasi" & "Alokasi" pada header rata KIRI sesuai template (bukan kanan)
    row2Biaya.getCell(6).alignment = { vertical: "middle", horizontal: "left" };
    row2Biaya.getCell(7).alignment = { vertical: "middle", horizontal: "left" };

    let currentRowBiaya = 3;
    const pengeluaranMains = proyek.budget.mainAnggaran.filter(
      (m) => m.tipe === "pengeluaran" || !m.tipe
    );

    pengeluaranMains.forEach((main, mIdx) => {
      const mainNum = `2.${mIdx + 1}`;
      let totalRealisasiMain = 0;
      const totalAlokasiMain = Number(main.nominalAlokasi) || 0;

      // Baris Main (Level 2) - Kita tulis placeholder baris dulu
      const mainRowIndex = currentRowBiaya++;

      main.subAnggaran.forEach((sub, sIdx) => {
        const subNum = `${mainNum}.${String(sIdx + 1).padStart(2, "0")}`;
        let totalRealisasiSub = 0;
        const totalAlokasiSub = Number(sub.nominalAlokasi) || 0;

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

                // Level 5: Reimbursement — non-bold, size 10, TIDAK italic
                reimbRow.getCell(5).value = `[${labelTipe}] ${namaReimb}${tglStr}`;
                reimbRow.getCell(6).value = nominalReimb;
                reimbRow.getCell(6).numFmt = numFmtRupiah;

                for (let c = 1; c <= 7; c++) {
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

            // Level 4: Keterangan
            const ketRow = sheetBiaya.getRow(ketRowIndex);
            ketRow.height = ROW_HEIGHT_BIAYA;
            ketRow.getCell(4).value = ket.keterangan;
            ketRow.getCell(6).value = nominalRealKet;
            ketRow.getCell(7).value = Number(ket.nominalAlokasi) || 0;
            ketRow.getCell(6).numFmt = numFmtRupiah;
            ketRow.getCell(7).numFmt = numFmtRupiah;

            for (let c = 1; c <= 7; c++) {
              const cell = ketRow.getCell(c);
              cell.fill = fillLevel4;
              cell.font = fontNormal10;
              cell.border = borderHair;
            }
            // Kolom "Keterangan" rata KANAN sesuai template
            ketRow.getCell(4).alignment = { vertical: "middle", horizontal: "right" };
            ketRow.getCell(6).alignment = { vertical: "middle", horizontal: "right" };
            ketRow.getCell(7).alignment = { vertical: "middle", horizontal: "right" };
          });
        } else {
          totalRealisasiSub = Number(sub.nominalTerpakai) || 0;
        }

        totalRealisasiMain += totalRealisasiSub;

        // Terapkan data dan style pada Sub (Level 3)
        const subRow = sheetBiaya.getRow(subRowIndex);
        subRow.height = ROW_HEIGHT_BIAYA;
        subRow.getCell(3).value = subNum;
        subRow.getCell(4).value = sub.namaSub;
        subRow.getCell(6).value = totalRealisasiSub;
        subRow.getCell(7).value = totalAlokasiSub;
        subRow.getCell(6).numFmt = numFmtRupiah;
        subRow.getCell(7).numFmt = numFmtRupiah;

        for (let c = 1; c <= 7; c++) {
          const cell = subRow.getCell(c);
          cell.fill = fillLevel3;
          cell.font = fontBlackBold;
          cell.border = borderHair;
        }
        subRow.getCell(3).alignment = { vertical: "middle", horizontal: "right" };
        subRow.getCell(4).alignment = { vertical: "middle", horizontal: "left" };
        subRow.getCell(6).alignment = { vertical: "middle", horizontal: "right" };
        subRow.getCell(7).alignment = { vertical: "middle", horizontal: "right" };
      });

      // Terapkan data dan style pada Main (Level 2)
      const mainRow = sheetBiaya.getRow(mainRowIndex);
      mainRow.height = ROW_HEIGHT_BIAYA;
      mainRow.getCell(2).value = mainNum;
      mainRow.getCell(3).value = main.namaMain;
      mainRow.getCell(6).value = Math.max(
        Number(main.nominalTerpakai) || 0,
        totalRealisasiMain
      );
      mainRow.getCell(7).value = totalAlokasiMain;
      mainRow.getCell(6).numFmt = numFmtRupiah;
      mainRow.getCell(7).numFmt = numFmtRupiah;

      for (let c = 1; c <= 7; c++) {
        const cell = mainRow.getCell(c);
        cell.fill = fillLevel2;
        cell.font = fontWhiteBold;
        cell.border = borderHair;
      }
      mainRow.getCell(2).alignment = { vertical: "middle", horizontal: "right" };
      mainRow.getCell(6).alignment = { vertical: "middle", horizontal: "right" };
      mainRow.getCell(7).alignment = { vertical: "middle", horizontal: "right" };
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