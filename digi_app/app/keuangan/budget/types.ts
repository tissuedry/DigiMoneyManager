export type PosAnggaranDB = {
  id: number;
  namaPos: string;
  kode?: string | null;
  nominalAlokasi: string;
  nominalTerpakai: string;
  tipe: string;
};

export type BudgetDB = {
  id: number;
  nilaiKontrak: string;
  totalPengeluaran: string;
  sisaBudget: string;
  posAnggaran: PosAnggaranDB[];
};

export type Proyek = {
  id: number;
  nomorRegister?: string | null;
  nama: string;
  status: string;
  tanggalMulai: string;
  tanggalSelesai: string | null;
  budget: BudgetDB | null;
};
