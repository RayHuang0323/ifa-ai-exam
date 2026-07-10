import React from 'react';
import { Card } from './Card';

interface ProgressCardProps {
  title: string;
  subtitle: string;
  percentage: number;
  remainingText: string;
  className?: string;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  subtitle,
  percentage,
  remainingText,
  className = '',
}) => {
  return (
    <Card className={`flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <span className="text-[11px] font-semibold text-slate-400">{subtitle}</span>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1">
            <span>Module 進度完成率</span>
            <span>{percentage}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-slate-900 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
      <div className="mt-4 pt-2.5 border-t border-slate-50 flex items-center gap-1 text-[11px] text-slate-400">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="truncate">{remainingText}</span>
      </div>
    </Card>
  );
};