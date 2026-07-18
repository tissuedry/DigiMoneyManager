export type Project = {
  id: number;
  nama: string;
  deskripsi: string | null;
  status: string;
  tanggalMulai: string;
  tanggalSelesai: string | null;
  budget?: {
    id: number;
    rabTotal: string;
    totalPengeluaran: string;
    totalReimbursement: string;
    sisaBudget: string;
    posAnggaran: { id: number; namaPos: string; nominalAlokasi: string; deskripsi?: string }[];
  } | null;
};

export type LogAktivitas = {
  id: number;
  tanggal: string;
  tipe: "INFLOW" | "OUTFLOW";
  keterangan: string;
  nominal: number;
  kategori: string;
};

export type Member = {
  id: number;
  nama: string;
  email: string;
  role: string;
  divisi: string | null;
};