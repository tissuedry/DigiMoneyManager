import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const proyekId = parseInt(resolvedParams.id);

    if (isNaN(proyekId)) {
      return NextResponse.json(
        { error: "ID Proyek tidak valid." },
        { status: 400 }
      );
    }

    // Ambil data keuangan proyek
    const proyek = await prisma.proyek.findUnique({
      where: { id: proyekId },
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
    const sheet = workbook.addWorksheet("Laporan Budget");

    sheet.columns = [
      { header: "", key: "nama", width: 65 }, 
      { header: "", key: "rab", width: 25 },
      { header: "", key: "realisasi", width: 25 },
    ];

    const darkGreyFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF595959" } };
    const lightGreyFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF969696" } };
    const whiteFont = { bold: true, color: { argb: "FFFFFFFF" } };
    const blackFont = { bold: true, color: { argb: "FF000000" } };
    const reimbFont = { italic: true, color: { argb: "FF5A5A5A" } }; 

    // Row 1: Judul Laporan
    const row1 = sheet.addRow({
      nama: "  5 BIAYA PROYEK / COST OF REVENUE",
      rab: "",
      realisasi: "",
    });
    row1.font = whiteFont;
    row1.fill = darkGreyFill as ExcelJS.FillPattern;

    // Row 2: Sub-judul Kolom
    const row2 = sheet.addRow({
      nama: "    Nilai Proyek",
      rab: "RAB",
      realisasi: "REALISASI",
    });
    row2.font = whiteFont;
    row2.fill = darkGreyFill as ExcelJS.FillPattern;

    proyek.budget.mainAnggaran.forEach((main, mIdx) => {
      const mainNum = `5.${mIdx + 1}`;

      // Level 1: Main Anggaran
      const mainRow = sheet.addRow({
        nama: `        ${mainNum} ${main.namaMain}`,
        rab: Number(main.nominalAlokasi) || 0,
        realisasi: Number(main.nominalTerpakai) || 0,
      });
      mainRow.font = whiteFont;
      mainRow.fill = lightGreyFill as ExcelJS.FillPattern;

      // Level 2: Sub Anggaran
      main.subAnggaran.forEach((sub, sIdx) => {
        const subNum = `${mainNum}.0${sIdx + 1}`;
        const subRow = sheet.addRow({
          nama: `            ${subNum} ${sub.namaSub}`,
          rab: Number(sub.nominalAlokasi) || 0,
          realisasi: Number(sub.nominalTerpakai) || 0,
        });
        subRow.font = blackFont; 

        // Level 3: Keterangan
        if (sub.keterangan && sub.keterangan.length > 0) {
          sub.keterangan.forEach((ket, kIdx) => {
            const ketNum = `${subNum}.0${kIdx + 1}`;
            sheet.addRow({
              nama: `                ${ketNum} ${ket.keterangan}`,
              rab: Number(ket.nominalAlokasi) || 0,
              realisasi: Number(ket.nominalRealisasi) || 0,
            });

            // Level 4: REIMBURSEMENT (Hanya yang APPROVED)
            if (ket.reimbursements && ket.reimbursements.length > 0) {
              ket.reimbursements.forEach((reimb) => {
                let tglStr = "";
                if (reimb.ocrData && typeof reimb.ocrData === 'object' && 'tanggal' in reimb.ocrData) {
                  const d = new Date((reimb.ocrData as any).tanggal);
                  if (!isNaN(d.getTime())) {
                    tglStr = d.toLocaleDateString("id-ID", { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    }) + " ";
                  }
                }

                // Render Baris Reimbursement
                const reimbRow = sheet.addRow({
                  nama: `                    REIMB · ${reimb.user.nama} · ${tglStr}[Dicairkan]`,
                  rab: "", 
                  realisasi: Number(reimb.nominal) || 0,
                });
                
                reimbRow.font = reimbFont;
              });
            }
          });
        }
      });
      sheet.addRow({});
    });

    sheet.getColumn(2).numFmt = '_-* #,##0_-;-* #,##0_-;_-* "-"_-;_-@_-';
    sheet.getColumn(3).numFmt = '_-* #,##0_-;-* #,##0_-;_-* "-"_-;_-@_-';

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="Laporan_Budget_${proyek.nama.replace(/\s+/g,"_")}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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