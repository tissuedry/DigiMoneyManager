import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { clearCache } from "@/lib/route-cache";

// Helper check permissions
async function checkCanManageBudget(req: NextRequest, proyekId: number) {
  const roleHeader = req.headers.get("x-user-role") || "";
  const rolesHeader = req.headers.get("x-user-roles") || roleHeader || "";
  const roles = rolesHeader.split(",").map((r) => r.trim().toLowerCase());
  const userId = req.headers.get("x-user-id");

  const isPM = await prisma.userProyek.findFirst({
    where: {
      userId: parseInt(userId || "0", 10),
      proyekId,
      role: "Project Manager",
    },
  });

  const isSuperAdmin =
    roles.some((r) => r === "superadmin" || r === "super admin") ||
    roleHeader.toLowerCase().trim() === "superadmin" ||
    roleHeader.toLowerCase().trim() === "super admin";

  const isDirektur = roles.some((r) => r.includes("direktur") || r.includes("manajemen"));
  const isKeuangan = roles.some((r) => r.includes("keuangan"));

  return isPM || isKeuangan || isDirektur || isSuperAdmin;
}

// Download template Excel yang selaras dengan laporan
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const proyekId = parseInt(id, 10);
    if (isNaN(proyekId)) {
      return NextResponse.json({ error: "ID Proyek tidak valid" }, { status: 400 });
    }

    const [proyek, masterMainList] = await Promise.all([
      prisma.proyek.findUnique({
        where: { id: proyekId },
        include: {
          budget: {
            include: {
              mainAnggaran: {
                where: { tipe: "pengeluaran" },
                orderBy: { id: "asc" },
                include: {
                  subAnggaran: {
                    orderBy: { id: "asc" },
                    include: {
                      keterangan: {
                        orderBy: { id: "asc" },
                        include: {
                          reimbursements: {
                            where: { status: { in: ["APPROVED", "PAID", "DISBURSED"] } },
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
        where: { tipe: "pengeluaran" },
        include: { MasterSub: true },
        orderBy: { kode: "asc" },
      }),
    ]);

    if (!proyek) {
      return NextResponse.json({ error: "Proyek tidak ditemukan" }, { status: 404 });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistem Manajemen Proyek";
    const FONT_FAMILY = "Trebuchet MS";

    const fillLevel1: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF404040" },
    };
    const fillLevel2: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF7F7F7F" },
    };
    const fillLevel3: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFBFBFBF" },
    };
    const fillLevel4: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9D9D9" },
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
      color: { argb: "FF000000" },
    };

    const borderHair: Partial<ExcelJS.Borders> = {
      top: { style: "hair", color: { argb: "FF404040" } },
      bottom: { style: "hair", color: { argb: "FF404040" } },
      left: { style: "hair", color: { argb: "FF404040" } },
      right: { style: "hair", color: { argb: "FF404040" } },
    };

    const numFmtRupiah = '_-"Rp"* #,##0_-;-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-';
    const numFmtText = "@";
    const ROW_HEIGHT = 16;

    const sheetBiaya = workbook.addWorksheet("Biaya Proyek");

    sheetBiaya.columns = [
      { width: 6.1640625 },  // A
      { width: 6.1640625 },  // B (Index Main: 2.1, 2.2)
      { width: 8.5 },        // C (Index Sub: 2.1.01)
      { width: 10.5 },       // D (Nama Keterangan)
      { width: 50.83203125 },// E (Reimbursement detail)
      { width: 20.83203125 },// F (Realisasi)
      { width: 20.83203125 },// G (Alokasi)
      { width: 20.83203125 },// H (Sisa)
      { width: 6.1640625 },  // I 
    ];

    // Baris 1: Nama Proyek
    const row1Biaya = sheetBiaya.getRow(1);
    row1Biaya.height = ROW_HEIGHT;
    row1Biaya.getCell(2).value = proyek.nama;
    for (let c = 1; c <= 8; c++) {
      const cell = row1Biaya.getCell(c);
      cell.fill = fillLevel1;
      cell.font = fontWhiteBold;
      cell.border = borderHair;
    }
    row1Biaya.getCell(2).alignment = { vertical: "middle", horizontal: "left" };

    // Baris 2: Header Biaya Proyek
    const row2Biaya = sheetBiaya.getRow(2);
    row2Biaya.height = ROW_HEIGHT;
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
    const existingMains = proyek.budget?.mainAnggaran.filter(
      (m) => m.tipe === "pengeluaran" || !m.tipe
    ) || [];

    if (existingMains.length > 0) {
      existingMains.forEach((main, mIdx) => {
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
                  reimbRow.height = ROW_HEIGHT;
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

              const ketRow = sheetBiaya.getRow(ketRowIndex);
              ketRow.height = ROW_HEIGHT;
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
          subRow.height = ROW_HEIGHT;
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
        mainRow.height = ROW_HEIGHT;
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
    }

    // Tambahkan sheet daftar Master CoA sebagai referensi pengguna
    const refSheet = workbook.addWorksheet("Referensi Master CoA");
    refSheet.columns = [
      { width: 16, style: { numFmt: numFmtText } }, // Kode
      { width: 35, style: { numFmt: numFmtText } }, // Main Pos
      { width: 35, style: { numFmt: numFmtText } }, // Sub Pos
    ];

    const refHRow = refSheet.getRow(1);
    refHRow.height = ROW_HEIGHT;
    refHRow.getCell(1).value = "Kode CoA";
    refHRow.getCell(2).value = "Main Pos CoA";
    refHRow.getCell(3).value = "Sub Pos CoA";
    for (let c = 1; c <= 3; c++) {
      const cell = refHRow.getCell(c);
      cell.fill = fillLevel1;
      cell.font = fontWhiteBold;
      cell.border = borderHair;
    }

    let refRowIndex = 2;
    masterMainList.forEach((mm) => {
      if (mm.MasterSub && mm.MasterSub.length > 0) {
        mm.MasterSub.forEach((ms) => {
          const r = refSheet.getRow(refRowIndex++);
          r.height = ROW_HEIGHT;
          r.getCell(1).value = ms.kode || mm.kode || "-";
          r.getCell(1).numFmt = numFmtText;
          r.getCell(2).value = mm.nama;
          r.getCell(3).value = ms.nama;
          for (let c = 1; c <= 3; c++) {
            r.getCell(c).font = fontNormal10;
            r.getCell(c).border = borderHair;
          }
        });
      } else {
        const r = refSheet.getRow(refRowIndex++);
        r.height = ROW_HEIGHT;
        r.getCell(1).value = mm.kode || "-";
        r.getCell(1).numFmt = numFmtText;
        r.getCell(2).value = mm.nama;
        r.getCell(3).value = "-";
        for (let c = 1; c <= 3; c++) {
          r.getCell(c).font = fontNormal10;
          r.getCell(c).border = borderHair;
        }
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="Template_Import_Biaya_${proyek.nama.replace(/\s+/g, "_")}.xlsx"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error: any) {
    console.error("Download template error:", error);
    return NextResponse.json({ error: "Gagal membuat template Excel" }, { status: 500 });
  }
}

// Import & update alokasi biaya proyek dari Excel
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const proyekId = parseInt(id, 10);
    if (isNaN(proyekId)) {
      return NextResponse.json({ message: "ID Proyek tidak valid" }, { status: 400 });
    }

    const canManage = await checkCanManageBudget(req, proyekId);
    if (!canManage) {
      return NextResponse.json(
        { message: "Forbidden: Anda tidak memiliki akses untuk mengimpor anggaran proyek ini" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const catatanInput = formData.get("catatan") as string | null;
    const rawUserId = req.headers.get("x-user-id");
    const userIdNum = parseInt(rawUserId || "0", 10);

    if (!file) {
      return NextResponse.json({ message: "File Excel (.xlsx) wajib diunggah" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    // Ambil sheet "Biaya Proyek", "Import Biaya Proyek", atau sheet pertama
    let worksheet =
      workbook.getWorksheet("Biaya Proyek") ||
      workbook.getWorksheet("Import Biaya Proyek") ||
      workbook.worksheets[0];

    if (!worksheet) {
      return NextResponse.json({ message: "Sheet Excel tidak ditemukan atau kosong" }, { status: 400 });
    }

    const budget = await prisma.budget.findUnique({
      where: { proyekId },
      include: {
        mainAnggaran: {
          include: {
            subAnggaran: {
              include: {
                keterangan: {
                  include: {
                    reimbursements: {
                      where: { status: { in: ["APPROVED", "PAID", "DISBURSED"] } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!budget) {
      return NextResponse.json(
        { message: "Budget untuk proyek ini belum diinisialisasi" },
        { status: 400 }
      );
    }

    // Struktur baris yang akan dibaca:
    // Bisa dari Template Import (Kolom D=Main, E=Sub, F=Ket, G=Alokasi)
    // ATAU dari Laporan Export Excel (Kolom B/C=Main, C/D=Sub, D=Ket, G=Alokasi)
    type ParsedRow = {
      kode?: string;
      main: string;
      sub: string;
      ket: string;
      alokasi: number;
      mainAlokasi?: number;
      subAlokasi?: number;
    };

    const parsedItems: ParsedRow[] = [];

    // Deteksi letak kolom header
    let isTemplateFormat = false;
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 3) {
        const text = row.values ? JSON.stringify(row.values).toLowerCase() : "";
        if (text.includes("petunjuk pengisian") || (text.includes("kode coa") && text.includes("main pos"))) {
          isTemplateFormat = true;
        }
      }
    });

    const cleanName = (val: any) => {
      if (!val) return "";
      let s = String(val).trim();
      // Hilangkan prefix indeks angka (misal: "2.1 Biaya Produksi" -> "Biaya Produksi")
      s = s.replace(/^[0-9]+(\.[0-9]+)*\s*/, "");
      // Hilangkan kode kurung bila ada (misal: "(1-4002) testing" -> "testing")
      s = s.replace(/^\([A-Za-z0-9\-_.]+\)\s*/, "");
      return s.trim();
    };

    const cleanKode = (val: any) => {
      if (!val) return "";
      return String(val).trim();
    };

    const parseNum = (val: any): number => {
      if (val === null || val === undefined) return 0;
      if (typeof val === "number") return val;
      if (typeof val === "object" && val.result !== undefined) {
        return parseNum(val.result);
      }
      const cleaned = String(val).replace(/[^0-9.-]+/g, "");
      const n = parseFloat(cleaned);
      return isNaN(n) ? 0 : n;
    };

    const extractKode = (val: any) => {
      if (!val) return "";
      const s = String(val).trim();
      const m = s.match(/^\(([A-Za-z0-9\-_.]+)\)/);
      return m ? m[1] : "";
    };

    if (isTemplateFormat) {
      // Baris data mulai baris 3 (Format Template Kolom D=Main, E=Sub, F=Ket, G=Alokasi)
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber <= 2) return;
        const kode = cleanKode(row.getCell(3).value);
        const main = cleanName(row.getCell(4).value);
        const sub = cleanName(row.getCell(5).value);
        const ket = cleanName(row.getCell(6).value);
        const alokasi = parseNum(row.getCell(7).value);

        if (main && alokasi >= 0) {
          parsedItems.push({
            kode,
            main,
            sub: sub || main,
            ket: ket || sub || main,
            alokasi,
            mainAlokasi: alokasi,
            subAlokasi: alokasi,
          });
        }
      });
    } else {
      // Format file export laporan & template baru (Sheet "Biaya Proyek")
      // Hierarki:
      // - Main Pos: cell B berisi "2.X", cell C berisi Nama Main, cell D kosong
      // - Sub Pos:  cell C berisi "2.X.YY", cell D berisi Nama Sub
      // - Keterangan: cell B & C kosong, cell D berisi Nama Keterangan, cell G berisi Alokasi
      // - Realisasi (diabaikan saat impor alokasi): cell E berisi "[Realisasi]..." atau "[Reimb]..."

      type RawRow = {
        rowNum: number;
        type: "main" | "sub" | "ket";
        indexStr: string;
        name: string;
        kode: string;
        alokasi: number;
      };

      const rawRows: RawRow[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber <= 2) return;

        const cell2 = String(row.getCell(2).value || "").trim(); // Indeks Main (2.1, 2.2)
        const cell3 = String(row.getCell(3).value || "").trim(); // Nama Main ATAU Indeks Sub (2.1.01)
        const cell4 = String(row.getCell(4).value || "").trim(); // Nama Sub ATAU Nama Keterangan
        const cell5 = String(row.getCell(5).value || "").trim(); // Detail Realisasi
        const cell7 = row.getCell(7).value; // Nominal Alokasi

        // Baris realisasi reimbursement di bawah keterangan (Level 5): lewati
        if (cell5 && (cell5.startsWith("[Realisasi]") || cell5.startsWith("[Reimb]") || cell5.startsWith("["))) {
          return;
        }

        // 1. Baris Main Pos (cell 2 = "2.X", cell 3 = Nama Main, cell 4 kosong)
        if (cell2.match(/^2\.[0-9]+$/) && cell3 && !cell4) {
          rawRows.push({
            rowNum: rowNumber,
            type: "main",
            indexStr: cell2,
            name: cleanName(cell3),
            kode: extractKode(cell3),
            alokasi: parseNum(cell7),
          });
          return;
        }

        // 2. Baris Sub Pos (cell 3 = "2.X.YY", cell 4 = Nama Sub)
        if (cell3.match(/^2\.[0-9]+\.[0-9]+$/) && cell4) {
          rawRows.push({
            rowNum: rowNumber,
            type: "sub",
            indexStr: cell3,
            name: cleanName(cell4),
            kode: extractKode(cell4),
            alokasi: parseNum(cell7),
          });
          return;
        }

        // 3. Baris Keterangan (cell 2 kosong, cell 3 kosong, cell 4 berisi nama keterangan)
        if (!cell2 && !cell3 && cell4) {
          rawRows.push({
            rowNum: rowNumber,
            type: "ket",
            indexStr: "",
            name: cleanName(cell4),
            kode: "",
            alokasi: parseNum(cell7),
          });
          return;
        }
      });

      // Hubungkan struktur Main -> Sub -> Keterangan
      for (let i = 0; i < rawRows.length; i++) {
        const item = rawRows[i];
        if (item.type === "main") {
          // Cari apakah main ini memiliki sub di baris-baris berikutnya sebelum main berikutnya
          let hasChildSub = false;
          for (let j = i + 1; j < rawRows.length; j++) {
            if (rawRows[j].type === "main") break;
            if (rawRows[j].type === "sub") {
              hasChildSub = true;
              break;
            }
          }

          if (!hasChildSub) {
            // Main Pos berdiri sendiri tanpa sub pos (alokasi ada di main)
            parsedItems.push({
              kode: item.kode,
              main: item.name,
              sub: item.name,
              ket: item.name,
              alokasi: item.alokasi,
              mainAlokasi: item.alokasi,
              subAlokasi: item.alokasi,
            });
          }
        } else if (item.type === "sub") {
          // Cari Main Pos induknya (main terdekat sebelumnya)
          let parentMain: RawRow | null = null;
          for (let j = i - 1; j >= 0; j--) {
            if (rawRows[j].type === "main") {
              parentMain = rawRows[j];
              break;
            }
          }

          if (!parentMain) continue;

          // Cari apakah sub ini memiliki rincian keterangan di baris-baris berikutnya
          const childKets: RawRow[] = [];
          for (let j = i + 1; j < rawRows.length; j++) {
            if (rawRows[j].type === "main" || rawRows[j].type === "sub") break;
            if (rawRows[j].type === "ket") {
              childKets.push(rawRows[j]);
            }
          }

          if (childKets.length > 0) {
            // Gunakan alokasi keterangan sesuai persis dengan apa yang diinput user di file Excel
            for (const ketRow of childKets) {
              parsedItems.push({
                kode: item.kode,
                main: parentMain.name,
                sub: item.name,
                ket: ketRow.name,
                alokasi: ketRow.alokasi,
                mainAlokasi: parentMain.alokasi,
                subAlokasi: item.alokasi,
              });
            }
          } else {
            // Sub Pos tanpa rincian keterangan: masukkan sub pos itu sendiri
            parsedItems.push({
              kode: item.kode,
              main: parentMain.name,
              sub: item.name,
              ket: item.name,
              alokasi: item.alokasi,
              mainAlokasi: parentMain.alokasi,
              subAlokasi: item.alokasi,
            });
          }
        }
      }
    }

    if (parsedItems.length === 0) {
      return NextResponse.json(
        { message: "Tidak ada baris data alokasi yang valid dalam file Excel tersebut" },
        { status: 400 }
      );
    }

    // Kelompokkan data per Main -> Sub -> Keterangan
    type GroupedKet = { ket: string; alokasi: number };
    type GroupedSub = {
      subName: string;
      kode?: string;
      subAlokasi?: number;
      isAnchorOnly: boolean;
      kets: GroupedKet[];
    };
    type GroupedMain = {
      mainName: string;
      mainAlokasi?: number;
      subs: Map<string, GroupedSub>;
    };

    const mainMap = new Map<string, GroupedMain>();

    for (const item of parsedItems) {
      const mainKey = item.main.toLowerCase();
      if (!mainMap.has(mainKey)) {
        mainMap.set(mainKey, {
          mainName: item.main,
          mainAlokasi: item.mainAlokasi,
          subs: new Map(),
        });
      }
      const mainGroup = mainMap.get(mainKey)!;
      if (item.mainAlokasi && (item.mainAlokasi > (mainGroup.mainAlokasi || 0))) {
        mainGroup.mainAlokasi = item.mainAlokasi;
      }

      const subKey = item.sub.toLowerCase();
      const isAnchor = item.ket.toLowerCase() === item.sub.toLowerCase();

      if (!mainGroup.subs.has(subKey)) {
        mainGroup.subs.set(subKey, {
          subName: item.sub,
          kode: item.kode || undefined,
          subAlokasi: item.subAlokasi,
          isAnchorOnly: isAnchor,
          kets: [{ ket: item.ket, alokasi: item.alokasi }],
        });
      } else {
        const subGroup = mainGroup.subs.get(subKey)!;
        if (item.kode && !subGroup.kode) {
          subGroup.kode = item.kode;
        }
        if (item.subAlokasi && (item.subAlokasi > (subGroup.subAlokasi || 0))) {
          subGroup.subAlokasi = item.subAlokasi;
        }

        if (subGroup.isAnchorOnly && !isAnchor) {
          // Ada keterangan baru yang berbeda dari nama sub.
          // Cek apakah keterangan anchor (nama = nama sub) sebenarnya ada di DB.
          // Jika ada → keterangan anchor NYATA, keep keduanya.
          // Jika tidak ada → anchor hanya placeholder dari sub-tanpa-ket, ganti saja.
          const anchorName = subGroup.kets[0]?.ket?.toLowerCase() || "";
          const existingSub = budget.mainAnggaran
            .flatMap((m) => m.subAnggaran)
            .find((s) => s.namaSub.trim().toLowerCase() === subKey);
          const anchorExistsInDb = existingSub?.keterangan?.some(
            (k) => k.keterangan.trim().toLowerCase() === anchorName
          );

          if (anchorExistsInDb) {
            // Keterangan anchor NYATA ada di DB → tambahkan keterangan baru, jangan hapus anchor
            subGroup.kets.push({ ket: item.ket, alokasi: item.alokasi });
            subGroup.isAnchorOnly = false;
          } else {
            // Anchor hanya placeholder (sub tanpa keterangan sebelumnya) → ganti
            subGroup.kets = [{ ket: item.ket, alokasi: item.alokasi }];
            subGroup.isAnchorOnly = false;
          }
        } else if (!isAnchor || subGroup.isAnchorOnly) {
          subGroup.kets.push({
            ket: item.ket,
            alokasi: item.alokasi,
          });
        }
      }
    }

    // Validasi aturan: Periksa alokasi baru vs realisasi yang sudah terpakai
    const existingMains = budget.mainAnggaran;

    for (const [mKey, mVal] of mainMap.entries()) {
      const extMain = existingMains.find(
        (m) => m.namaMain.trim().toLowerCase() === mKey
      );

      // Hitung total alokasi main dari sub & keterangan atau alokasi eksplisit
      let sumOfSubs = 0;
      for (const [sKey, sVal] of mVal.subs.entries()) {
        const sumKets = sVal.kets.reduce((sum, k) => sum + k.alokasi, 0);
        const finalSubAlokasi = Math.max(sVal.subAlokasi || 0, sumKets);
        sumOfSubs += finalSubAlokasi;

        if (extMain) {
          const extSub = extMain.subAnggaran.find(
            (s) => s.namaSub.trim().toLowerCase() === sKey
          );
          if (extSub) {
            const subTerpakai = Number(extSub.nominalTerpakai);
            if (finalSubAlokasi < subTerpakai) {
              return NextResponse.json(
                {
                  message: `Alokasi untuk sub "${extSub.namaSub}" (Rp ${finalSubAlokasi.toLocaleString("id-ID")}) tidak boleh lebih kecil dari yang sudah terpakai (Rp ${subTerpakai.toLocaleString("id-ID")})`,
                },
                { status: 400 }
              );
            }
          }
        }
      }

      const finalMainAlokasi = Math.max(mVal.mainAlokasi || 0, sumOfSubs);

      if (extMain) {
        const mainTerpakai = Number(extMain.nominalTerpakai);
        if (finalMainAlokasi < mainTerpakai) {
          return NextResponse.json(
            {
              message: `Total alokasi untuk main "${extMain.namaMain}" (Rp ${finalMainAlokasi.toLocaleString("id-ID")}) tidak boleh lebih kecil dari yang sudah terpakai (Rp ${mainTerpakai.toLocaleString("id-ID")})`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Validasi Total Nilai Proyek: Alokasi total biaya pengeluaran + pemasukan tidak boleh melebihi nilai kontrak / RAB proyek
    const nilaiKontrakTotal = Number(budget.nilaiKontrak || 0);
    if (nilaiKontrakTotal > 0) {
      // 1. Total alokasi pemasukan yang sudah ada
      const totalPemasukanExisting = budget.mainAnggaran
        .filter((m) => m.tipe === "pemasukan")
        .reduce((sum, m) => sum + Number(m.nominalAlokasi || 0), 0);

      // 2. Alokasi pengeluaran yang tidak ada di dalam file import (tetap memakai nilai saat ini)
      const existingPengeluaran = budget.mainAnggaran.filter(
        (m) => !m.tipe || m.tipe === "pengeluaran"
      );
      const unimportedPengeluaranTotal = existingPengeluaran
        .filter((m) => !mainMap.has(m.namaMain.trim().toLowerCase()))
        .reduce((sum, m) => sum + Number(m.nominalAlokasi || 0), 0);

      // 3. Total alokasi pengeluaran baru dari file Excel yang diimport
      let importedPengeluaranTotal = 0;
      for (const [, mVal] of mainMap.entries()) {
        let sumOfSubs = 0;
        for (const [, sVal] of mVal.subs.entries()) {
          const sumKets = sVal.kets.reduce((sum, k) => sum + k.alokasi, 0);
          sumOfSubs += Math.max(sVal.subAlokasi || 0, sumKets);
        }
        importedPengeluaranTotal += Math.max(mVal.mainAlokasi || 0, sumOfSubs);
      }

      const totalSemuaAlokasiBaru =
        importedPengeluaranTotal + unimportedPengeluaranTotal + totalPemasukanExisting;

      if (totalSemuaAlokasiBaru > nilaiKontrakTotal) {
        const batasBiayaMaksimal = Math.max(0, nilaiKontrakTotal - totalPemasukanExisting);
        return NextResponse.json(
          {
            message: `Total alokasi biaya pengeluaran hasil import (Rp ${(importedPengeluaranTotal + unimportedPengeluaranTotal).toLocaleString("id-ID")}) melebihi batas distribusi nilai proyek (maksimal Rp ${batasBiayaMaksimal.toLocaleString("id-ID")}, Nilai Kontrak: Rp ${nilaiKontrakTotal.toLocaleString("id-ID")}). Alokasi mentok dan tidak dapat melebihi distribusi biaya nilai proyek.`,
          },
          { status: 400 }
        );
      }
    }

    // List pengajuan alokasi main yang terbentuk
    const pengajuanCreatedList: { mainNama: string; alokasiLama: number; alokasiBaru: number }[] = [];

    // Eksekusi pembaruan dalam database transaction
    await prisma.$transaction(async (tx) => {
      // Ambil master data untuk update CoA jika diisi
      const masterMains = await tx.masterMain.findMany({
        include: { MasterSub: true },
      });

      for (const [, mVal] of mainMap.entries()) {
        let sumOfSubs = 0;
        for (const [, sVal] of mVal.subs.entries()) {
          const sumKets = sVal.kets.reduce((sum, k) => sum + k.alokasi, 0);
          sumOfSubs += Math.max(sVal.subAlokasi || 0, sumKets);
        }
        const totalMainAlokasi = Math.max(mVal.mainAlokasi || 0, sumOfSubs);

        // Cari atau buat MainAnggaran
        let mainAnggaran = await tx.mainAnggaran.findFirst({
          where: {
            budgetId: budget.id,
            tipe: "pengeluaran",
            namaMain: { equals: mVal.mainName, mode: "insensitive" },
          },
        });

        let isMainPendingApproval = false;

        if (mainAnggaran) {
          const alokasiLama = Number(mainAnggaran.nominalAlokasi);
          // Jika nominal alokasi Main pos berubah di Excel:
          // Sesuai aturan, JANGAN langsung ubah alokasi Main, melainkan ajukan ke Direktur untuk di-ACC
          if (totalMainAlokasi !== alokasiLama) {
            isMainPendingApproval = true;
            // Cek apakah sudah ada pengajuan PENDING untuk main ini
            const existingPending = await tx.pengajuanAnggaran.findFirst({
              where: {
                mainAnggaranId: mainAnggaran.id,
                status: "PENDING",
              },
            });

            // Siapkan payload pending children (sub dan keterangan) dari file Excel
            const pendingChildren = Array.from(mVal.subs.values()).map((s) => ({
              subName: s.subName,
              subAlokasi: s.subAlokasi || 0,
              kode: s.kode || null,
              kets: s.kets.map((k) => ({
                ket: k.ket,
                alokasi: k.alokasi || 0,
              })),
            }));

            const rawCatatan =
              catatanInput && catatanInput.trim()
                ? catatanInput.trim()
                : "Pengajuan perubahan alokasi dari Import Excel";

            const deskripsiJson = JSON.stringify({
              catatan: rawCatatan,
              pendingChildren,
            });

            if (!existingPending) {
              await tx.pengajuanAnggaran.create({
                data: {
                  proyekId,
                  pengajuId: userIdNum || 1,
                  mainAnggaranId: mainAnggaran.id,
                  judul: `Perubahan alokasi anggaran: ${mainAnggaran.namaMain} (Import Excel)`,
                  deskripsi: deskripsiJson,
                  alokasiLama: mainAnggaran.nominalAlokasi,
                  alokasiBaru: totalMainAlokasi,
                },
              });

              pengajuanCreatedList.push({
                mainNama: mainAnggaran.namaMain,
                alokasiLama,
                alokasiBaru: totalMainAlokasi,
              });
            } else {
              // Jika sudah ada pending sebelumnya, perbarui deskripsi payload dan alokasi barunya
              await tx.pengajuanAnggaran.update({
                where: { id: existingPending.id },
                data: {
                  deskripsi: deskripsiJson,
                  alokasiBaru: totalMainAlokasi,
                },
              });
            }
          }
        } else {
          // Jika Main pos belum ada sebelumnya di database (Main baru dari Excel)
          // Buat record Main pos baru
          mainAnggaran = await tx.mainAnggaran.create({
            data: {
              budgetId: budget.id,
              namaMain: mVal.mainName,
              nominalAlokasi: totalMainAlokasi,
              nominalTerpakai: 0,
              tipe: "pengeluaran",
            },
          });
        }

        // Temukan matched MasterMain untuk update kode MasterSub jika ada
        const matchedMasterMain = masterMains.find(
          (mm) => mm.nama.toUpperCase().trim() === mVal.mainName.toUpperCase().trim()
        );

        // Jika alokasi Main pos berubah dan sedang menunggu approval Direktur:
        // SUB dan KETERANGAN di bawah Main pos ini JANGAN diupdate ke database dulu!
        // Mereka akan otomatis diupdate saat pengajuan DISETUJUI oleh Direktur.
        // Jika DITOLAK, Main dan Sub/Ket tetap pada nilai aslinya.
        if (isMainPendingApproval) {
          continue;
        }

        // Jika Main pos tidak berubah (atau baru dibuat), validasi bahwa total sub tidak melebihi alokasi Main pos
        if (sumOfSubs > Number(mainAnggaran.nominalAlokasi)) {
          throw new Error(
            `Total alokasi sub-pos (Rp ${sumOfSubs.toLocaleString("id-ID")}) melebihi alokasi Main pos "${mainAnggaran.namaMain}" (Rp ${Number(mainAnggaran.nominalAlokasi).toLocaleString("id-ID")})`
          );
        }

        // Proses SubAnggaran
        for (const [, sVal] of mVal.subs.entries()) {
          const targetSubName = sVal.subName;
          const sumKets = sVal.kets.reduce((sum, k) => sum + k.alokasi, 0);
          const totalSubAlokasi = Math.max(sVal.subAlokasi || 0, sumKets);

          // Update kode CoA di MasterSub bila user memasukkan kode CoA di Excel
          if (sVal.kode && matchedMasterMain) {
            const matchedMasterSub = matchedMasterMain.MasterSub.find(
              (ms) => ms.nama.toUpperCase().trim() === targetSubName.toUpperCase().trim()
            );
            if (matchedMasterSub && matchedMasterSub.kode !== sVal.kode) {
              await tx.masterSub.update({
                where: { id: matchedMasterSub.id },
                data: { kode: sVal.kode },
              });
            }
          }

          let subAnggaran = await tx.subAnggaran.findFirst({
            where: {
              mainAnggaranId: mainAnggaran.id,
              namaSub: { equals: targetSubName, mode: "insensitive" },
            },
          });

          if (subAnggaran) {
            subAnggaran = await tx.subAnggaran.update({
              where: { id: subAnggaran.id },
              data: { nominalAlokasi: totalSubAlokasi },
            });
          } else {
            subAnggaran = await tx.subAnggaran.create({
              data: {
                mainAnggaranId: mainAnggaran.id,
                namaSub: targetSubName,
                nominalAlokasi: totalSubAlokasi,
                nominalTerpakai: 0,
                tipe: "pengeluaran",
              },
            });
          }

          // Proses Keterangan Anggaran
          for (const kItem of sVal.kets) {
            let ketAnggaran = await tx.keteranganAnggaran.findFirst({
              where: {
                subAnggaranId: subAnggaran.id,
                keterangan: { equals: kItem.ket, mode: "insensitive" },
              },
            });

            if (ketAnggaran) {
              await tx.keteranganAnggaran.update({
                where: { id: ketAnggaran.id },
                data: { nominalAlokasi: kItem.alokasi },
              });
            } else {
              await tx.keteranganAnggaran.create({
                data: {
                  subAnggaranId: subAnggaran.id,
                  keterangan: kItem.ket,
                  nominalAlokasi: kItem.alokasi,
                  nominalRealisasi: 0,
                },
              });
            }
          }
        }
      }
    });

    // Kirim notifikasi ke Direktur & Superadmin jika ada pengajuan alokasi yang dibuat
    if (pengajuanCreatedList.length > 0) {
      const reviewers = await prisma.user.findMany({
        where: { role: { in: ["Direktur / Manajemen", "Superadmin", "superadmin"] } },
        select: { id: true },
      });

      if (reviewers.length > 0) {
        const notifData: { userId: number; tipe: string; pesan: string }[] = [];
        for (const p of pengajuanCreatedList) {
          for (const r of reviewers) {
            notifData.push({
              userId: r.id,
              tipe: "PENGAJUAN_ANGGARAN",
              pesan: `Pengajuan alokasi baru dari Import Excel: "${p.mainNama}" (Rp ${p.alokasiBaru.toLocaleString("id-ID")}) perlu direview`,
            });
          }
        }
        await prisma.notification.createMany({ data: notifData });
      }
    }

    clearCache();

    let message = "Data detail biaya proyek berhasil diimpor dan diperbarui.";
    if (pengajuanCreatedList.length > 0) {
      const mainNames = pengajuanCreatedList.map((p) => p.mainNama).join(", ");
      message += ` Catatan: Terdapat ${pengajuanCreatedList.length} perubahan alokasi Main Pos (${mainNames}) yang telah diajukan ke Direktur dan menunggu persetujuan (ACC).`;
    }

    return NextResponse.json({
      message,
      totalProcessed: parsedItems.length,
      pengajuanCreated: pengajuanCreatedList,
    });
  } catch (error: any) {
    console.error("Import Excel error:", error);
    return NextResponse.json(
      { message: error.message || "Gagal memproses import Excel" },
      { status: 500 }
    );
  }
}
