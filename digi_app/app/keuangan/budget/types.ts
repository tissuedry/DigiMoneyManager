export type PosAnggaranDB = {
  id: number;
  namaPos: string;
  nominalAlokasi: string;
  nominalTerpakai: string;
  tipe: string;
};

export type BudgetDB = {
  id: number;
  rabTotal: string;
  totalPengeluaran: string;
  sisaBudget: string;
  posAnggaran: PosAnggaranDB[];
};

export type Proyek = {
  id: number;
  nama: string;
  status: string;
  tanggalMulai: string;
  tanggalSelesai: string | null;
  budget: BudgetDB | null;
};
