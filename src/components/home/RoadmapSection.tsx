import React from 'react';

export const RoadmapSection: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 w-full flex flex-col">
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">學習路線圖</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        
        {/* Active: Week 1 */}
        <div className="p-5 rounded-xl border border-slate-300 bg-slate-50 shadow-inner flex flex-col h-28 justify-center text-center">
          <span className="text-sm font-bold text-slate-800">Week 1</span>
          <span className="text-xs mt-1.5 font-medium text-slate-600">解剖與生理學</span>
          <span className="text-[10px] mt-2 font-bold uppercase tracking-wide text-emerald-600">使用中</span>
        </div>
        
        {/* Locked: Week 2-8 */}
        <div className="p-5 rounded-xl border border-slate-100 bg-white opacity-50 cursor-not-allowed select-none flex flex-col h-28 justify-center text-center">
          <span className="text-sm font-bold text-slate-400">Week 2 – 8</span>
          <span className="text-xs mt-1.5 font-medium text-slate-400">後續考綱模組</span>
          <span className="text-[10px] mt-2 font-bold uppercase tracking-wide text-slate-400">尚未開放</span>
        </div>

      </div>
    </div>
  );
};
