import React from 'react';

interface RecentActivitySectionProps {
  hasHistory: boolean;
}

export const RecentActivitySection: React.FC<RecentActivitySectionProps> = ({ hasHistory }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 w-full flex flex-col">
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">最近學習紀錄</h2>
      <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <span className="text-slate-500 text-xs font-semibold">
          {!hasHistory ? '尚無學習紀錄' : '正在整理資料...'}
        </span>
        <span className="text-slate-400 text-[11px] mt-1">
          {!hasHistory ? '完成試卷考核後，歷史成績將在此顯示。' : '正在準備您的歷史數據分析。'}
        </span>
      </div>
    </div>
  );
};
