export function formatReimbursementDate(r: any): string {
  const ocrTanggal = r.ocrData && typeof r.ocrData === 'object' && 'tanggal' in r.ocrData ? (r.ocrData as any).tanggal : null;
  if (ocrTanggal) {
    const d = new Date(ocrTanggal);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }
  const ocrSubmitted = r.ocrData && typeof r.ocrData === 'object' && 'submittedAt' in r.ocrData ? (r.ocrData as any).submittedAt : null;
  const rawDate = r.createdAt || r.timestamp || ocrSubmitted;
  if (rawDate) {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }
  return "-";
}

export const formatRupiah = (valStr: string | number | undefined) => {
  if (!valStr) return "Rp 0";
  const num = typeof valStr === "string" ? parseFloat(valStr) : valStr;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatSummaryRupiah = (num: number) => {
  if (num >= 1e9) return `Rp ${(num / 1e9).toFixed(2)} M`;
  if (num >= 1e6) return `Rp ${(num / 1e6).toFixed(2)} jt`;
  if (num >= 1e3) return `Rp ${(num / 1e3).toFixed(2)} rb`;
  return `Rp ${num.toFixed(2)}`;
};

export const formatRibuan = (value: string) => {
  const angkaMurni = value.replace(/[^0-9]/g, "");
  if (!angkaMurni) return "";
  return angkaMurni.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const ribuanToNumber = (stringRibuan: string) => {
  if (!stringRibuan) return 0;
  return parseFloat(stringRibuan.replace(/\./g, "")) || 0;
};

export const getStatusStyles = (status: string) => {
  switch (status.toUpperCase()) {
    case "PLANNING":
      return "bg-[#f5ebd7] text-[#935a16] border-transparent";
    case "AKTIF":
    case "ACTIVE":
      return "bg-[#d8f3dc] text-[#1b4332] border-transparent";
    case "CANCELED":
      return "bg-rose-50 text-rose-700 border-rose-100";
    case "DONE":
      return "bg-purple-50 text-purple-700 border-purple-100";
    default:
      return "bg-stone-50 text-stone-500 border-stone-100";
  }
};