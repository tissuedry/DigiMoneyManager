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

    const proyek = await prisma.proyek.findUnique({
      where: { id: proyekId },
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
    const darkGreyFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF595959" } };
    const lightGreyFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF969696" } };
    const whiteFont = { bold: true, color: { argb: "FFFFFFFF" } };
    const blackFont = { bold: true, color: { argb: "FF000000" } };
    const normalFont = { bold: false, color: { argb: "FF000000" } };
    const reimbFont = { italic: true, color: { argb: "FF5A5A5A" } };
    const proyekNameFont = { bold: true, size: 14, color: { argb: "FF000000" } };

    // ==========================================
    // SHEET 1: PEMASUKAN
    // ==========================================
    const sheetPemasukan = workbook.addWorksheet("Pemasukan");

    sheetPemasukan.columns = [
      { header: "", key: "nama", width: 65 }, 
      { header: "", key: "pendapatan", width: 30 },
    ];

    const row1Pem = sheetPemasukan.addRow({
      nama: `PROYEK : ${proyek.nama}`,
      pendapatan: "",
    });
    row1Pem.font = proyekNameFont;
    row1Pem.height = 24;

    const row2Pem = sheetPemasukan.addRow({
      nama: "  4 PENDAPATAN PROYEK / OPERATING REVENUE",
      pendapatan: "PENDAPATAN",
    });
    row2Pem.font = whiteFont;
    row2Pem.fill = darkGreyFill as ExcelJS.FillPattern;

    let grandTotalPemasukan = 0;
    
    // Tarik total Termin
    let totalTermin = 0;
    let hasTermin = false;
    if (proyek.terminPembayaran && proyek.terminPembayaran.length > 0) {
      hasTermin = true;
      proyek.terminPembayaran.forEach(t => {
        totalTermin += Number(t.nominal) || 0;
      });
    }

    // Ambil data Pos Pemasukan
    let pemasukanMains = proyek.budget.mainAnggaran.filter(m => m.tipe === "pemasukan");
    
    // Jika tidak ada pos pemasukan dari budget sama sekali TAPI ada termin,
    // kita "paksa" buat objek Penjualan Jasa dummy agar termin bisa masuk
    if (pemasukanMains.length === 0 && hasTermin) {
       pemasukanMains = [
         {
           id: 99999, // dummy ID
           budgetId: proyek.budget.id,
           namaMain: "Penjualan Jasa",
           nominalAlokasi: totalTermin,
           tipe: "pemasukan",
           nominalTerpakai: 0,
           subAnggaran: [
             {
               id: 99999, // dummy ID
               mainAnggaranId: 99999,
               namaSub: "Penjualan Jasa",
               nominalAlokasi: totalTermin,
               nominalTerpakai: 0,
               keterangan: []
             }
           ]
         } as any 
       ];
    }

    const pemasukanData = pemasukanMains.map((main) => {
      let totalMain = 0;
      const isPenjualanJasa = main.namaMain.trim().toUpperCase() === "PENJUALAN JASA";

      const subs = main.subAnggaran.map((sub) => {
        let totalSub = 0;
        const isSubPenjualanJasa = sub.namaSub.trim().toUpperCase() === "PENJUALAN JASA";

        if (sub.keterangan && sub.keterangan.length > 0) {
          sub.keterangan.forEach((ket) => {
            totalSub += Number(ket.nominalRealisasi) || 0; 
          });
        } else {
          totalSub += Number(sub.nominalAlokasi) || 0;
        }
        
        // --- INJEKSI TERMIN ---
        // Jika ini adalah Sub Anggaran "PENJUALAN JASA", tambahkan totalTermin ke totalSub-nya
        // Catatan: Jika ingin Termin di-render sebagai baris "keterangan" di bawah Sub Anggaran,
        // kita akan buat formatnya nanti saat rendering baris Excel. 
        if (isPenjualanJasa && isSubPenjualanJasa && hasTermin) {
           // Jika sebelumnya totalSub didapat dari alokasi, kita override pakai Termin
           // Atau jika ditambahkan sebagai realisasi tambahan
           totalSub = totalTermin; 
        }

        totalMain += totalSub;
        return { ...sub, totalSub, isSubPenjualanJasa };
      });
      
      grandTotalPemasukan += totalMain;
      return { ...main, totalMain, subs, isPenjualanJasa };
    });

    const finalTotalPendapatan = grandTotalPemasukan > 0 
      ? grandTotalPemasukan 
      : (Number(proyek.budget.totalPemasukan) || 0);

    const row3Pem = sheetPemasukan.addRow({
      nama: "    NILAI PROYEK",
      pendapatan: finalTotalPendapatan,
    });
    row3Pem.font = whiteFont;
    row3Pem.fill = darkGreyFill as ExcelJS.FillPattern;

    if (pemasukanMains.length > 0) {
      pemasukanData.forEach((main, mIdx) => {
        const mainNum = `4.${mIdx + 1}`;
        const mainRow = sheetPemasukan.addRow({
          nama: `        ${mainNum} ${main.namaMain.toUpperCase()}`,
          pendapatan: main.totalMain,
        });
        mainRow.font = whiteFont;
        mainRow.fill = lightGreyFill as ExcelJS.FillPattern;

        main.subs.forEach((sub, sIdx) => {
          const subNum = `${mainNum}.${String(sIdx + 1).padStart(2, '0')}`;
          const subRow = sheetPemasukan.addRow({
            nama: `            ${subNum} ${sub.namaSub}`,
            pendapatan: sub.totalSub,
          });
          subRow.font = blackFont;

          // Render keterangan reimbursement asli (jika ada)
          if (sub.keterangan && sub.keterangan.length > 0) {
            sub.keterangan.forEach((ket) => {
              const ketRow = sheetPemasukan.addRow({
                nama: `                ${ket.keterangan}`,
                pendapatan: Number(ket.nominalRealisasi) || 0,
              });
              ketRow.font = normalFont;
            });
          }

          // --- RENDER TERMIN ---
          // Jika ini adalah Pos Penjualan Jasa, render Termin sebagai rincian (seperti keterangan)
          if (main.isPenjualanJasa && sub.isSubPenjualanJasa && hasTermin) {
             proyek.terminPembayaran.forEach((termin) => {
               const ketRow = sheetPemasukan.addRow({
                 nama: `                [Termin] ${termin.namaTermin}`,
                 pendapatan: Number(termin.nominal) || 0,
               });
               ketRow.font = normalFont;
             });
          }
        });
        sheetPemasukan.addRow({}); 
      });
    }

    sheetPemasukan.getColumn(2).numFmt = '_-"Rp"* #,##0_-;-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-';


    // ==========================================
    // SHEET 2: PENGELUARAN
    // ==========================================
    const sheetPengeluaran = workbook.addWorksheet("Pengeluaran");

    sheetPengeluaran.columns = [
      { header: "", key: "nama", width: 65 }, 
      { header: "", key: "rab", width: 25 },
      { header: "", key: "realisasi", width: 25 },
    ];

    const row1Peng = sheetPengeluaran.addRow({
      nama: `PROYEK : ${proyek.nama}`,
      rab: "",
      realisasi: "",
    });
    row1Peng.font = proyekNameFont;
    row1Peng.height = 24;

    const row2Peng = sheetPengeluaran.addRow({
      nama: "  5 BIAYA PROYEK / COST OF REVENUE",
      rab: "ALOKASI",
      realisasi: "REALISASI",
    });
    row2Peng.font = whiteFont;
    row2Peng.fill = darkGreyFill as ExcelJS.FillPattern;

    let grandTotalAlokasiPengeluaran = 0;
    let grandTotalRealisasiPengeluaran = 0;
    
    const pengeluaranMains = proyek.budget.mainAnggaran.filter(m => m.tipe === "pengeluaran" || !m.tipe);

    const pengeluaranDataCalculated = pengeluaranMains.map((main) => {
      let totalRealisasiMain = 0;

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

      grandTotalAlokasiPengeluaran += Number(main.nominalAlokasi) || 0;
      grandTotalRealisasiPengeluaran += totalRealisasiMain;

      return { ...main, totalRealisasiMain, subAnggaranCalculated };
    });

    const row3Peng = sheetPengeluaran.addRow({
      nama: "    NILAI PROYEK",
      rab: grandTotalAlokasiPengeluaran,
      realisasi: grandTotalRealisasiPengeluaran,
    });
    row3Peng.font = whiteFont;
    row3Peng.fill = darkGreyFill as ExcelJS.FillPattern;

    pengeluaranDataCalculated.forEach((main, mIdx) => {
      const mainNum = `5.${mIdx + 1}`;

      const mainRow = sheetPengeluaran.addRow({
        nama: `        ${mainNum} ${main.namaMain.toUpperCase()}`,
        rab: Number(main.nominalAlokasi) || 0,
        realisasi: main.totalRealisasiMain,
      });
      mainRow.font = whiteFont;
      mainRow.fill = lightGreyFill as ExcelJS.FillPattern;

      main.subAnggaranCalculated.forEach((sub, sIdx) => {
        const subNum = `${mainNum}.${String(sIdx + 1).padStart(2, '0')}`;
        const subRow = sheetPengeluaran.addRow({
          nama: `            ${subNum} ${sub.namaSub}`,
          rab: Number(sub.nominalAlokasi) || 0,
          realisasi: sub.totalRealisasiSub,
        });
        subRow.font = blackFont; 

        if (sub.keterangan && sub.keterangan.length > 0) {
          sub.keterangan.forEach((ket) => {
            const ketRow = sheetPengeluaran.addRow({
              nama: `                ${ket.keterangan}`,
              rab: Number(ket.nominalAlokasi) || 0,
              realisasi: Number(ket.nominalRealisasi) || 0,
            });
            ketRow.font = normalFont;

            if (ket.reimbursements && ket.reimbursements.length > 0) {
              ket.reimbursements.forEach((reimb) => {
                let tglStr = "";
                
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

                const namaReimb = reimb.nama || "Pengajuan";
                const labelTipe = reimb.tipe === "Realisasi Anggaran" ? "REALISASI PM" : "REIMB";

                const reimbRow = sheetPengeluaran.addRow({
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
      sheetPengeluaran.addRow({}); 
    });

    sheetPengeluaran.getColumn(2).numFmt = '_-"Rp"* #,##0_-;-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-';
    sheetPengeluaran.getColumn(3).numFmt = '_-"Rp"* #,##0_-;-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-';

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="Laporan_Keuangan_${proyek.nama.replace(/\s+/g,"_")}.xlsx"`,
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