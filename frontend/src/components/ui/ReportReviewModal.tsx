import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ReportReviewModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (type: string, detail: string) => Promise<void>;
}

const ReportReviewModal: React.FC<ReportReviewModalProps> = ({ open, onClose, onSubmit }) => {
  const [type, setType] = useState('');
  const [detail, setDetail] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) return;
    setLoading(true);
    try {
      await onSubmit(type, detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">รายงานรีวิว</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทการรายงาน</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full border rounded p-2"
              required
            >
              <option value="">-- กรุณาเลือกประเภท --</option>
              <option value="inappropriate">เนื้อหาไม่เหมาะสม</option>
              <option value="spam">สแปมหรือโฆษณา</option>
              <option value="fake">ข้อมูลเท็จ</option>
              <option value="other">อื่นๆ</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดเพิ่มเติม</label>
            <textarea
              value={detail}
              onChange={e => setDetail(e.target.value)}
              className="w-full border rounded p-2"
              rows={3}
              placeholder="กรุณาระบุรายละเอียดเพิ่มเติม..."
            />
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading || !type}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'กำลังส่ง...' : 'ส่งรายงาน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportReviewModal; 