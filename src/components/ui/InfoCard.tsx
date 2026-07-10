import React from 'react';
import { Card } from './Card';

interface InfoCardProps {
  label: string;
  value: string | number;
  description?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({ label, value, description }) => {
  return (
    <Card className="bg-slate-50/60 border-none shadow-none p-4 rounded-xl">
      <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="block text-lg font-bold text-slate-800 mt-0.5">{value}</span>
      {description && <span className="block text-[11px] text-slate-400 mt-0.5">{description}</span>}
    </Card>
  );
};