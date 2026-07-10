import React from 'react';
import { Button } from '../../../components/ui/Button';

interface HeroSectionProps {
  hasHistory: boolean;
  onStartExam: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ hasHistory, onStartExam }) => {
  return (
    <div className="text-center py-10 sm:py-14 max-w-2xl mx-auto space-y-5">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200/60 shadow-inner">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        IFA 2026 新制考綱相容系統
      </div>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
        IFA Master Coach
      </h1>
      <p className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-lg mx-auto">
        專業輔助醫療認證級別的 AI 考官。跳脫保守的安全牌邏輯，精準訓練你的臨床調理思維與申論痛點解決能力。
      </p>
      <div className="pt-2">
        <Button onClick={onStartExam} className="px-8 py-3.5 text-base rounded-2xl shadow-md transform active:scale-98">
          {hasHistory ? '繼續模擬測驗' : '開始模擬考試'}
        </Button>
      </div>
    </div>
  );
};