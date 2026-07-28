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

    // Ambil data keuangan proyek beserta relasi berjenjangnya
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

    // Pengaturan lebar kolom sesuai template
    sheet.columns = [
      { header: "", key: "nama", width: 65 }, 
      { header: "", key: "rab", width: 25 },
      { header: "", key: "realisasi", width: 25 },
    ];

    // Definisi Styling
    const darkGreyFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF595959" } };
    const lightGreyFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF969696" } };
    const whiteFont = { bold: true, color: { argb: "FFFFFFFF" } };
    const blackFont = { bold: true, color: { argb: "FF000000" } };
    const normalFont = { bold: false, color: { argb: "FF000000" } };
    const reimbFont = { italic: true, color: { argb: "FF5A5A5A" } }; 

    // Row 1: Kosong (Sesuai dengan struktur asli template Excel)
    sheet.addRow({});

    // Row 2: Judul Laporan
    const row2 = sheet.addRow({
      nama: "  5 BIAYA PROYEK / COST OF REVENUE",
      rab: "",
      realisasi: "",
    });
    row2.font = whiteFont;
    row2.fill = darkGreyFill as ExcelJS.FillPattern;

    // Row 3: Sub-judul Kolom
    const row3 = sheet.addRow({
      nama: "    Nilai Proyek",
      rab: "RAB",
      realisasi: "REALISASI",
    });
    row3.font = whiteFont;
    row3.fill = darkGreyFill as ExcelJS.FillPattern;

    proyek.budget.mainAnggaran.forEach((main, mIdx) => {
      const mainNum = `5.${mIdx + 1}`;
      
      let totalRealisasiMain = 0;

      // Kalkulasi total realisasi untuk sub dan main dari keterangan
      const subAnggaranCalculated = main.subAnggaran.map((sub) => {
        let totalRealisasiSub = 0;
        if (sub.keterangan && sub.keterangan.length > 0) {
          sub.keterangan.forEach((ket) => {
            totalRealisasiSub += Number(ket.nominalRealisasi) || 0;
          });
        }
        totalRealisasiMain += totalRealisasiSub;
        return { ...sub, totalRealisasiSub };
      });

      // ── Level 1: Main Anggaran ──
      const mainRow = sheet.addRow({
        nama: `        ${mainNum} ${main.namaMain}`,
        rab: Number(main.nominalAlokasi) || 0,
        realisasi: totalRealisasiMain,
      });
      mainRow.font = whiteFont;
      mainRow.fill = lightGreyFill as ExcelJS.FillPattern;

      // ── Level 2: Sub Anggaran ──
      subAnggaranCalculated.forEach((sub, sIdx) => {
        // Menggunakan padStart agar format nomor sub selalu 2 digit (contoh: 5.3.01)
        const subNum = `${mainNum}.${String(sIdx + 1).padStart(2, '0')}`;
        const subRow = sheet.addRow({
          nama: `            ${subNum} ${sub.namaSub}`,
          rab: Number(sub.nominalAlokasi) || 0,
          realisasi: sub.totalRealisasiSub,
        });
        subRow.font = blackFont; 

        // ── Level 3: Keterangan ──
        if (sub.keterangan && sub.keterangan.length > 0) {
          sub.keterangan.forEach((ket, kIdx) => {
            // Menggunakan padStart agar format nomor ket selalu 2 digit (contoh: 5.3.01.01)
            const ketNum = `${subNum}.${String(kIdx + 1).padStart(2, '0')}`;
            
            // Render Baris Keterangan
            const ketRow = sheet.addRow({
              nama: `                ${ketNum} ${ket.keterangan}`,
              rab: Number(ket.nominalAlokasi) || 0,
              realisasi: Number(ket.nominalRealisasi) || 0,
            });
            ketRow.font = normalFont;

            // ── Level 4: REIMBURSEMENT / REALISASI (Hanya yang APPROVED) ──
            if (ket.reimbursements && ket.reimbursements.length > 0) {
              ket.reimbursements.forEach((reimb) => {
                let tglStr = "";
                
                // Gunakan kolom tanggalStruk langsung
                if (reimb.tanggalStruk) {
                  const d = new Date(reimb.tanggalStruk);
                  if (!isNaN(d.getTime())) {
                    tglStr = d.toLocaleDateString("id-ID", { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    }) + " ";
                  }
                }

                // Gunakan kolom nama langsung
                const namaReimb = reimb.nama || "Pengajuan";

                // Bedakan label berdasarkan tipe pengajuan
                const labelTipe = reimb.tipe === "Realisasi Anggaran" ? "REALISASI PM" : "REIMB";

                // Render Baris Reimbursement
                const reimbRow = sheet.addRow({
                  nama: `                    ${labelTipe} ${namaReimb} ${tglStr}[Dicairkan]`,
                  rab: "", 
                  realisasi: Number(reimb.nominal) || 0,
                });
                
                reimbRow.font = reimbFont;
              });
            }
          });
        }
      });
      
      // Berikan baris kosong sebagai pemisah antar Main Anggaran
      sheet.addRow({}); 
    });

    // Format Accounting Rupiah di Excel: _-* #,##0_-;-* #,##0_-;_-* "-"_-;_-@_-
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