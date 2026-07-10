import React from 'react';

interface CoachSectionProps {
  hasHistory?: boolean;
}

export const CoachSection: React.FC<CoachSectionProps> = ({ hasHistory }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 w-full flex flex-col">
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
        AI 教練
      </h2>
      <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 px-4">
        {hasHistory ? (
          <span className="text-[11px] text-slate-500 leading-relaxed">
            AI 教練尚未啟用；目前可先透過正式測驗、解析與學習進度掌握備考節奏。
          </span>
        ) : (
          <span className="text-[11px] text-slate-500 leading-relaxed">
            AI 教練尚未啟用；完成正式測驗後可先查看本週進度與今日建議。
          </span>
        )}
      </div>
    </div>
  );
};
