import React from 'react';

interface HeroSectionProps {
  hasExamDraft: boolean;
  onResumeExam: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ hasExamDraft, onResumeExam }) => {
  return (
    <div className="home-hero bg-white rounded-2xl shadow-sm border border-slate-200 p-10 sm:p-16 text-center flex flex-col items-center w-full">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
        IFA Master Coach
      </h1>
      <p className="text-sm sm:text-base text-slate-500 mb-8 max-w-md leading-relaxed">
        您的專屬 AI 考官，協助您精準定位知識盲點，順利通過 IFA 國際芳療師認證。
      </p>
      {hasExamDraft && (
        <button onClick={onResumeExam} className="home-resume-button bg-slate-900 text-white font-medium text-sm px-8 py-3.5 rounded-xl hover:bg-slate-800 transition-colors shadow-sm active:scale-95 transform">
          繼續模擬測驗
        </button>
      )}
    </div>
  );
};
