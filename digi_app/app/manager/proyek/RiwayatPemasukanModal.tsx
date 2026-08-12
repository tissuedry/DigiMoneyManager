import React from 'react';
import { X } from 'lucide-react';

type RiwayatItem = {
    id: number;
    namaTermin: string;
    nominal: number | string;
    tanggalPencairan: string | null;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    proyekNama: string;
    historyData?: RiwayatItem[];
};

// Helper format tanggal (contoh: 2026-05-22 -> 22 Mei 2026)
function formatDate(dateStr: string | null): string {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

// Helper format angka rupiah dengan titik
function formatNominal(val: number | string): string {
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num)) return "0";
    return num.toLocaleString("id-ID");
}

export default function RiwayatPemasukanModal({ isOpen, onClose, proyekNama, historyData = [] }: Props) {
    // Move ALL hooks to the top
    const [someState, setSomeState] = useState(false);
    const [riwayatData, setRiwayatData] = useState([]);
    const [isOpenRiwayat, setIsOpenRiwayat] = useState(false);

    // NOW you can have conditional logic
    if (!isOpen) return null;

    const fetchRiwayat = async (proyekId: number) => {
        const res = await fetch(`/api/proyek/${proyekId}/riwayat-pemasukan`);
        const json = await res.json();
        if (json.success) {
            setRiwayatData(json.data);
        }
    };
    // Saat modal dibuka, panggil fetchRiwayat(proyekId)
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden flex flex-col">

                {/* Header Modal */}
                <div className="px-6 py-5 flex justify-between items-start border-b border-stone-100">
                    <div>
                        <h2 className="text-[18px] font-bold text-stone-900">Riwayat Pemasukan</h2>
                        <p className="text-[12px] text-stone-500 mt-1">{proyekNama}</p>
                    </div>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-700 transition cursor-pointer">
                        <X size={18} />
                    </button>
                </div>

                {/* Table Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <table className="w-full text-center border-collapse">
                        <thead>
                            <tr className="bg-[#f8f6f1]">
                                <th className="py-3.5 px-4 border border-[#e6e2d6] text-[10.5px] font-extrabold text-[#a69c8a] uppercase tracking-widest w-1/3">
                                    Tanggal
                                </th>
                                <th className="py-3.5 px-4 border border-[#e6e2d6] text-[10.5px] font-extrabold text-[#a69c8a] uppercase tracking-widest w-1/3">
                                    Termin
                                </th>
                                <th className="py-3.5 px-4 border border-[#e6e2d6] text-[10.5px] font-extrabold text-[#a69c8a] uppercase tracking-widest w-1/3">
                                    Nominal
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {historyData.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="py-8 text-center text-stone-400 text-xs italic border border-[#e6e2d6]">
                                        Belum ada riwayat pemasukan yang dicairkan.
                                    </td>
                                </tr>
                            ) : (
                                historyData.map((item) => (
                                    <tr key={item.id} className="bg-white">
                                        <td className="py-4 px-4 border border-[#e6e2d6] text-[12px] font-medium text-stone-800">
                                            {formatDate(item.tanggalPencairan)}
                                        </td>
                                        <td className="py-4 px-4 border border-[#e6e2d6] text-[12px] font-bold text-stone-900">
                                            {item.namaTermin}
                                        </td>
                                        <td className="py-4 px-4 border border-[#e6e2d6] text-[12px] font-mono text-stone-800">
                                            <span className="text-stone-400 text-[10px] mr-1.5">Rp</span>
                                            {formatNominal(item.nominal)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}

function useState<S>(initialState: S | (() => S)): [S, React.Dispatch<React.SetStateAction<S>>] {
    return React.useState(initialState);
}
