import { useState, FC } from 'react';
import CompactNominal from '@/components/compact-nominal';

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (alasan: string) => void;
  data?: {
    merchant: string;
    userName: string;
    nominal: number;
  };
  isLoading?: boolean;
}

const RejectModal: FC<RejectModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  data, 
  isLoading = false 
}) => {
  const [alasan, setAlasan] = useState('');

  const handleSubmit = () => {
    if (!alasan.trim()) return;
    onSubmit(alasan);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Tolak Pengajuan</h2>
          {data && (
            <p className="mt-1 text-sm text-gray-500">
              {data.merchant} &middot; {data.userName} &middot; {<CompactNominal value={data.nominal} compactThreshold={100_000_000_000} />}
            </p>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="alasan" className="mb-2 block text-sm font-semibold text-gray-900">
            Alasan <span className="text-red-500">*</span>
          </label>
          <textarea
            id="alasan"
            rows={4}
            className="w-full rounded-xl border border-[#E5E5E5] p-4 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            placeholder="Jelaskan alasan penolakan..."
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
          />
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full rounded-2xl border border-[#E5E5E5] bg-white py-3.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!alasan.trim() || isLoading}
            className="w-full rounded-2xl bg-black py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:bg-gray-400"
          >
            {isLoading ? 'Mengirim...' : 'Kirim Penolakan'}
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default RejectModal;