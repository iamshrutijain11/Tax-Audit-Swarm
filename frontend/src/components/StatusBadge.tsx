import React from 'react';
import type { Status } from '../api/client';

interface StatusBadgeProps {
  status: Status | string;
  size?: 'sm' | 'md';
}

const labelMap: Record<string, string> = {
  APPROVED: 'Approved',
  FLAGGED: 'Flagged',
  MANUAL_REVIEW: 'Manual Review',
  PENDING: 'Pending',
  EXTRACTED: 'Extracted',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status?.toUpperCase().replace(/ /g, '_');
  const label = labelMap[normalized] ?? status;

  const classMap: Record<string, string> = {
    APPROVED: 'status-approved',
    FLAGGED: 'status-flagged',
    MANUAL_REVIEW: 'status-manual_review',
    PENDING: 'status-pending',
    EXTRACTED: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  };

  const cls = classMap[normalized] ?? 'bg-slate-500/10 text-slate-400 border border-slate-500/20';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${cls} ${
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      }`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: 'currentColor' }}
      />
      {label}
    </span>
  );
};

export default StatusBadge;
