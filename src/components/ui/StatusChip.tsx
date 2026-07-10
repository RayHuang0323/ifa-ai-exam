import React from 'react';

interface StatusChipProps {
  label: string;
  isActive?: boolean;
}

export const StatusChip: React.FC<StatusChipProps> = ({ label, isActive = false }) => {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase border ${
        isActive
          ? 'bg-slate-900 text-white border-transparent'
          : 'bg-slate-50 text-slate-400 border-slate-200'
      }`}
    >
      {label}
    </span>
  );
};