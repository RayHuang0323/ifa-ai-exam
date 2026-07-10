import React from 'react';

export const MissionSection: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 w-full flex flex-col">
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">今日任務</h2>
      <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 px-4">
        <span className="text-xs font-semibold text-slate-500">Coming Soon</span>
        <span className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
          個人化每日任務功能即將推出。
        </span>
      </div>
    </div>
  );
};
