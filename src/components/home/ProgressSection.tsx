import React from 'react';

export const ProgressSection: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 w-full flex flex-col">
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">學習進度</h2>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl mb-4">
        <div>
          <span className="block text-xs text-slate-400 font-medium">當前開放模組</span>
          <span className="text-sm font-semibold text-slate-800 mt-1 block">Week 1: 人體解剖與生理學</span>
        </div>
        <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100">
          使用中
        </span>
      </div>
      <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <span className="text-[11px] font-medium text-slate-400">更多分析功能建置中</span>
      </div>
    </div>
  );
};
