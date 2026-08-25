export type ReimbursementStatus = "SUBMITTED" | "APPROVED_BY_PM" | "APPROVED" | "REJECTED";

export type StatusMeta = {
  label: string;
  badge: string;
  card: string;
  chip: string;
  nominal: string;
};

const META: Record<ReimbursementStatus | "default", StatusMeta> = {
  SUBMITTED: {
    label: "Menunggu PM",
    badge: "bg-[#fdf3e6] text-[#b46b2b]",
    card: "bg-[#fdf9f2] border-[#f5e4c0]",
    chip: "text-[#b46b2b] bg-[#fdf3e6]",
    nominal: "text-[#b46b2b]",
  },
  APPROVED_BY_PM: {
    label: "Menunggu Keuangan",
    badge: "bg-[#e1f5fe] text-[#0277bd]",
    card: "bg-[#f0f8ff] border-[#bce0f7]",
    chip: "text-[#0277bd] bg-[#e1f5fe]",
    nominal: "text-[#0277bd]",
  },
  APPROVED: {
    label: "Dicairkan",
    badge: "bg-[#e2f1eb] text-[#117a5b]",
    card: "bg-[#f0faf5] border-[#b3dece]",
    chip: "text-[#117a5b] bg-[#e2f1eb]",
    nominal: "text-[#117a5b]",
  },
  REJECTED: {
    label: "Ditolak",
    badge: "bg-[#fee2e2] text-[#be123c]",
    card: "bg-[#fff5f5] border-[#fbc9c9]",
    chip: "text-[#be123c] bg-[#fee2e2]",
    nominal: "text-[#be123c]",
  },
  default: {
    label: "",
    badge: "bg-stone-100 text-stone-600",
    card: "bg-[#fff5f5] border-[#fbc9c9]",
    chip: "text-[#be123c] bg-[#fee2e2]",
    nominal: "text-[#be123c]",
  },
};

export function statusMeta(status: string): StatusMeta {
  return META[status as ReimbursementStatus] ?? META.default;
}
