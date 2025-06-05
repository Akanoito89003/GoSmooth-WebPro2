import React, { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

interface ReviewOptionsMenuProps {
  isOwner: boolean;
  onDelete?: () => void;
  onReport?: () => void;
}

const ReviewOptionsMenu: React.FC<ReviewOptionsMenuProps> = ({ isOwner, onDelete, onReport }) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        aria-label="more options"
        onClick={() => setOpen((v) => !v)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
      >
        <MoreHorizontal size={22} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 28,
            minWidth: 120,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)',
            zIndex: 100,
          }}
        >
          {isOwner ? (
            <button
              onClick={() => { setOpen(false); onDelete && onDelete(); }}
              style={{ width: '100%', padding: '10px 16px', color: '#ef4444', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderRadius: 8 }}
            >
              ลบโพสต์
            </button>
          ) : (
            <button
              onClick={() => { setOpen(false); onReport && onReport(); }}
              style={{ width: '100%', padding: '10px 16px', color: '#f59e0b', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderRadius: 8 }}
            >
              รายงานโพสต์
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewOptionsMenu; 