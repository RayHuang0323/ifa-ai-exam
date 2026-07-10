import React from 'react';

interface ExamSectionProps {
  onStartExam: () => void;
}

export const ExamSection: React.FC<ExamSectionProps> = ({ onStartExam }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="space-y-1">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">模擬考中心</h2>
        <h3 className="font-bold text-slate-800 text-sm sm:text-base">IFA 官方規格全真模擬卷</h3>
        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          目前開放：Week 1 範圍
        </p>
      </div>
      <button
        onClick={onStartExam}
        className="bg-slate-900 text-white hover:bg-slate-800 font-medium text-xs px-6 py-3 rounded-xl transition-colors w-full sm:w-auto shrink-0 shadow-sm active:scale-95 transform"
      >
        開始測驗
      </button>
    </div>
  );
};
